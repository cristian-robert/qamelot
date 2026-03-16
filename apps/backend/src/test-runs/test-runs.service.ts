import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestRunInput, UpdateTestRunInput } from '@app/shared';

@Injectable()
export class TestRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(planId: string, data: CreateTestRunInput) {
    const plan = await this.verifyPlan(planId);

    await this.verifySuitesExist(data.suiteIds, plan.projectId);

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
          create: data.suiteIds.map((suiteId) => ({ suiteId })),
        },
      },
      include: {
        testRunCases: { include: { suite: { select: { id: true, name: true } } } },
        assignedTo: { select: { id: true, name: true, email: true } },
        testPlan: { select: { id: true, name: true } },
      },
    });
  }

  async findAllByPlan(planId: string) {
    await this.verifyPlan(planId);

    return this.prisma.testRun.findMany({
      where: { testPlanId: planId, deletedAt: null },
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
          include: { suite: { select: { id: true, name: true } } },
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

  private async verifySuitesExist(suiteIds: string[], projectId: string) {
    const suites = await this.prisma.testSuite.findMany({
      where: { id: { in: suiteIds }, projectId, deletedAt: null },
      select: { id: true },
    });
    if (suites.length !== suiteIds.length) {
      throw new BadRequestException('One or more suites not found in this project');
    }
  }

  private async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Assigned user not found');
    }
  }
}
