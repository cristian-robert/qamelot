import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestCasesService } from './test-cases.service';

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockTestCase = {
  id: 'case-1',
  title: 'Verify login with valid credentials',
  preconditions: 'User exists in the system',
  steps: [{ action: 'Enter username', expected: 'Username accepted' }],
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
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
    },
    project: {
      findFirst: jest.fn(),
    },
    testSuite: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestCasesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TestCasesService>(TestCasesService);
  });

  describe('create', () => {
    it('creates a test case in a suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.create.mockResolvedValue(mockTestCase);

      const result = await service.create(PROJECT_ID, SUITE_ID, {
        title: 'Verify login with valid credentials',
        preconditions: 'User exists in the system',
        steps: [{ action: 'Enter username', expected: 'Username accepted' }],
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testSuite.findFirst).toHaveBeenCalledWith({
        where: { id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: {
          title: 'Verify login with valid credentials',
          preconditions: 'User exists in the system',
          steps: [{ action: 'Enter username', expected: 'Username accepted' }],
          projectId: PROJECT_ID,
          suiteId: SUITE_ID,
        },
      });
      expect(result).toEqual(mockTestCase);
    });

    it('creates a case with defaults when optional fields omitted', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.create.mockResolvedValue(mockTestCase);

      await service.create(PROJECT_ID, SUITE_ID, { title: 'Simple case' });

      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: {
          title: 'Simple case',
          projectId: PROJECT_ID,
          suiteId: SUITE_ID,
        },
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

  describe('findAllBySuite', () => {
    it('returns all non-deleted cases for a suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([mockTestCase]);

      const result = await service.findAllBySuite(PROJECT_ID, SUITE_ID);

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith({
        where: { suiteId: SUITE_ID, projectId: PROJECT_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockTestCase]);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllBySuite(PROJECT_ID, SUITE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns a single test case', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);

      const result = await service.findOne(PROJECT_ID, 'case-1');

      expect(mockPrisma.testCase.findFirst).toHaveBeenCalledWith({
        where: { id: 'case-1', projectId: PROJECT_ID, deletedAt: null },
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
      });
      expect(result).toEqual(updated);
    });

    it('updates steps, priority, type, and automationFlag', async () => {
      const newSteps = [{ action: 'Click login', expected: 'Dashboard shown' }];
      const updated = {
        ...mockTestCase,
        steps: newSteps,
        priority: 'HIGH',
        type: 'REGRESSION',
        automationFlag: true,
      };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'case-1', {
        steps: newSteps,
        priority: 'HIGH',
        type: 'REGRESSION',
        automationFlag: true,
      });

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: {
          steps: newSteps,
          priority: 'HIGH',
          type: 'REGRESSION',
          automationFlag: true,
        },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

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
});
