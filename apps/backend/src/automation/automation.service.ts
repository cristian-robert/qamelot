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

/**
 * Detects whether an automation ID contains an absolute file path and returns
 * true if so. Used to migrate old-style IDs that exposed workstation paths.
 */
function hasAbsolutePath(automationId: string): boolean {
  const filePart = automationId.split(' > ')[0];
  return filePart.startsWith('/') || /^[A-Za-z]:\\/.test(filePart);
}

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

    // Track which incoming IDs were matched (exact or suffix)
    const matchedIncomingIds = new Set(
      data.automationIds.filter((aid) =>
        cases.some((c) => c.automationId === aid),
      ),
    );

    // Suffix fallback for unmatched IDs: handles absolute→relative migration
    const unmatchedIncoming = data.automationIds.filter(
      (aid) => !matchedIncomingIds.has(aid),
    );
    if (unmatchedIncoming.length > 0) {
      const allAutomated = await this.prisma.testCase.findMany({
        where: {
          projectId: apiKeyProjectId,
          automationId: { not: null },
          deletedAt: null,
        },
        select: { id: true, automationId: true },
      });
      const matchedCaseIds = new Set(cases.map((c) => c.id));
      let suffixCount = 0;
      for (const aid of unmatchedIncoming) {
        const match = allAutomated.find(
          (c) =>
            !matchedCaseIds.has(c.id) &&
            c.automationId &&
            hasAbsolutePath(c.automationId) &&
            c.automationId.endsWith(aid),
        );
        if (match) {
          cases.push({ id: match.id, automationId: match.automationId });
          matchedCaseIds.add(match.id);
          matchedIncomingIds.add(aid);
          suffixCount++;
        }
      }
      if (suffixCount > 0) {
        this.logger.warn(
          `createRun: matched ${suffixCount} case(s) via suffix fallback — run sync to migrate automation IDs`,
        );
      }
    }

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
        (aid) => !matchedIncomingIds.has(aid),
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
    apiKeyId: string,
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

    // Resolve executor: use the API key creator as the "executed by" user
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { createdById: true },
    });
    const executedById = apiKey?.createdById ?? 'system';

    const result = await this.prisma.testResult.create({
      data: {
        testRunCaseId: testRunCase.id,
        testRunId: runId,
        executedById,
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

  async setupProject(
    data: {
      projectName?: string;
      projectId?: string;
      planName?: string;
      planId?: string;
    },
    apiKeyProjectId: string,
  ): Promise<{ projectId: string; planId: string }> {
    if (!data.projectId && !data.projectName) {
      throw new BadRequestException(
        'Either projectId or projectName must be provided.',
      );
    }
    if (!data.planId && !data.planName) {
      throw new BadRequestException(
        'Either planId or planName must be provided.',
      );
    }

    // Look up project by ID or name, scoped to the API key's project
    let project;

    if (data.projectId) {
      project = await this.prisma.project.findFirst({
        where: { id: data.projectId, deletedAt: null },
      });
    } else {
      const projects = await this.prisma.project.findMany({
        where: { name: data.projectName, deletedAt: null },
      });
      if (projects.length > 1) {
        throw new BadRequestException(
          `Multiple projects found with name "${data.projectName}". Please specify projectId to disambiguate.`,
        );
      }
      project = projects[0];
    }

    if (!project) {
      const identifier = data.projectId ?? data.projectName;
      throw new NotFoundException(
        `Project "${identifier}" not found. Automation cannot create projects — please create it in the Qamelot UI first.`,
      );
    }

    // Enforce API key project scope
    if (project.id !== apiKeyProjectId) {
      throw new NotFoundException(
        `Project "${data.projectId ?? data.projectName}" not found. The API key is not authorized for this project.`,
      );
    }

    // Look up plan by ID or name within the project — never create
    let plan;

    if (data.planId) {
      plan = await this.prisma.testPlan.findFirst({
        where: { id: data.planId, projectId: project.id, deletedAt: null },
      });
    } else {
      const plans = await this.prisma.testPlan.findMany({
        where: { name: data.planName, projectId: project.id, deletedAt: null },
      });
      if (plans.length > 1) {
        throw new BadRequestException(
          `Multiple test plans found with name "${data.planName}" in project "${project.name}". Please specify planId to disambiguate.`,
        );
      }
      plan = plans[0];
    }

    if (!plan) {
      const identifier = data.planId ?? data.planName;
      throw new NotFoundException(
        `Test plan "${identifier}" not found in project "${project.name}". Automation cannot create test plans — please create it in the Qamelot UI first.`,
      );
    }

    this.logger.log(
      `Setup: resolved project "${project.name}" (${project.id}), plan "${plan.name}" (${plan.id})`,
    );

    return { projectId: project.id, planId: plan.id };
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

    // Build exact-match map and a list of old absolute-path entries for suffix matching
    const existingMap = new Map(
      existing.map((c) => [c.automationId, c.id]),
    );
    const absolutePathEntries = existing.filter(
      (c) => c.automationId && hasAbsolutePath(c.automationId),
    );

    const matchedTests: typeof tests = [];
    const migratedCount = { value: 0 };

    for (const t of tests) {
      // Try exact match first
      if (existingMap.has(t.automationId)) {
        matchedTests.push(t);
        continue;
      }

      // Suffix match: find an old absolute-path ID that ends with the new relative ID
      const suffixMatch = absolutePathEntries.find(
        (e) => e.automationId!.endsWith(t.automationId),
      );
      if (suffixMatch) {
        const oldId = suffixMatch.automationId!;
        // Migrate: update the automationId to the new relative version
        await this.prisma.testCase.update({
          where: { id: suffixMatch.id },
          data: {
            automationId: t.automationId,
            automationFilePath: t.filePath,
            automationStatus: 'AUTOMATED',
          },
        });
        // Update maps so stale detection sees the migrated entry
        existingMap.delete(oldId);
        existingMap.set(t.automationId, suffixMatch.id);
        matchedTests.push(t);
        migratedCount.value++;
        this.logger.log(
          `Migrated automationId from absolute to relative: "${t.automationId}"`,
        );
      }
    }

    // Update exact-matched cases with current file path and status
    const exactMatched = matchedTests.filter((t) =>
      existing.some((e) => e.automationId === t.automationId),
    );
    for (const t of exactMatched) {
      await this.prisma.testCase.updateMany({
        where: { automationId: t.automationId, projectId },
        data: { automationFilePath: t.filePath, automationStatus: 'AUTOMATED' },
      });
    }

    const incomingIds = new Set(tests.map((t) => t.automationId));

    // Mark stale cases (exist in DB but not in incoming test list)
    const staleIds = [...existingMap.entries()]
      .filter(([aid]) => aid && !incomingIds.has(aid))
      .map(([, id]) => id);

    if (staleIds.length > 0) {
      await this.prisma.testCase.updateMany({
        where: { id: { in: staleIds } },
        data: { automationStatus: 'NEEDS_UPDATE' },
      });
    }

    const unmatched = tests
      .filter((t) => !matchedTests.includes(t))
      .map((t) => t.automationId);

    if (migratedCount.value > 0) {
      this.logger.log(
        `Sync: migrated ${migratedCount.value} automation ID(s) from absolute to relative paths`,
      );
    }

    return {
      matched: matchedTests.length,
      created: 0,
      stale: staleIds.length,
      unmatched,
    };
  }
}
