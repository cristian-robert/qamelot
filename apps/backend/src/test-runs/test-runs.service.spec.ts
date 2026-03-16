import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestRunsService } from './test-runs.service';

const PLAN_ID = 'plan-1';
const PROJECT_ID = 'proj-1';

const mockPlan = {
  id: PLAN_ID,
  name: 'Sprint 1 Plan',
  projectId: PROJECT_ID,
  status: 'DRAFT',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRun = {
  id: 'run-1',
  name: 'Smoke Test',
  testPlanId: PLAN_ID,
  projectId: PROJECT_ID,
  assignedToId: null,
  status: 'PENDING',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRunWithRelations = {
  ...mockRun,
  testPlan: { id: PLAN_ID, name: 'Sprint 1 Plan' },
  assignedTo: null,
  testRunCases: [
    { id: 'rc-1', testRunId: 'run-1', suiteId: 'suite-1', suite: { id: 'suite-1', name: 'Login' } },
  ],
};

describe('TestRunsService', () => {
  let service: TestRunsService;

  const mockPrisma = {
    testRun: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    testPlan: {
      findFirst: jest.fn(),
    },
    testSuite: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestRunsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TestRunsService>(TestRunsService);
  });

  describe('create', () => {
    it('creates a test run with suite cases', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testSuite.findMany.mockResolvedValue([{ id: 'suite-1' }]);
      mockPrisma.testRun.create.mockResolvedValue(mockRunWithRelations);

      const result = await service.create(PLAN_ID, {
        name: 'Smoke Test',
        suiteIds: ['suite-1'],
      });

      expect(mockPrisma.testRun.create).toHaveBeenCalledWith({
        data: {
          name: 'Smoke Test',
          testPlanId: PLAN_ID,
          projectId: PROJECT_ID,
          testRunCases: {
            create: [{ suiteId: 'suite-1' }],
          },
        },
        include: expect.objectContaining({
          testRunCases: expect.any(Object),
          assignedTo: expect.any(Object),
          testPlan: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockRunWithRelations);
    });

    it('creates a run with assignedToId', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testSuite.findMany.mockResolvedValue([{ id: 'suite-1' }]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.testRun.create.mockResolvedValue({
        ...mockRunWithRelations,
        assignedToId: 'user-1',
      });

      const result = await service.create(PLAN_ID, {
        name: 'Smoke Test',
        suiteIds: ['suite-1'],
        assignedToId: 'user-1',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result.assignedToId).toBe('user-1');
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PLAN_ID, { name: 'Run', suiteIds: ['s1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when suites not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testSuite.findMany.mockResolvedValue([]);

      await expect(
        service.create(PLAN_ID, { name: 'Run', suiteIds: ['nonexistent'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when assigned user not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testSuite.findMany.mockResolvedValue([{ id: 'suite-1' }]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(PLAN_ID, {
          name: 'Run',
          suiteIds: ['suite-1'],
          assignedToId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByPlan', () => {
    it('returns runs with assigned user and case count', async () => {
      const runWithCount = { ...mockRun, assignedTo: null, _count: { testRunCases: 3 } };
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testRun.findMany.mockResolvedValue([runWithCount]);

      const result = await service.findAllByPlan(PLAN_ID);

      expect(mockPrisma.testRun.findMany).toHaveBeenCalledWith({
        where: { testPlanId: PLAN_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { testRunCases: true } },
        },
      });
      expect(result).toEqual([runWithCount]);
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(service.findAllByPlan('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns run with all relations', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRunWithRelations);

      const result = await service.findOne('run-1');

      expect(mockPrisma.testRun.findFirst).toHaveBeenCalledWith({
        where: { id: 'run-1', deletedAt: null },
        include: expect.objectContaining({
          testPlan: expect.any(Object),
          assignedTo: expect.any(Object),
          testRunCases: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockRunWithRelations);
    });

    it('throws NotFoundException when run not found', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates run name', async () => {
      const updated = { ...mockRun, name: 'Renamed' };
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRun.update.mockResolvedValue(updated);

      const result = await service.update('run-1', { name: 'Renamed' });

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { name: 'Renamed' },
      });
      expect(result).toEqual(updated);
    });

    it('updates run status', async () => {
      const updated = { ...mockRun, status: 'IN_PROGRESS' };
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRun.update.mockResolvedValue(updated);

      const result = await service.update('run-1', { status: 'IN_PROGRESS' });

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'IN_PROGRESS' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when run not found', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the run', async () => {
      const deleted = { ...mockRun, deletedAt: new Date() };
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRun.update.mockResolvedValue(deleted);

      const result = await service.softDelete('run-1');

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when run not found', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
