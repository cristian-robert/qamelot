import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';
import { CsvService } from '../test-cases/csv.service';
import type { UpdateTestResultInput, TestRunResultSummary } from '@app/shared';
import { TestResultStatus, TestRunStatus } from '@app/shared';

interface StepResultData {
  testCaseStepId: string;
  status: TestResultStatus;
  actualResult?: string;
}

/** Input shape for submitting a result */
interface SubmitResultData {
  testRunCaseId: string;
  status: TestResultStatus;
  statusOverride?: boolean;
  comment?: string;
  elapsed?: number;
  stepResults?: StepResultData[];
}

@Injectable()
export class TestResultsService {
  private readonly logger = new Logger(TestResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runEventsService: RunEventsService,
    private readonly csvService: CsvService,
  ) {}

  async submit(runId: string, executedById: string, data: SubmitResultData) {
    const run = await this.verifyRun(runId);
    this.rejectIfClosed(run);
    await this.verifyRunCaseBelongsToRun(data.testRunCaseId, runId);

    const derivedStatus = data.stepResults?.length && !data.statusOverride
      ? this.deriveStatusFromSteps(data.stepResults)
      : data.status;

    const result = await this.prisma.testResult.create({
      data: {
        testRunCaseId: data.testRunCaseId,
        testRunId: runId,
        executedById,
        status: derivedStatus,
        statusOverride: data.statusOverride ?? false,
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.elapsed !== undefined && { elapsed: data.elapsed }),
        ...(data.stepResults?.length && {
          testStepResults: {
            create: data.stepResults.map((sr) => ({
              testCaseStepId: sr.testCaseStepId,
              status: sr.status,
              ...(sr.actualResult !== undefined && { actualResult: sr.actualResult }),
            })),
          },
        }),
      },
      include: {
        executedBy: { select: { id: true, name: true, email: true } },
        testStepResults: true,
      },
    });

    await this.updateRunStatus(runId, run.status);

    this.logger.log(`Result submitted for run ${runId}, case ${data.testRunCaseId}`);

    const resultForEvent = {
      ...result,
      stepResults: result.testStepResults,
      testStepResults: undefined,
    };

    await this.emitProgressEvent(runId, data.testRunCaseId, resultForEvent);

