import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestPlanInput, UpdateTestPlanInput } from '@app/shared';

@Injectable()
export class TestPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateTestPlanInput) {
    await this.verifyProject(projectId);

    return this.prisma.testPlan.create({
      data: {
        name: data.name,
        ...(data.description !== undefined && { description: data.description }),
        projectId,
      },
    });
  }

  async findAllByProject(projectId: string) {
    await this.verifyProject(projectId);

    return this.prisma.testPlan.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { testRuns: true } } },
    });
  }

  async findOne(projectId: string, id: string) {
    await this.verifyProject(projectId);

    const plan = await this.prisma.testPlan.findFirst({
      where: { id, projectId, deletedAt: null },
      include: { _count: { select: { testRuns: true } } },
    });
    if (!plan) {
      throw new NotFoundException('Test plan not found');
    }
    return plan;
  }

  async update(projectId: string, id: string, data: UpdateTestPlanInput) {
    await this.verifyPlanInProject(id, projectId);

    return this.prisma.testPlan.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async softDelete(projectId: string, id: string) {
    await this.verifyPlanInProject(id, projectId);

    return this.prisma.testPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async verifyPlanInProject(planId: string, projectId: string) {
    const plan = await this.prisma.testPlan.findFirst({
      where: { id: planId, projectId, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundException('Test plan not found');
    }
    return plan;
  }
}
