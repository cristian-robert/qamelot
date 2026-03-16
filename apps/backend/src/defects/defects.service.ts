import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDefectInput, UpdateDefectInput } from '@app/shared';

@Injectable()
export class DefectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateDefectInput) {
    await this.verifyProject(projectId);

    return this.prisma.defect.create({
      data: {
        reference: data.reference,
        ...(data.description !== undefined && { description: data.description }),
        projectId,
      },
    });
  }

  async findAllByProject(projectId: string) {
    await this.verifyProject(projectId);

    return this.prisma.defect.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const defect = await this.prisma.defect.findFirst({
      where: { id, deletedAt: null },
    });
    if (!defect) {
      throw new NotFoundException('Defect not found');
    }
    return defect;
  }

  async update(id: string, data: UpdateDefectInput) {
    const result = await this.prisma.defect.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(data.reference !== undefined && { reference: data.reference }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Defect not found');
    }
    return this.prisma.defect.findUnique({ where: { id } });
  }

  async softDelete(id: string) {
    const result = await this.prisma.defect.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Defect not found');
    }
    return this.prisma.defect.findUnique({ where: { id } });
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
