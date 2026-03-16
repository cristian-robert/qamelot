import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';
import type { UpdateTestResultInput, TestRunResultSummary } from '@app/shared';
import { TestResultStatus, TestRunStatus } from '@app/shared';

/** Input shape for submitting a result — accepts the full enum for DTO compatibility */
interface SubmitResultData {
  testRunCaseId: string;
  status: TestResultStatus;
  comment?: string;
  elapsed?: number;
}

@Injectable()
export class TestResultsService {
  private readonly logger = new Logger(TestResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runEventsService: RunEventsService,
  ) {}

  async submit(runId: string, executedById: string, data: SubmitResultData) {
    const run = await this.verifyRun(runId);
    await this.verifyRunCaseBelongsToRun(data.testRunCaseId, runId);

    const result = await this.prisma.testResult.create({
      data: {
        testRunCaseId: data.testRunCaseId,
        testRunId: runId,
        executedById,
        status: data.status,
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.elapsed !== undefined && { elapsed: data.elapsed }),
      },
      include: {
        executedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await this.updateRunStatus(runId, run.status);

    this.logger.log(`Result submitted for run ${runId}, case ${data.testRunCaseId}`);

    await this.emitProgressEvent(runId, data.testRunCaseId, result);

    return result;
  }

  async findAllByRun(runId: string) {
    await this.verifyRun(runId);

    return this.prisma.testResult.findMany({
      where: { testRunId: runId },
      orderBy: { createdAt: 'desc' },
      include: {
        executedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(resultId: string, data: UpdateTestResultInput) {
    const result = await this.prisma.testResult.findUnique({
      where: { id: resultId },
    });
    if (!result) {
      throw new NotFoundException('Test result not found');
    }

    const updated = await this.prisma.testResult.update({
      where: { id: resultId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.elapsed !== undefined && { elapsed: data.elapsed }),
      },
      include: {
        executedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await this.updateRunStatus(result.testRunId);

    await this.emitProgressEvent(result.testRunId, result.testRunCaseId, updated);

    return updated;
  }

  async getRunWithSummary(runId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, deletedAt: null },
      include: {
        testPlan: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        testRunCases: {
          include: {
            suite: { select: { id: true, name: true } },
            testResults: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                executedBy: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Test run not found');
    }

    const summary = this.calculateSummary(run.testRunCases);

    return {
      ...run,
      testRunCases: run.testRunCases.map((trc) => ({
        ...trc,
        latestResult: trc.testResults[0] ?? null,
        testResults: undefined,
      })),
      summary,
    };
  }

  calculateSummary(
    testRunCases: Array<{ testResults: Array<{ status: string }> }>,
  ): TestRunResultSummary {
    const total = testRunCases.length;
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let retest = 0;
    let untested = 0;

    for (const trc of testRunCases) {
      const latestStatus = trc.testResults[0]?.status;
      switch (latestStatus) {
        case TestResultStatus.PASSED:
          passed++;
          break;
        case TestResultStatus.FAILED:
          failed++;
          break;
        case TestResultStatus.BLOCKED:
          blocked++;
          break;
        case TestResultStatus.RETEST:
          retest++;
          break;
        default:
          untested++;
          break;
      }
    }

    return { total, passed, failed, blocked, retest, untested };
  }

  private async emitProgressEvent(
    runId: string,
    testRunCaseId: string,
    latestResult: Record<string, unknown>,
  ): Promise<void> {
    const testRunCases = await this.prisma.testRunCase.findMany({
      where: { testRunId: runId },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const summary = this.calculateSummary(testRunCases);

    const run = await this.prisma.testRun.findUnique({
      where: { id: runId },
      select: { status: true },
    });

    this.runEventsService.emitUpdate({
      runId,
      summary,
      updatedCase: {
        testRunCaseId,
        latestResult: latestResult as never,
      },
      runStatus: (run?.status ?? TestRunStatus.PENDING) as TestRunStatus,
    });
  }

  private async updateRunStatus(runId: string, currentStatus?: string) {
    const testRunCases = await this.prisma.testRunCase.findMany({
      where: { testRunId: runId },
      include: {
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const hasAnyResult = testRunCases.some((trc) => trc.testResults.length > 0);
    const allHaveResults = testRunCases.every(
      (trc) =>
        trc.testResults.length > 0 &&
        trc.testResults[0].status !== TestResultStatus.UNTESTED,
    );

    if (allHaveResults && testRunCases.length > 0) {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'COMPLETED' },
      });
      this.logger.log(`Run ${runId} auto-completed — all cases have results`);
    } else if (hasAnyResult && (currentStatus === 'PENDING' || currentStatus === undefined)) {
      const run = currentStatus === undefined
        ? await this.prisma.testRun.findUnique({ where: { id: runId }, select: { status: true } })
        : null;
      const status = currentStatus ?? run?.status;
      if (status === 'PENDING') {
        await this.prisma.testRun.update({
          where: { id: runId },
          data: { status: 'IN_PROGRESS' },
        });
        this.logger.log(`Run ${runId} auto-started — first result submitted`);
      }
    }
  }

  private async verifyRun(runId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, deletedAt: null },
    });
    if (!run) {
      throw new NotFoundException('Test run not found');
    }
    return run;
  }

  private async verifyRunCaseBelongsToRun(testRunCaseId: string, runId: string) {
    const trc = await this.prisma.testRunCase.findFirst({
      where: { id: testRunCaseId, testRunId: runId },
    });
    if (!trc) {
      throw new BadRequestException('Test run case does not belong to this run');
    }
    return trc;
  }
}
