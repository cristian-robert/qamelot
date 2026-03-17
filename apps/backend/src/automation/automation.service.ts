import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';
import type { AutomationCaseMapDto } from '@app/shared';
import { TestResultStatus, TestRunStatus } from '@app/shared';

const RESULT_STATUS_MAP: Record<string, TestResultStatus> = {
  PASSED: TestResultStatus.PASSED,
  FAILED: TestResultStatus.FAILED,
  BLOCKED: TestResultStatus.BLOCKED,
};

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runEvents: RunEventsService,
  ) {}

  async createRun(
    data: {
      projectId: string;
      planId: string;
      name: string;
      automationIds: string[];
      ciJobUrl?: string;
    },
    apiKeyProjectId: string,
  ) {
    const plan = await this.prisma.testPlan.findFirst({
      where: { id: data.planId, projectId: apiKeyProjectId, deletedAt: null },
    });
    if (!plan) throw new NotFoundException('Test plan not found');

    const cases = await this.prisma.testCase.findMany({
      where: {
        projectId: apiKeyProjectId,
        automationId: { in: data.automationIds },
        deletedAt: null,
      },
      select: { id: true, automationId: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException(
        'No test cases found matching the provided automation IDs',
      );
    }

    this.logger.log(
      `Creating automated run: ${cases.length}/${data.automationIds.length} cases matched`,
    );

    const run = await this.prisma.testRun.create({
      data: {
        name: data.name,
        testPlanId: data.planId,
        projectId: apiKeyProjectId,
        executionType: 'AUTOMATED',
        ciJobUrl: data.ciJobUrl,
        testRunCases: {
          create: cases.map((c) => ({ testCaseId: c.id })),
        },
      },
      include: {
        testRunCases: {
          include: {
            testCase: {
              select: { id: true, title: true, automationId: true },
            },
          },
        },
      },
    });

    return {
      ...run,
      unmatchedIds: data.automationIds.filter(
        (aid) => !cases.some((c) => c.automationId === aid),
      ),
    };
  }

  async submitResult(
    runId: string,
    data: {
      automationId: string;
      status: string;
      duration?: number;
      error?: string;
      log?: string;
    },
    apiKeyProjectId: string,
  ) {
    const testRunCase = await this.prisma.testRunCase.findFirst({
      where: {
        testRunId: runId,
        testCase: {
          automationId: data.automationId,
          projectId: apiKeyProjectId,
        },
      },
      include: { testRun: { select: { status: true } } },
    });

    if (!testRunCase) {
      this.logger.warn(
        `No matching case for automationId "${data.automationId}" in run ${runId}`,
      );
      return null;
    }

    // Auto-transition run from PENDING to IN_PROGRESS on first result
    if (testRunCase.testRun.status === 'PENDING') {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: TestRunStatus.IN_PROGRESS },
      });
    }

    const status = RESULT_STATUS_MAP[data.status] ?? TestResultStatus.FAILED;

    const result = await this.prisma.testResult.create({
      data: {
        testRunCaseId: testRunCase.id,
        testRunId: runId,
        executedById: 'system',
        status,
        elapsed: data.duration ? Math.round(data.duration / 1000) : null,
        comment: data.error ?? null,
        automationLog: data.log ?? null,
      },
    });

    return result;
  }

  async completeRun(runId: string, apiKeyProjectId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId: apiKeyProjectId, deletedAt: null },
    });
    if (!run) throw new NotFoundException('Test run not found');

    const updated = await this.prisma.testRun.update({
      where: { id: runId },
      data: { status: TestRunStatus.COMPLETED },
    });

    this.logger.log(`Automated run ${runId} completed`);
    return updated;
  }

  async listAutomatedCases(
    projectId: string,
  ): Promise<AutomationCaseMapDto[]> {
    const cases = await this.prisma.testCase.findMany({
      where: {
        projectId,
        automationId: { not: null },
        deletedAt: null,
      },
      select: { id: true, automationId: true, title: true, suiteId: true },
    });

    return cases.map((c) => ({
      testCaseId: c.id,
      automationId: c.automationId!,
      title: c.title,
      suiteId: c.suiteId,
    }));
  }

  async syncTests(
    projectId: string,
    tests: Array<{
      automationId: string;
      title: string;
      filePath: string;
    }>,
  ) {
    const existing = await this.prisma.testCase.findMany({
      where: {
        projectId,
        automationId: { not: null },
        deletedAt: null,
      },
      select: { id: true, automationId: true },
    });

    const existingMap = new Map(
      existing.map((c) => [c.automationId, c.id]),
    );
    const incomingIds = new Set(tests.map((t) => t.automationId));

    // Update matched cases with current file path and status
    const matched = tests.filter((t) => existingMap.has(t.automationId));
    for (const t of matched) {
      await this.prisma.testCase.updateMany({
        where: { automationId: t.automationId, projectId },
        data: { automationFilePath: t.filePath, automationStatus: 'AUTOMATED' },
      });
    }

    // Mark stale cases (exist in DB but not in incoming test list)
    const staleIds = existing
      .filter((e) => e.automationId && !incomingIds.has(e.automationId))
      .map((e) => e.id);

    if (staleIds.length > 0) {
      await this.prisma.testCase.updateMany({
        where: { id: { in: staleIds } },
        data: { automationStatus: 'NEEDS_UPDATE' },
      });
    }

    const unmatched = tests
      .filter((t) => !existingMap.has(t.automationId))
      .map((t) => t.automationId);

    return { matched: matched.length, created: 0, stale: staleIds.length, unmatched };
  }
}
