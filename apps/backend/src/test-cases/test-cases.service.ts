import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';

@Injectable()
export class TestCasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, suiteId: string, data: CreateTestCaseInput) {
    await this.verifyProject(projectId);
    await this.verifySuiteInProject(suiteId, projectId);

    return this.prisma.testCase.create({
      data: {
        title: data.title,
        ...(data.preconditions !== undefined && { preconditions: data.preconditions }),
        ...(data.steps !== undefined && { steps: data.steps }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.automationFlag !== undefined && { automationFlag: data.automationFlag }),
        projectId,
        suiteId,
      },
    });
  }

  async findAllBySuite(projectId: string, suiteId: string) {
    await this.verifyProject(projectId);
    await this.verifySuiteInProject(suiteId, projectId);

    return this.prisma.testCase.findMany({
      where: { suiteId, projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string) {
    await this.verifyProject(projectId);

    const testCase = await this.prisma.testCase.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }
    return testCase;
  }

  async update(projectId: string, id: string, data: UpdateTestCaseInput) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(id, projectId);

    return this.prisma.testCase.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.preconditions !== undefined && { preconditions: data.preconditions }),
        ...(data.steps !== undefined && { steps: data.steps }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.automationFlag !== undefined && { automationFlag: data.automationFlag }),
      },
    });
  }

  async softDelete(projectId: string, id: string) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(id, projectId);

    return this.prisma.testCase.update({
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

  private async verifySuiteInProject(suiteId: string, projectId: string) {
    const suite = await this.prisma.testSuite.findFirst({
      where: { id: suiteId, projectId, deletedAt: null },
    });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }
    return suite;
  }

  private async verifyCaseInProject(caseId: string, projectId: string) {
    const testCase = await this.prisma.testCase.findFirst({
      where: { id: caseId, projectId, deletedAt: null },
    });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }
    return testCase;
  }
}
