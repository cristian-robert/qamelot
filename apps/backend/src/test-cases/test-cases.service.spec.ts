import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestCasesService } from './test-cases.service';
import { CsvService } from './csv.service';
import { CasePriority, CaseType, TemplateType } from '@app/shared';

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockTestCase = {
  id: 'case-1',
  title: 'Verify login with valid credentials',
  preconditions: 'User exists in the system',
  body: null,
  templateType: 'TEXT',
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  estimate: null,
  references: null,
  position: 0,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [],
};

const mockStep = {
  id: 'step-1',
  caseId: 'case-1',
  stepNumber: 1,
  description: 'Enter username',
  expectedResult: 'Username accepted',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestCasesService', () => {
  let service: TestCasesService;

  const mockPrisma = {
    testCase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    testCaseStep: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    caseHistory: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    testSuite: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCsvService = {
    generateCasesCsv: jest.fn(),
    generateResultsCsv: jest.fn(),
    parseCasesCsv: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestCasesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CsvService, useValue: mockCsvService },
      ],
    }).compile();
    service = module.get<TestCasesService>(TestCasesService);
  });

  // ── create ──

  describe('create', () => {
    it('creates a test case with auto-position', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.aggregate.mockResolvedValue({ _max: { position: 2 } });
      mockPrisma.testCase.create.mockResolvedValue(mockTestCase);

      const result = await service.create(PROJECT_ID, SUITE_ID, {
        title: 'Verify login with valid credentials',
        preconditions: 'User exists in the system',
      });

      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Verify login with valid credentials',
          preconditions: 'User exists in the system',
          position: 3,
          projectId: PROJECT_ID,
          suiteId: SUITE_ID,
        }),
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(mockTestCase);
    });

    it('creates first case with position 0', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.aggregate.mockResolvedValue({ _max: { position: null } });
      mockPrisma.testCase.create.mockResolvedValue(mockTestCase);

      await service.create(PROJECT_ID, SUITE_ID, { title: 'First case' });

      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ position: 0 }),
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, SUITE_ID, { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when suite does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, SUITE_ID, { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAllBySuite ──

  describe('findAllBySuite', () => {
    it('returns paginated cases for a suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([mockTestCase]);
      mockPrisma.testCase.count.mockResolvedValue(1);

      const result = await service.findAllBySuite(PROJECT_ID, SUITE_ID);

      expect(result).toEqual({
        data: [mockTestCase],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });
    });

    it('supports pagination parameters', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      mockPrisma.testCase.count.mockResolvedValue(25);

      await service.findAllBySuite(PROJECT_ID, SUITE_ID, { page: 2, pageSize: 10 });

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('supports filtering by priority', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      mockPrisma.testCase.count.mockResolvedValue(0);

      await service.findAllBySuite(PROJECT_ID, SUITE_ID, { priority: 'HIGH' });

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'HIGH' }),
        }),
      );
    });

    it('supports text search by title', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      mockPrisma.testCase.count.mockResolvedValue(0);

      await service.findAllBySuite(PROJECT_ID, SUITE_ID, { search: 'login' });

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: 'login', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('supports filtering by reference', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      mockPrisma.testCase.count.mockResolvedValue(0);

      await service.findAllBySuite(PROJECT_ID, SUITE_ID, { reference: 'REQ-001' });

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            references: { contains: 'REQ-001', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllBySuite(PROJECT_ID, SUITE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('returns a single test case with steps', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);

      const result = await service.findOne(PROJECT_ID, 'case-1');

      expect(mockPrisma.testCase.findFirst).toHaveBeenCalledWith({
        where: { id: 'case-1', projectId: PROJECT_ID, deletedAt: null },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(mockTestCase);
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(service.findOne(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── update ──

  describe('update', () => {
    it('updates a test case title', async () => {
      const updated = { ...mockTestCase, title: 'Updated title' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'case-1', { title: 'Updated title' });

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { title: 'Updated title' },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(updated);
    });

    it('updates priority, type, and templateType', async () => {
      const updated = {
        ...mockTestCase,
        priority: 'HIGH',
        type: 'REGRESSION',
        templateType: 'STEPS',
      };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'case-1', {
        priority: CasePriority.HIGH,
        type: CaseType.REGRESSION,
        templateType: TemplateType.STEPS,
      });

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: {
          priority: 'HIGH',
          type: 'REGRESSION',
          templateType: 'STEPS',
        },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(updated);
    });

    it('updates the body field independently of preconditions', async () => {
      const existing = { ...mockTestCase, preconditions: 'Keep me', body: null };
      const updated = { ...existing, body: 'Full test description' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(existing);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'case-1', { body: 'Full test description' });

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { body: 'Full test description' },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result.body).toBe('Full test description');
      expect(result.preconditions).toBe('Keep me');
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── softDelete ──

  describe('softDelete', () => {
    it('soft-deletes a test case', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue({ ...mockTestCase, deletedAt: new Date() });

      const result = await service.softDelete(PROJECT_ID, 'case-1');

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeTruthy();
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(service.softDelete(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── copyToSuite ──

  describe('copyToSuite', () => {
    it('copies a test case with steps to a new suite', async () => {
      const targetSuiteId = 'suite-2';
      const copied = { ...mockTestCase, id: 'case-2', suiteId: targetSuiteId, steps: [mockStep] };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: targetSuiteId, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.aggregate.mockResolvedValue({ _max: { position: 1 } });
      mockPrisma.testCaseStep.findMany.mockResolvedValue([mockStep]);
      mockPrisma.testCase.create.mockResolvedValue(copied);

      const result = await service.copyToSuite(PROJECT_ID, 'case-1', targetSuiteId);

      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: mockTestCase.title,
          suiteId: targetSuiteId,
          position: 2,
          steps: {
            create: [
              {
                stepNumber: 1,
                description: 'Enter username',
                expectedResult: 'Username accepted',
              },
            ],
          },
        }),
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(copied);
    });

    it('throws NotFoundException when target suite does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.copyToSuite(PROJECT_ID, 'case-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── moveToSuite ──

  describe('moveToSuite', () => {
    it('moves a test case to a different suite', async () => {
      const targetSuiteId = 'suite-2';
      const moved = { ...mockTestCase, suiteId: targetSuiteId, position: 0, steps: [] };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: targetSuiteId, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.aggregate.mockResolvedValue({ _max: { position: null } });
      mockPrisma.testCase.update.mockResolvedValue(moved);

      const result = await service.moveToSuite(PROJECT_ID, 'case-1', targetSuiteId);

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { suiteId: targetSuiteId, position: 0 },
        include: { steps: { orderBy: { stepNumber: 'asc' } } },
      });
      expect(result).toEqual(moved);
    });
  });

  // ── Steps CRUD ──

  describe('createStep', () => {
    it('creates a step with auto-incremented stepNumber', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.aggregate.mockResolvedValue({ _max: { stepNumber: 2 } });
      mockPrisma.testCaseStep.create.mockResolvedValue({ ...mockStep, stepNumber: 3 });

      const result = await service.createStep(PROJECT_ID, 'case-1', {
        description: 'Enter username',
        expectedResult: 'Username accepted',
      });

      expect(mockPrisma.testCaseStep.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case-1',
          stepNumber: 3,
          description: 'Enter username',
          expectedResult: 'Username accepted',
        },
      });
      expect(result.stepNumber).toBe(3);
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(
        service.createStep(PROJECT_ID, 'nonexistent', {
          description: 'test',
          expectedResult: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllSteps', () => {
    it('returns all steps for a case ordered by stepNumber', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findMany.mockResolvedValue([mockStep]);

      const result = await service.findAllSteps(PROJECT_ID, 'case-1');

      expect(mockPrisma.testCaseStep.findMany).toHaveBeenCalledWith({
        where: { caseId: 'case-1' },
        orderBy: { stepNumber: 'asc' },
      });
      expect(result).toEqual([mockStep]);
    });
  });

  describe('updateStep', () => {
    it('updates a step description', async () => {
      const updated = { ...mockStep, description: 'Updated desc' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findFirst.mockResolvedValue(mockStep);
      mockPrisma.testCaseStep.update.mockResolvedValue(updated);

      const result = await service.updateStep(PROJECT_ID, 'case-1', 'step-1', {
        description: 'Updated desc',
      });

      expect(mockPrisma.testCaseStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: { description: 'Updated desc' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when step does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStep(PROJECT_ID, 'case-1', 'nonexistent', { description: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStep', () => {
    it('deletes a step and renumbers remaining', async () => {
      const step2 = { ...mockStep, id: 'step-2', stepNumber: 2 };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findFirst.mockResolvedValue(mockStep);
      mockPrisma.testCaseStep.delete.mockResolvedValue(mockStep);
      mockPrisma.testCaseStep.findMany.mockResolvedValue([step2]);
      mockPrisma.testCaseStep.update.mockResolvedValue({ ...step2, stepNumber: 1 });

      const result = await service.deleteStep(PROJECT_ID, 'case-1', 'step-1');

      expect(mockPrisma.testCaseStep.delete).toHaveBeenCalledWith({
        where: { id: 'step-1' },
      });
      expect(mockPrisma.testCaseStep.update).toHaveBeenCalledWith({
        where: { id: 'step-2' },
        data: { stepNumber: 1 },
      });
      expect(result).toEqual({ deleted: true });
    });

    it('throws NotFoundException when step does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteStep(PROJECT_ID, 'case-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderSteps', () => {
    it('reorders steps according to provided IDs', async () => {
      const step1 = { id: 'step-1' };
      const step2 = { id: 'step-2' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findMany
        .mockResolvedValueOnce([step1, step2])
        .mockResolvedValueOnce([
          { ...mockStep, id: 'step-2', stepNumber: 1 },
          { ...mockStep, id: 'step-1', stepNumber: 2 },
        ]);
      mockPrisma.testCaseStep.update.mockResolvedValue(mockStep);

      const result = await service.reorderSteps(PROJECT_ID, 'case-1', ['step-2', 'step-1']);

      // First pass: set negative numbers
      expect(mockPrisma.testCaseStep.update).toHaveBeenCalledWith({
        where: { id: 'step-2' },
        data: { stepNumber: -1 },
      });
      expect(mockPrisma.testCaseStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: { stepNumber: -2 },
      });
      expect(result).toHaveLength(2);
    });

    it('throws BadRequestException when step ID does not belong to case', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findMany.mockResolvedValue([{ id: 'step-1' }]);

      await expect(
        service.reorderSteps(PROJECT_ID, 'case-1', ['step-1', 'step-999']),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when not all step IDs are provided', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCaseStep.findMany.mockResolvedValue([
        { id: 'step-1' },
        { id: 'step-2' },
      ]);

      await expect(
        service.reorderSteps(PROJECT_ID, 'case-1', ['step-1']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Bulk Operations ──

  describe('bulkUpdate', () => {
    it('updates priority for multiple cases', async () => {
      const caseIds = ['case-1', 'case-2'];
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1' },
        { id: 'case-2' },
      ]);
      mockPrisma.testCase.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkUpdate(PROJECT_ID, caseIds, {
        priority: CasePriority.HIGH,
      });

      expect(mockPrisma.testCase.updateMany).toHaveBeenCalledWith({
        where: { id: { in: caseIds }, projectId: PROJECT_ID, deletedAt: null },
        data: { priority: 'HIGH' },
      });
      expect(result).toEqual({ updated: 2 });
    });

    it('updates type for multiple cases', async () => {
      const caseIds = ['case-1'];
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.testCase.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.bulkUpdate(PROJECT_ID, caseIds, {
        type: CaseType.REGRESSION,
      });

      expect(mockPrisma.testCase.updateMany).toHaveBeenCalledWith({
        where: { id: { in: caseIds }, projectId: PROJECT_ID, deletedAt: null },
        data: { type: 'REGRESSION' },
      });
      expect(result).toEqual({ updated: 1 });
    });

    it('throws BadRequestException when no fields are provided', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);

      await expect(
        service.bulkUpdate(PROJECT_ID, ['case-1'], {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when a case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);

      await expect(
        service.bulkUpdate(PROJECT_ID, ['case-1', 'nonexistent'], {
          priority: CasePriority.HIGH,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkMove', () => {
    it('moves multiple cases to a target suite', async () => {
      const caseIds = ['case-1', 'case-2'];
      const targetSuiteId = 'suite-2';
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1' },
        { id: 'case-2' },
      ]);
      mockPrisma.testSuite.findFirst.mockResolvedValue({
        id: targetSuiteId,
        projectId: PROJECT_ID,
        deletedAt: null,
      });
      mockPrisma.testCase.aggregate.mockResolvedValue({ _max: { position: 3 } });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.bulkMove(PROJECT_ID, caseIds, targetSuiteId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ moved: 2 });
    });

    it('throws NotFoundException when target suite does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.bulkMove(PROJECT_ID, ['case-1'], 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkDelete', () => {
    it('soft-deletes multiple cases', async () => {
      const caseIds = ['case-1', 'case-2'];
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1' },
        { id: 'case-2' },
      ]);
      mockPrisma.testCase.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkDelete(PROJECT_ID, caseIds);

      expect(mockPrisma.testCase.updateMany).toHaveBeenCalledWith({
        where: { id: { in: caseIds }, projectId: PROJECT_ID, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ deleted: 2 });
    });

    it('throws NotFoundException when a case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([]);

      await expect(
        service.bulkDelete(PROJECT_ID, ['nonexistent']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── update with history ──

  describe('update with history recording', () => {
    const USER_ID = 'user-1';

    it('records history entries when userId is provided and fields change', async () => {
      const updated = { ...mockTestCase, title: 'New title' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.caseHistory.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.testCase.update.mockResolvedValue(updated);

      await service.update(PROJECT_ID, 'case-1', { title: 'New title' }, USER_ID);

      expect(mockPrisma.caseHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            caseId: 'case-1',
            userId: USER_ID,
            field: 'title',
            oldValue: 'Verify login with valid credentials',
            newValue: 'New title',
          },
        ],
      });
    });

    it('does not record history when value does not change', async () => {
      const updated = { ...mockTestCase };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      await service.update(
        PROJECT_ID,
        'case-1',
        { title: mockTestCase.title },
        USER_ID,
      );

      expect(mockPrisma.caseHistory.createMany).not.toHaveBeenCalled();
    });

    it('does not record history when userId is not provided', async () => {
      const updated = { ...mockTestCase, title: 'New title' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      await service.update(PROJECT_ID, 'case-1', { title: 'New title' });

      expect(mockPrisma.caseHistory.createMany).not.toHaveBeenCalled();
    });

    it('records multiple history entries for multiple changed fields', async () => {
      const updated = { ...mockTestCase, title: 'New title', priority: 'HIGH' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.caseHistory.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.testCase.update.mockResolvedValue(updated);

      await service.update(
        PROJECT_ID,
        'case-1',
        { title: 'New title', priority: CasePriority.HIGH },
        USER_ID,
      );

      expect(mockPrisma.caseHistory.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ field: 'title', newValue: 'New title' }),
          expect.objectContaining({ field: 'priority', oldValue: 'MEDIUM', newValue: 'HIGH' }),
        ]),
      });
    });

    it('handles null to value changes for preconditions', async () => {
      const caseWithNullPre = { ...mockTestCase, preconditions: null };
      const updated = { ...caseWithNullPre, preconditions: 'New precondition' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(caseWithNullPre);
      mockPrisma.caseHistory.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.testCase.update.mockResolvedValue(updated);

      await service.update(
        PROJECT_ID,
        'case-1',
        { preconditions: 'New precondition' },
        USER_ID,
      );

      expect(mockPrisma.caseHistory.createMany).toHaveBeenCalledWith({
        data: [
          {
            caseId: 'case-1',
            userId: USER_ID,
            field: 'preconditions',
            oldValue: null,
            newValue: 'New precondition',
          },
        ],
      });
    });
  });

  // ── findHistory ──

  describe('findHistory', () => {
    const mockHistoryEntry = {
      id: 'hist-1',
      caseId: 'case-1',
      userId: 'user-1',
      field: 'title',
      oldValue: 'Old title',
      newValue: 'New title',
      createdAt: new Date(),
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    };

    it('returns history entries for a case ordered by createdAt desc', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.caseHistory.findMany.mockResolvedValue([mockHistoryEntry]);

      const result = await service.findHistory(PROJECT_ID, 'case-1');

      expect(mockPrisma.caseHistory.findMany).toHaveBeenCalledWith({
        where: { caseId: 'case-1' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockHistoryEntry]);
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(
        service.findHistory(PROJECT_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns empty array when no history exists', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.caseHistory.findMany.mockResolvedValue([]);

      const result = await service.findHistory(PROJECT_ID, 'case-1');

      expect(result).toEqual([]);
    });
  });
});