    return resultForEvent;
  }

  async bulkSubmit(
    runId: string,
    executedById: string,
    data: { testRunCaseIds: string[]; status: TestResultStatus; comment?: string },
  ) {
    const run = await this.verifyRun(runId);
    this.rejectIfClosed(run);

    for (const trcId of data.testRunCaseIds) {
      await this.verifyRunCaseBelongsToRun(trcId, runId);
    }

    const results = await this.prisma.$transaction(
      data.testRunCaseIds.map((trcId) =>
        this.prisma.testResult.create({
          data: {
            testRunCaseId: trcId,
            testRunId: runId,
            executedById,
            status: data.status,
            ...(data.comment !== undefined && { comment: data.comment }),
          },
          include: {
            executedBy: { select: { id: true, name: true, email: true } },
          },
        }),
      ),
    );

    await this.updateRunStatus(runId, run.status);

    this.logger.log(
      `Bulk submitted ${results.length} results for run ${runId}`,
    );

    return { submitted: results.length };
  }

  async findAllByRun(runId: string) {
    await this.verifyRun(runId);

    const results = await this.prisma.testResult.findMany({
      where: { testRunId: runId },
      orderBy: { createdAt: 'desc' },
      include: {
        executedBy: { select: { id: true, name: true, email: true } },
        testStepResults: true,
      },
    });

    return results.map((r) => ({
      ...r,
      stepResults: r.testStepResults,
      testStepResults: undefined,
    }));
  }

  async update(resultId: string, data: UpdateTestResultInput & { stepResults?: StepResultData[] }) {
    const result = await this.prisma.testResult.findUnique({
      where: { id: resultId },
    });
    if (!result) {
      throw new NotFoundException('Test result not found');
    }

    const run = await this.verifyRun(result.testRunId);
    this.rejectIfClosed(run);

    const derivedStatus = data.stepResults?.length && !data.statusOverride
      ? this.deriveStatusFromSteps(data.stepResults)
      : data.status;

    const updated = await this.prisma.testResult.update({
      where: { id: resultId },
      data: {
        ...(derivedStatus !== undefined && { status: derivedStatus }),
        ...(data.statusOverride !== undefined && { statusOverride: data.statusOverride }),
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.elapsed !== undefined && { elapsed: data.elapsed }),
        ...(data.stepResults?.length && {
          testStepResults: {
            deleteMany: {},
            create: data.stepResults.map((sr) => ({
              testCaseStepId: sr.testCaseStepId,
              status: sr.status,
              ...(sr.actualResult !== undefined && { actualResult: sr.actualResult }),
            })),
          },
        }),
      },
      include: {
        executedBy: { select: { id: true, name: true, email: true } },
        testStepResults: true,
      },
    });

    await this.updateRunStatus(result.testRunId);

    const updatedForEvent = {
      ...updated,
      stepResults: updated.testStepResults,
      testStepResults: undefined,
    };

    await this.emitProgressEvent(result.testRunId, result.testRunCaseId, updatedForEvent);

    return updatedForEvent;
  }

  async getRunWithSummary(runId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, deletedAt: null },
      include: {
        testPlan: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        testRunCases: {
          include: {
            testCase: {
              select: {
                id: true,
                title: true,
                priority: true,
                type: true,
                templateType: true,
                suiteId: true,
                suite: { select: { id: true, name: true } },
                steps: {
                  orderBy: { stepNumber: 'asc' as const },
                  select: {
                    id: true,
                    caseId: true,
                    stepNumber: true,
                    description: true,
                    expectedResult: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
            testResults: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                executedBy: { select: { id: true, name: true, email: true } },
                testStepResults: true,
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
      testRunCases: run.testRunCases.map((trc: { testResults: Array<Record<string, unknown> & { testStepResults?: unknown[] }>; [key: string]: unknown }) => {
        const latestRaw = trc.testResults[0] ?? null;
        const latestResult = latestRaw
          ? {
              ...latestRaw,
              stepResults: (latestRaw as Record<string, unknown>).testStepResults ?? [],
              testStepResults: undefined,
            }
          : null;
        return {
          ...trc,
          latestResult,
          testResults: undefined,
        };
      }),
      summary,
    };
  }

  async exportResultsCsv(runId: string): Promise<string> {
    await this.verifyRun(runId);

    const results = await this.prisma.testResult.findMany({
      where: { testRunId: runId },
      orderBy: { createdAt: 'desc' },
      include: {
        executedBy: { select: { name: true } },
        testRunCase: {
          include: { testCase: { select: { title: true } } },
        },
      },
    });

    const rows = results.map((r: { testRunCase: { testCase: { title: string } }; status: string; comment: string | null; executedBy: { name: string }; elapsed: number | null; createdAt: Date }) => ({
      suiteName: r.testRunCase.testCase.title,
      status: r.status,
      comment: r.comment,
      executedBy: r.executedBy.name,
      elapsed: r.elapsed,
      createdAt: r.createdAt.toISOString(),
    }));

    return this.csvService.generateResultsCsv(rows);
  }

  /** Derive overall case status from step statuses */
  deriveStatusFromSteps(stepResults: StepResultData[]): TestResultStatus {
    if (stepResults.length === 0) {
      return TestResultStatus.UNTESTED;
    }

    const hasFailure = stepResults.some((s) => s.status === TestResultStatus.FAILED);
    if (hasFailure) return TestResultStatus.FAILED;

    const hasBlocked = stepResults.some((s) => s.status === TestResultStatus.BLOCKED);
    if (hasBlocked) return TestResultStatus.BLOCKED;

    const hasRetest = stepResults.some((s) => s.status === TestResultStatus.RETEST);
    if (hasRetest) return TestResultStatus.RETEST;

    const hasUntested = stepResults.some(
      (s) => s.status === TestResultStatus.UNTESTED || !s.status,
    );
    if (hasUntested) return TestResultStatus.RETEST;

    return TestResultStatus.PASSED;
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

    const hasAnyResult = testRunCases.some((trc: { testResults: { status: string }[] }) => trc.testResults.length > 0);
    const allHaveResults = testRunCases.every(
      (trc: { testResults: { status: string }[] }) =>
        trc.testResults.length > 0 &&
        trc.testResults[0].status !== TestResultStatus.UNTESTED,
    );

    if (allHaveResults && testRunCases.length > 0) {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: 'COMPLETED' },
      });
      this.logger.log(`Run ${runId} auto-completed -- all cases have results`);
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
        this.logger.log(`Run ${runId} auto-started -- first result submitted`);
      }
    }
  }

  private rejectIfClosed(run: { status: string }): void {
    if (run.status === TestRunStatus.COMPLETED) {
      throw new ConflictException('Cannot submit results to a closed run');
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
