import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestRunsService } from './test-runs.service';
import { TestResultStatus } from '@app/shared';

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
    {
      id: 'rc-1',
      testRunId: 'run-1',
      testCaseId: 'case-1',
      testCase: {
        id: 'case-1',
        title: 'Login Test',
        priority: 'MEDIUM',
        type: 'FUNCTIONAL',
        suiteId: 'suite-1',
        suite: { id: 'suite-1', name: 'Login' },
      },
    },
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
      count: jest.fn(),
    },
    testPlan: {
      findFirst: jest.fn(),
    },
    testCase: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    configItem: {
      findMany: jest.fn(),
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
    it('creates a test run with case entries', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.testRun.create.mockResolvedValue(mockRunWithRelations);

      const result = await service.create(PLAN_ID, {
        name: 'Smoke Test',
        caseIds: ['case-1'],
      });

      expect(mockPrisma.testRun.create).toHaveBeenCalledWith({
        data: {
          name: 'Smoke Test',
          testPlanId: PLAN_ID,
          projectId: PROJECT_ID,
          testRunCases: {
            create: [{ testCaseId: 'case-1' }],
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
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrisma.testRun.create.mockResolvedValue({
        ...mockRunWithRelations,
        assignedToId: 'user-1',
      });

      const result = await service.create(PLAN_ID, {
        name: 'Smoke Test',
        caseIds: ['case-1'],
        assignedToId: 'user-1',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result.assignedToId).toBe('user-1');
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PLAN_ID, { name: 'Run', caseIds: ['c1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when cases not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testCase.findMany.mockResolvedValue([]);

      await expect(
        service.create(PLAN_ID, { name: 'Run', caseIds: ['nonexistent'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when assigned user not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(PLAN_ID, {
          name: 'Run',
          caseIds: ['case-1'],
          assignedToId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByPlan', () => {
    it('returns paginated runs with assigned user and case count', async () => {
      const runWithCount = { ...mockRun, assignedTo: null, _count: { testRunCases: 3 } };
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testRun.findMany.mockResolvedValue([runWithCount]);
      mockPrisma.testRun.count.mockResolvedValue(1);

      const result = await service.findAllByPlan(PLAN_ID);

      expect(mockPrisma.testRun.findMany).toHaveBeenCalledWith({
        where: { testPlanId: PLAN_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { testRunCases: true } },
        },
        skip: 0,
        take: 50,
      });
      expect(mockPrisma.testRun.count).toHaveBeenCalledWith({
        where: { testPlanId: PLAN_ID, deletedAt: null },
      });
      expect(result).toEqual({
        data: [runWithCount],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });
    });

    it('filters by status when provided', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testRun.findMany.mockResolvedValue([]);
      mockPrisma.testRun.count.mockResolvedValue(0);

      await service.findAllByPlan(PLAN_ID, { status: 'PENDING' });

      expect(mockPrisma.testRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { testPlanId: PLAN_ID, deletedAt: null, status: 'PENDING' },
        }),
      );
      expect(mockPrisma.testRun.count).toHaveBeenCalledWith({
        where: { testPlanId: PLAN_ID, deletedAt: null, status: 'PENDING' },
      });
    });

    it('filters by assigneeId when provided', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testRun.findMany.mockResolvedValue([]);
      mockPrisma.testRun.count.mockResolvedValue(0);

      await service.findAllByPlan(PLAN_ID, { assigneeId: 'user-1' });

      expect(mockPrisma.testRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { testPlanId: PLAN_ID, deletedAt: null, assignedToId: 'user-1' },
        }),
      );
    });

    it('filters by both status and assigneeId', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testRun.findMany.mockResolvedValue([]);
      mockPrisma.testRun.count.mockResolvedValue(0);

      await service.findAllByPlan(PLAN_ID, { status: 'IN_PROGRESS', assigneeId: 'user-1' });

      expect(mockPrisma.testRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            testPlanId: PLAN_ID,
            deletedAt: null,
            status: 'IN_PROGRESS',
            assignedToId: 'user-1',
          },
        }),
      );
    });

    it('does not add filter when value is empty string', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testRun.findMany.mockResolvedValue([]);
      mockPrisma.testRun.count.mockResolvedValue(0);

      await service.findAllByPlan(PLAN_ID, { status: '', assigneeId: '' });

      expect(mockPrisma.testRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { testPlanId: PLAN_ID, deletedAt: null },
        }),
      );
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

  describe('closeRun', () => {
    it('marks run as COMPLETED', async () => {
      const closed = { ...mockRunWithRelations, status: 'COMPLETED' };
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRun.update.mockResolvedValue(closed);

      const result = await service.closeRun('run-1');

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'COMPLETED' },
        include: expect.objectContaining({
          testPlan: expect.any(Object),
          assignedTo: expect.any(Object),
          testRunCases: expect.any(Object),
        }),
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('throws ConflictException when run is already COMPLETED', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue({ ...mockRun, status: 'COMPLETED' });

      await expect(service.closeRun('run-1')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when run not found', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.closeRun('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rerun', () => {
    const completedRunWithCases = {
      ...mockRun,
      status: 'COMPLETED',
      assignedToId: 'user-1',
      testRunCases: [
        {
          id: 'trc-1',
          testRunId: 'run-1',
          testCaseId: 'case-1',
          testResults: [{ status: TestResultStatus.FAILED }],
        },
        {
          id: 'trc-2',
          testRunId: 'run-1',
          testCaseId: 'case-2',
          testResults: [{ status: TestResultStatus.PASSED }],
        },
        {
          id: 'trc-3',
          testRunId: 'run-1',
          testCaseId: 'case-3',
          testResults: [],
        },
      ],
    };

    it('creates a new run with failed and untested cases from the source run', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(completedRunWithCases);
      const newRun = {
        ...mockRunWithRelations,
        id: 'run-2',
        name: 'Smoke Test (Rerun)',
        sourceRunId: 'run-1',
      };
      mockPrisma.testRun.create.mockResolvedValue(newRun);

      const result = await service.rerun('run-1');

      expect(mockPrisma.testRun.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Smoke Test (Rerun)',
          testPlanId: PLAN_ID,
          projectId: PROJECT_ID,
          assignedToId: 'user-1',
          sourceRunId: 'run-1',
          testRunCases: {
            create: [{ testCaseId: 'case-1' }, { testCaseId: 'case-3' }],
          },
        }),
        include: expect.objectContaining({
          testRunCases: expect.any(Object),
          assignedTo: expect.any(Object),
          testPlan: expect.any(Object),
        }),
      });
      expect(result.sourceRunId).toBe('run-1');
    });

    it('throws NotFoundException when source run not found', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.rerun('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when run is not completed', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue({
        ...completedRunWithCases,
        status: 'IN_PROGRESS',
      });

      await expect(service.rerun('run-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when no failed or untested cases exist', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue({
        ...completedRunWithCases,
        testRunCases: [
          {
            id: 'trc-1',
            testRunId: 'run-1',
            testCaseId: 'case-1',
            testResults: [{ status: TestResultStatus.PASSED }],
          },
        ],
      });

      await expect(service.rerun('run-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createMatrixRuns', () => {
    const mockItems = [
      {
        id: 'item-chrome',
        name: 'Chrome',
        groupId: 'group-browser',
        deletedAt: null,
        group: { id: 'group-browser', name: 'Browser' },
      },
      {
        id: 'item-windows',
        name: 'Windows 10',
        groupId: 'group-os',
        deletedAt: null,
        group: { id: 'group-os', name: 'OS' },
      },
      {
        id: 'item-firefox',
        name: 'Firefox',
        groupId: 'group-browser',
        deletedAt: null,
        group: { id: 'group-browser', name: 'Browser' },
      },
    ];

    it('creates one run per config combination', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.configItem.findMany.mockResolvedValue([mockItems[0], mockItems[1], mockItems[2]]);
      mockPrisma.testRun.create.mockResolvedValue(mockRunWithRelations);

      const result = await service.createMatrixRuns(PLAN_ID, {
        name: 'Run',
        caseIds: ['case-1'],
        configItemIds: [
          ['item-chrome', 'item-windows'],
          ['item-firefox', 'item-windows'],
        ],
      });

      expect(mockPrisma.testRun.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);

      // First call should create run with Chrome / Windows 10
      expect(mockPrisma.testRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Run [Chrome / Windows 10]',
            configLabel: 'Chrome / Windows 10',
          }),
        }),
      );
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);

      await expect(
        service.createMatrixRuns(PLAN_ID, {
          name: 'Run',
          caseIds: ['case-1'],
          configItemIds: [['item-1']],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when config items not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(mockPlan);
      mockPrisma.testCase.findMany.mockResolvedValue([{ id: 'case-1' }]);
      mockPrisma.configItem.findMany.mockResolvedValue([]);

      await expect(
        service.createMatrixRuns(PLAN_ID, {
          name: 'Run',
          caseIds: ['case-1'],
          configItemIds: [['nonexistent']],
        }),
      ).rejects.toThrow(BadRequestException);
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
