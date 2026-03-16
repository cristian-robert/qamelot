import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CsvService } from './csv.service';
import type {
  CreateTestCaseInput,
  UpdateTestCaseInput,
  CreateTestCaseStepInput,
  UpdateTestCaseStepInput,
} from '@app/shared';
import { CasePriority, CaseType, TemplateType } from '@app/shared';

@Injectable()
export class TestCasesService {
  private readonly logger = new Logger(TestCasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvService: CsvService,
  ) {}

  // ── Test Case CRUD ──

  async create(projectId: string, suiteId: string, data: CreateTestCaseInput) {
    await this.verifyProject(projectId);
    await this.verifySuiteInProject(suiteId, projectId);

    const maxPosition = await this.prisma.testCase.aggregate({
      where: { suiteId, deletedAt: null },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.testCase.create({
      data: {
        title: data.title,
        ...(data.preconditions !== undefined && { preconditions: data.preconditions }),
        ...(data.templateType !== undefined && { templateType: data.templateType }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.estimate !== undefined && { estimate: data.estimate }),
        ...(data.references !== undefined && { references: data.references }),
        position: nextPosition,
        projectId,
        suiteId,
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async findAllBySuite(
    projectId: string,
    suiteId: string,
    options?: {
      page?: number;
      pageSize?: number;
      priority?: string;
      type?: string;
      search?: string;
      reference?: string;
    },
  ) {
    await this.verifyProject(projectId);
    await this.verifySuiteInProject(suiteId, projectId);

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where = {
      suiteId,
      projectId,
      deletedAt: null,
      ...(options?.priority && { priority: options.priority as never }),
      ...(options?.type && { type: options.type as never }),
      ...(options?.search && {
        title: { contains: options.search, mode: 'insensitive' as const },
      }),
      ...(options?.reference && {
        references: { contains: options.reference, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.testCase.findMany({
        where,
        orderBy: { position: 'asc' },
        skip,
        take: pageSize,
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      }),
      this.prisma.testCase.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(projectId: string, id: string) {
    await this.verifyProject(projectId);

    const testCase = await this.prisma.testCase.findFirst({
      where: { id, projectId, deletedAt: null },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
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
        ...(data.templateType !== undefined && { templateType: data.templateType }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.estimate !== undefined && { estimate: data.estimate }),
        ...(data.references !== undefined && { references: data.references }),
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
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

  // ── Copy / Move ──

  async copyToSuite(projectId: string, caseId: string, targetSuiteId: string) {
    await this.verifyProject(projectId);
    const original = await this.verifyCaseInProject(caseId, projectId);
    await this.verifySuiteInProject(targetSuiteId, projectId);

    const maxPosition = await this.prisma.testCase.aggregate({
      where: { suiteId: targetSuiteId, deletedAt: null },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const steps = await this.prisma.testCaseStep.findMany({
      where: { caseId },
      orderBy: { stepNumber: 'asc' },
    });

    return this.prisma.testCase.create({
      data: {
        title: original.title,
        preconditions: original.preconditions,
        templateType: original.templateType,
        priority: original.priority,
        type: original.type,
        estimate: original.estimate,
        references: original.references,
        position: nextPosition,
        projectId,
        suiteId: targetSuiteId,
        steps: {
          create: steps.map((s: { stepNumber: number; description: string; expectedResult: string }) => ({
            stepNumber: s.stepNumber,
            description: s.description,
            expectedResult: s.expectedResult,
          })),
        },
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async moveToSuite(projectId: string, caseId: string, targetSuiteId: string) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(caseId, projectId);
    await this.verifySuiteInProject(targetSuiteId, projectId);

    const maxPosition = await this.prisma.testCase.aggregate({
      where: { suiteId: targetSuiteId, deletedAt: null },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.testCase.update({
      where: { id: caseId },
      data: { suiteId: targetSuiteId, position: nextPosition },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  // ── Steps CRUD ──

  async createStep(projectId: string, caseId: string, data: CreateTestCaseStepInput) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(caseId, projectId);

    const maxStep = await this.prisma.testCaseStep.aggregate({
      where: { caseId },
      _max: { stepNumber: true },
    });
    const nextStepNumber = (maxStep._max.stepNumber ?? 0) + 1;

    return this.prisma.testCaseStep.create({
      data: {
        caseId,
        stepNumber: nextStepNumber,
        description: data.description,
        expectedResult: data.expectedResult,
      },
    });
  }

  async findAllSteps(projectId: string, caseId: string) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(caseId, projectId);

    return this.prisma.testCaseStep.findMany({
      where: { caseId },
      orderBy: { stepNumber: 'asc' },
    });
  }

  async updateStep(projectId: string, caseId: string, stepId: string, data: UpdateTestCaseStepInput) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(caseId, projectId);

    const step = await this.prisma.testCaseStep.findFirst({
      where: { id: stepId, caseId },
    });
    if (!step) {
      throw new NotFoundException('Test case step not found');
    }

    return this.prisma.testCaseStep.update({
      where: { id: stepId },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.expectedResult !== undefined && { expectedResult: data.expectedResult }),
      },
    });
  }

  async deleteStep(projectId: string, caseId: string, stepId: string) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(caseId, projectId);

    const step = await this.prisma.testCaseStep.findFirst({
      where: { id: stepId, caseId },
    });
    if (!step) {
      throw new NotFoundException('Test case step not found');
    }

    await this.prisma.testCaseStep.delete({ where: { id: stepId } });

    // Renumber remaining steps
    const remaining = await this.prisma.testCaseStep.findMany({
      where: { caseId },
      orderBy: { stepNumber: 'asc' },
    });

    await Promise.all(
      remaining.map((s: { id: string }, index: number) =>
        this.prisma.testCaseStep.update({
          where: { id: s.id },
          data: { stepNumber: index + 1 },
        }),
      ),
    );

    return { deleted: true };
  }

  async reorderSteps(projectId: string, caseId: string, stepIds: string[]) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(caseId, projectId);

    const existingSteps = await this.prisma.testCaseStep.findMany({
      where: { caseId },
      select: { id: true },
    });
    const existingIds = new Set(existingSteps.map((s: { id: string }) => s.id));

    for (const id of stepIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Step ${id} does not belong to this case`);
      }
    }

    if (stepIds.length !== existingSteps.length) {
      throw new BadRequestException('All step IDs must be provided for reorder');
    }

    // Use a temporary negative offset to avoid unique constraint violations
    await Promise.all(
      stepIds.map((id, index) =>
        this.prisma.testCaseStep.update({
          where: { id },
          data: { stepNumber: -(index + 1) },
        }),
      ),
    );

    await Promise.all(
      stepIds.map((id, index) =>
        this.prisma.testCaseStep.update({
          where: { id },
          data: { stepNumber: index + 1 },
        }),
      ),
    );

    return this.prisma.testCaseStep.findMany({
      where: { caseId },
      orderBy: { stepNumber: 'asc' },
    });
  }

  // ── CSV Export / Import ──

  async exportCasesCsv(projectId: string): Promise<string> {
    await this.verifyProject(projectId);

    const cases = await this.prisma.testCase.findMany({
      where: { projectId, deletedAt: null },
      include: {
        suite: { select: { name: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
      orderBy: [{ suite: { name: 'asc' } }, { position: 'asc' }],
    });

    const rows = cases.map((tc) => ({
      title: tc.title,
      suite: (tc as unknown as { suite: { name: string } }).suite.name,
      priority: tc.priority,
      type: tc.type,
      preconditions: tc.preconditions ?? '',
      steps: tc.steps.map((s) => ({
        description: s.description,
        expectedResult: s.expectedResult,
      })),
    }));

    return this.csvService.generateCasesCsv(rows);
  }

  async importCasesCsv(projectId: string, buffer: Buffer) {
    await this.verifyProject(projectId);

    const { valid, errors } = this.csvService.parseCasesCsv(buffer);

    if (valid.length === 0) {
      return { imported: 0, errors };
    }

    // Resolve suite names to IDs, creating suites that don't exist
    const suiteNameSet = new Set(valid.map((r) => r.suite));
    const suiteMap = new Map<string, string>();

    for (const suiteName of suiteNameSet) {
      const existing = await this.prisma.testSuite.findFirst({
        where: { projectId, name: suiteName, deletedAt: null },
      });

      if (existing) {
        suiteMap.set(suiteName, existing.id);
      } else {
        const created = await this.prisma.testSuite.create({
          data: { name: suiteName, projectId },
        });
        suiteMap.set(suiteName, created.id);
        this.logger.log(`Auto-created suite "${suiteName}" for CSV import`);
      }
    }

    // Create test cases with steps in a transaction
    let imported = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const row of valid) {
        const suiteId = suiteMap.get(row.suite)!;

        const maxPosition = await tx.testCase.aggregate({
          where: { suiteId, deletedAt: null },
          _max: { position: true },
        });
        const nextPosition = (maxPosition._max.position ?? -1) + 1;

        await tx.testCase.create({
          data: {
            title: row.title,
            preconditions: row.preconditions || null,
            priority: row.priority as CasePriority,
            type: row.type as CaseType,
            templateType: row.steps.length > 0 ? TemplateType.STEPS : TemplateType.TEXT,
            position: nextPosition,
            projectId,
            suiteId,
            steps: {
              create: row.steps.map((s, idx) => ({
                stepNumber: idx + 1,
                description: s.description,
                expectedResult: s.expectedResult,
              })),
            },
          },
        });
        imported++;
      }
    });

    this.logger.log(
      `CSV import complete: ${imported} cases imported for project ${projectId}`,
    );

    return { imported, errors };
  }

  // ── Private helpers ──

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
