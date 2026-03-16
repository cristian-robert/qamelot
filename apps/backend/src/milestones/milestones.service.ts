import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@app/shared';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateMilestoneInput) {
    await this.verifyProject(projectId);

    return this.prisma.milestone.create({
      data: {
        name: data.name,
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        projectId,
      },
    });
  }

  async findAllByProject(
    projectId: string,
    filters?: { status?: string },
  ) {
    await this.verifyProject(projectId);

    return this.prisma.milestone.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(filters?.status && { status: filters.status as 'OPEN' | 'CLOSED' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id, deletedAt: null },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    return milestone;
  }

  async update(id: string, data: UpdateMilestoneInput) {
    const result = await this.prisma.milestone.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Milestone not found');
    }
    return this.prisma.milestone.findUnique({ where: { id } });
  }

  async softDelete(id: string) {
    const result = await this.prisma.milestone.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Milestone not found');
    }
    return this.prisma.milestone.findUnique({ where: { id } });
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}
