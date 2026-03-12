import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const suite = await this.verifySuiteInProject(id, projectId);

    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw new BadRequestException('A suite cannot be its own parent');
      }
      await this.verifySuiteInProject(data.parentId, projectId);
      const descendantIds = await this.collectDescendantIds(id, suite.projectId);
      if (descendantIds.includes(data.parentId)) {
        throw new BadRequestException('Cannot move a suite under one of its own descendants');
      }
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
    const suite = await this.verifySuiteInProject(id, projectId);

    const descendantIds = await this.collectDescendantIds(id, suite.projectId);
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
    return suite;
  }

  /** Collect all descendant IDs in a single query + in-memory walk */
  private async collectDescendantIds(parentId: string, projectId: string): Promise<string[]> {
    const allSuites = await this.prisma.testSuite.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, parentId: true },
    });

    const childrenMap = new Map<string, string[]>();
    for (const s of allSuites) {
      if (s.parentId) {
        const siblings = childrenMap.get(s.parentId) ?? [];
        siblings.push(s.id);
        childrenMap.set(s.parentId, siblings);
      }
    }

    const ids: string[] = [];
    const stack = [parentId];
    while (stack.length) {
      const current = stack.pop()!;
      const children = childrenMap.get(current) ?? [];
      for (const childId of children) {
        ids.push(childId);
        stack.push(childId);
      }
    }
    return ids;
  }
}
