import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestRunInput, UpdateTestRunInput, CreateMatrixRunsInput } from '@app/shared';
import { TestRunStatus, TestResultStatus } from '@app/shared';

/** Shared include shape for testRunCases with testCase relation */
const TEST_RUN_CASE_INCLUDE = {
  testCase: {
    select: {
      id: true,
      title: true,
      priority: true,
      type: true,
      suiteId: true,
      suite: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class TestRunsService {
  private readonly logger = new Logger(TestRunsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(planId: string, data: CreateTestRunInput) {
    const plan = await this.verifyPlan(planId);

    await this.verifyCasesExist(data.caseIds, plan.projectId);

    if (data.assignedToId) {
      await this.verifyUser(data.assignedToId);
    }

    return this.prisma.testRun.create({
      data: {
        name: data.name,
        testPlanId: planId,
        projectId: plan.projectId,
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
        testRunCases: {
          create: data.caseIds.map((testCaseId) => ({ testCaseId })),
        },
      },
      include: {
        testRunCases: { include: TEST_RUN_CASE_INCLUDE },
        assignedTo: { select: { id: true, name: true, email: true } },
        testPlan: { select: { id: true, name: true } },
      },
    });
  }

  async findAllByPlan(
    planId: string,
    filters?: { status?: string; assigneeId?: string },
  ) {
    await this.verifyPlan(planId);

    return this.prisma.testRun.findMany({
      where: {
        testPlanId: planId,
        deletedAt: null,
        ...(filters?.status && { status: filters.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }),
        ...(filters?.assigneeId && { assignedToId: filters.assigneeId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { testRunCases: true } },
      },
    });
  }

  async findOne(id: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id, deletedAt: null },
      include: {
        testPlan: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        testRunCases: {
          include: TEST_RUN_CASE_INCLUDE,
        },
      },
    });
    if (!run) {
      throw new NotFoundException('Test run not found');
    }
    return run;
  }

  async update(id: string, data: UpdateTestRunInput) {
    await this.verifyRun(id);

    if (data.assignedToId) {
      await this.verifyUser(data.assignedToId);
    }

    return this.prisma.testRun.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async closeRun(id: string) {
    const run = await this.verifyRun(id);

    if (run.status === TestRunStatus.COMPLETED) {
      throw new ConflictException('Run is already closed');
    }

    const closed = await this.prisma.testRun.update({
      where: { id },
      data: { status: TestRunStatus.COMPLETED },
      include: {
        testPlan: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        testRunCases: {
          include: TEST_RUN_CASE_INCLUDE,
        },
      },
    });

    this.logger.log(`Run ${id} closed manually`);
    return closed;
  }

  async rerun(sourceRunId: string) {
    const sourceRun = await this.prisma.testRun.findFirst({
      where: { id: sourceRunId, deletedAt: null },
      include: {
        testRunCases: {
          include: {
            testResults: {
              orderBy: { createdAt: 'desc' as const },
              take: 1,
              select: { status: true },
            },
          },
        },
      },
    });

    if (!sourceRun) {
      throw new NotFoundException('Source test run not found');
    }

    if (sourceRun.status !== TestRunStatus.COMPLETED) {
      throw new BadRequestException('Can only rerun a completed run');
    }

    const failedOrUntestedCases = sourceRun.testRunCases.filter((trc: { testResults: { status: string }[]; testCaseId: string }) => {
      const latestStatus = trc.testResults[0]?.status;
      return (
        !latestStatus ||
        latestStatus === TestResultStatus.FAILED ||
        latestStatus === TestResultStatus.BLOCKED ||
        latestStatus === TestResultStatus.RETEST ||
        latestStatus === TestResultStatus.UNTESTED
      );
    });

    if (failedOrUntestedCases.length === 0) {
      throw new BadRequestException('No failed or untested cases to rerun');
    }

    const caseIds = failedOrUntestedCases.map((trc: { testCaseId: string }) => trc.testCaseId);

    const newRun = await this.prisma.testRun.create({
      data: {
        name: `${sourceRun.name} (Rerun)`,
        testPlanId: sourceRun.testPlanId,
        projectId: sourceRun.projectId,
        ...(sourceRun.assignedToId && { assignedToId: sourceRun.assignedToId }),
        sourceRunId,
        testRunCases: {
          create: caseIds.map((testCaseId: string) => ({ testCaseId })),
        },
      },
      include: {
        testRunCases: { include: TEST_RUN_CASE_INCLUDE },
        assignedTo: { select: { id: true, name: true, email: true } },
        testPlan: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Rerun created: ${newRun.id} from source run ${sourceRunId}`);
    return newRun;
  }

  async createMatrixRuns(planId: string, data: CreateMatrixRunsInput) {
    const plan = await this.verifyPlan(planId);
    await this.verifyCasesExist(data.caseIds, plan.projectId);

    if (data.assignedToId) {
      await this.verifyUser(data.assignedToId);
    }

    // Resolve item IDs to names, grouped by their config group
    const uniqueItemIds = [...new Set(data.configItemIds.flat())];
    const items = await this.prisma.configItem.findMany({
      where: { id: { in: uniqueItemIds }, deletedAt: null },
      include: { group: { select: { id: true, name: true } } },
    });

    if (items.length !== uniqueItemIds.length) {
      throw new BadRequestException('One or more config items not found');
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));

    // Each entry in configItemIds is a combination (one item per group)
    const runs = [];
    for (const combination of data.configItemIds) {
      const labels = combination.map((itemId) => {
        const item = itemMap.get(itemId);
        return item ? item.name : 'Unknown';
      });
      const configLabel = labels.join(' / ');

      const run = await this.prisma.testRun.create({
        data: {
          name: `${data.name} [${configLabel}]`,
          testPlanId: planId,
          projectId: plan.projectId,
          configLabel,
          ...(data.assignedToId && { assignedToId: data.assignedToId }),
          testRunCases: {
            create: data.caseIds.map((testCaseId) => ({ testCaseId })),
          },
        },
        include: {
          testRunCases: { include: TEST_RUN_CASE_INCLUDE },
          assignedTo: { select: { id: true, name: true, email: true } },
          testPlan: { select: { id: true, name: true } },
        },
      });

      runs.push(run);
    }

    this.logger.log(
      `Matrix runs created: ${runs.length} runs for plan ${planId}`,
    );
    return runs;
  }

  async softDelete(id: string) {
    await this.verifyRun(id);

    return this.prisma.testRun.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async verifyPlan(planId: string) {
    const plan = await this.prisma.testPlan.findFirst({
      where: { id: planId, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundException('Test plan not found');
    }
    return plan;
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

  private async verifyCasesExist(caseIds: string[], projectId: string) {
    const cases = await this.prisma.testCase.findMany({
      where: { id: { in: caseIds }, projectId, deletedAt: null },
      select: { id: true },
    });
    if (cases.length !== caseIds.length) {
      throw new BadRequestException('One or more cases not found in this project');
    }
  }

  private async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Assigned user not found');
    }
  }
}
