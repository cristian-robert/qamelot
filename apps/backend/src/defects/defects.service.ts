import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDefectInput, UpdateDefectInput } from '@app/shared';

@Injectable()
export class DefectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateDefectInput) {
    await this.verifyProject(projectId);

    if (data.testResultId) {
      await this.verifyTestResult(data.testResultId);
    }

    return this.prisma.defect.create({
      data: {
        reference: data.reference,
        ...(data.description !== undefined && { description: data.description }),
        ...(data.testResultId !== undefined && { testResultId: data.testResultId }),
        projectId,
      },
    });
  }

  async findAllByProject(
    projectId: string,
    filters?: { search?: string; page?: number; pageSize?: number },
  ) {
    await this.verifyProject(projectId);

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where = {
      projectId,
      deletedAt: null,
      ...(filters?.search && {
        OR: [
          { reference: { contains: filters.search, mode: 'insensitive' as const } },
          { description: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.defect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.defect.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const defect = await this.prisma.defect.findFirst({
      where: { id, deletedAt: null },
      include: {
        testResult: {
          select: {
            id: true,
            status: true,
            comment: true,
            testRunId: true,
            testRunCase: {
              select: {
                testCase: { select: { id: true, title: true } },
              },
            },
            testRun: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    if (!defect) {
      throw new NotFoundException('Defect not found');
    }
    return defect;
  }

  async findByTestResultId(testResultId: string) {
    return this.prisma.defect.findMany({
      where: { testResultId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
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

  private async verifyTestResult(testResultId: string) {
    const result = await this.prisma.testResult.findUnique({
      where: { id: testResultId },
    });
    if (!result) {
      throw new NotFoundException('Test result not found');
    }
  }
}
