import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectInput, UpdateProjectInput } from '@app/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectInput) {
    return this.prisma.project.create({ data });
  }

  async findAll(options?: { page?: number; pageSize?: number }) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where = { deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
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
