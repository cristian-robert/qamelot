import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectInput, UpdateProjectInput } from '@app/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectInput) {
    return this.prisma.project.create({ data });
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, data: UpdateProjectInput) {
    const result = await this.prisma.project.updateMany({
      where: { id, deletedAt: null },
      data,
    });
    if (result.count === 0) {
      throw new NotFoundException('Project not found');
    }
    return this.prisma.project.findUnique({ where: { id } });
  }

  async softDelete(id: string) {
    const result = await this.prisma.project.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Project not found');
    }
    return this.prisma.project.findUnique({ where: { id } });
  }
}
