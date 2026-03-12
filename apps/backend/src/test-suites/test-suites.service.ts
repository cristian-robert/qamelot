import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';

@Injectable()
export class TestSuitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateTestSuiteInput) {
    await this.verifyProject(projectId);

    if (data.parentId) {
      await this.verifySuiteInProject(data.parentId, projectId);
    }

    return this.prisma.testSuite.create({
      data: {
        name: data.name,
        ...(data.description !== undefined && { description: data.description }),
        projectId,
        ...(data.parentId && { parentId: data.parentId }),
      },
    });
  }

  async findAllByProject(projectId: string) {
    await this.verifyProject(projectId);

    return this.prisma.testSuite.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async update(projectId: string, id: string, data: UpdateTestSuiteInput) {
    await this.verifySuiteInProject(id, projectId);

    if (data.parentId !== undefined && data.parentId !== null) {
      await this.verifySuiteInProject(data.parentId, projectId);
    }

    return this.prisma.testSuite.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });
  }

  async softDelete(projectId: string, id: string) {
    await this.verifySuiteInProject(id, projectId);

    const descendantIds = await this.collectDescendantIds(id);
    const allIds = [id, ...descendantIds];

    const result = await this.prisma.testSuite.updateMany({
      where: { id: { in: allIds } },
      data: { deletedAt: new Date() },
    });

    return { deleted: result.count };
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async verifySuiteInProject(suiteId: string, projectId: string) {
    const suite = await this.prisma.testSuite.findFirst({
      where: { id: suiteId, projectId, deletedAt: null },
    });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }
  }

  private async collectDescendantIds(parentId: string): Promise<string[]> {
    const children = await this.prisma.testSuite.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true },
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      const grandchildren = await this.collectDescendantIds(child.id);
      ids.push(...grandchildren);
    }
    return ids;
  }
}
