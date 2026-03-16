import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';
import { TestResultsService } from './test-results.service';
import { TestResultStatus } from '@app/shared';

const RUN_ID = 'run-1';
const TRC_ID = 'trc-1';
const USER_ID = 'user-1';

const mockRun = {
  id: RUN_ID,
  name: 'Smoke Test',
  testPlanId: 'plan-1',
  projectId: 'proj-1',
  assignedToId: null,
  status: 'PENDING',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRunCase = {
  id: TRC_ID,
  testRunId: RUN_ID,
  suiteId: 'suite-1',
  createdAt: new Date(),
};

const mockResult = {
  id: 'result-1',
  testRunCaseId: TRC_ID,
  testRunId: RUN_ID,
  executedById: USER_ID,
  status: TestResultStatus.PASSED,
  comment: null,
  elapsed: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  executedBy: { id: USER_ID, name: 'Tester', email: 'test@example.com' },
};

describe('TestResultsService', () => {
  let service: TestResultsService;

  const mockPrisma = {
    testRun: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    testRunCase: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    testResult: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockRunEventsService = {
    emitUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestResultsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RunEventsService, useValue: mockRunEventsService },
      ],
    }).compile();
    service = module.get<TestResultsService>(TestResultsService);
  });

  describe('submit', () => {
    it('creates a test result and emits SSE event', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRunCase.findFirst.mockResolvedValue(mockRunCase);
      mockPrisma.testResult.create.mockResolvedValue(mockResult);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { ...mockRunCase, testResults: [{ status: TestResultStatus.PASSED }] },
      ]);
      mockPrisma.testRun.update.mockResolvedValue({ ...mockRun, status: 'COMPLETED' });
      mockPrisma.testRun.findUnique.mockResolvedValue({ status: 'COMPLETED' });

      const result = await service.submit(RUN_ID, USER_ID, {
        testRunCaseId: TRC_ID,
        status: TestResultStatus.PASSED,
      });

      expect(mockPrisma.testResult.create).toHaveBeenCalledWith({
        data: {
          testRunCaseId: TRC_ID,
          testRunId: RUN_ID,
          executedById: USER_ID,
          status: TestResultStatus.PASSED,
        },
        include: {
          executedBy: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result).toEqual(mockResult);
      expect(mockRunEventsService.emitUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ runId: RUN_ID }),
      );
    });

    it('throws NotFoundException when run does not exist', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(
        service.submit(RUN_ID, USER_ID, {
          testRunCaseId: TRC_ID,
          status: TestResultStatus.PASSED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when case does not belong to run', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRunCase.findFirst.mockResolvedValue(null);

      await expect(
        service.submit(RUN_ID, USER_ID, {
          testRunCaseId: 'wrong-trc',
          status: TestResultStatus.PASSED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets run to IN_PROGRESS on first result when PENDING', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testRunCase.findFirst.mockResolvedValue(mockRunCase);
      mockPrisma.testResult.create.mockResolvedValue(mockResult);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { ...mockRunCase, testResults: [{ status: TestResultStatus.PASSED }] },
        { id: 'trc-2', testRunId: RUN_ID, testResults: [] },
      ]);
      mockPrisma.testRun.update.mockResolvedValue({ ...mockRun, status: 'IN_PROGRESS' });
      mockPrisma.testRun.findUnique.mockResolvedValue({ status: 'IN_PROGRESS' });

      await service.submit(RUN_ID, USER_ID, {
        testRunCaseId: TRC_ID,
        status: TestResultStatus.PASSED,
      });

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: RUN_ID },
        data: { status: 'IN_PROGRESS' },
      });
    });

    it('sets run to COMPLETED when all cases have non-UNTESTED results', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue({ ...mockRun, status: 'IN_PROGRESS' });
      mockPrisma.testRunCase.findFirst.mockResolvedValue(mockRunCase);
      mockPrisma.testResult.create.mockResolvedValue(mockResult);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { ...mockRunCase, testResults: [{ status: TestResultStatus.PASSED }] },
      ]);
      mockPrisma.testRun.update.mockResolvedValue({ ...mockRun, status: 'COMPLETED' });
      mockPrisma.testRun.findUnique.mockResolvedValue({ status: 'COMPLETED' });

      await service.submit(RUN_ID, USER_ID, {
        testRunCaseId: TRC_ID,
        status: TestResultStatus.PASSED,
      });

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: RUN_ID },
        data: { status: 'COMPLETED' },
      });
    });
  });

  describe('findAllByRun', () => {
    it('returns all results for a run', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(mockRun);
      mockPrisma.testResult.findMany.mockResolvedValue([mockResult]);

      const result = await service.findAllByRun(RUN_ID);

      expect(mockPrisma.testResult.findMany).toHaveBeenCalledWith({
        where: { testRunId: RUN_ID },
        orderBy: { createdAt: 'desc' },
        include: {
          executedBy: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result).toEqual([mockResult]);
    });

    it('throws NotFoundException when run does not exist', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.findAllByRun('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a result status and emits SSE event', async () => {
      const updated = { ...mockResult, status: TestResultStatus.FAILED };
      mockPrisma.testResult.findUnique.mockResolvedValue(mockResult);
      mockPrisma.testResult.update.mockResolvedValue(updated);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { ...mockRunCase, testResults: [{ status: TestResultStatus.FAILED }] },
      ]);
      mockPrisma.testRun.update.mockResolvedValue({ ...mockRun, status: 'COMPLETED' });
      mockPrisma.testRun.findUnique.mockResolvedValue({ status: 'COMPLETED' });

      const result = await service.update('result-1', { status: TestResultStatus.FAILED });

      expect(mockPrisma.testResult.update).toHaveBeenCalledWith({
        where: { id: 'result-1' },
        data: { status: TestResultStatus.FAILED },
        include: {
          executedBy: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result).toEqual(updated);
      expect(mockRunEventsService.emitUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ runId: RUN_ID }),
      );
    });

    it('updates a result comment', async () => {
      const updated = { ...mockResult, comment: 'New comment' };
      mockPrisma.testResult.findUnique.mockResolvedValue(mockResult);
      mockPrisma.testResult.update.mockResolvedValue(updated);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { ...mockRunCase, testResults: [{ status: TestResultStatus.PASSED }] },
      ]);
      mockPrisma.testRun.update.mockResolvedValue({ ...mockRun, status: 'COMPLETED' });
      mockPrisma.testRun.findUnique.mockResolvedValue({ status: 'COMPLETED' });

      const result = await service.update('result-1', { comment: 'New comment' });

      expect(result.comment).toBe('New comment');
    });

    it('throws NotFoundException when result does not exist', async () => {
      mockPrisma.testResult.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { status: TestResultStatus.FAILED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRunWithSummary', () => {
    it('returns run with cases, latest results, and summary', async () => {
      const runWithCases = {
        ...mockRun,
        testPlan: { id: 'plan-1', name: 'Plan' },
        assignedTo: null,
        testRunCases: [
          {
            ...mockRunCase,
            suite: { id: 'suite-1', name: 'Suite' },
            testResults: [mockResult],
          },
          {
            id: 'trc-2',
            testRunId: RUN_ID,
            suiteId: 'suite-2',
            createdAt: new Date(),
            suite: { id: 'suite-2', name: 'Suite 2' },
            testResults: [],
          },
        ],
      };
      mockPrisma.testRun.findFirst.mockResolvedValue(runWithCases);

      const result = await service.getRunWithSummary(RUN_ID);

      expect(result.summary).toEqual({
        total: 2,
        passed: 1,
        failed: 0,
        blocked: 0,
        retest: 0,
        untested: 1,
      });
      expect(result.testRunCases[0].latestResult).toEqual(mockResult);
      expect(result.testRunCases[1].latestResult).toBeNull();
    });

    it('throws NotFoundException when run does not exist', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);

      await expect(service.getRunWithSummary('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateSummary', () => {
    it('correctly counts all status types', () => {
      const cases = [
        { testResults: [{ status: TestResultStatus.PASSED }] },
        { testResults: [{ status: TestResultStatus.FAILED }] },
        { testResults: [{ status: TestResultStatus.BLOCKED }] },
        { testResults: [{ status: TestResultStatus.RETEST }] },
        { testResults: [] },
      ];

      const summary = service.calculateSummary(cases);

      expect(summary).toEqual({
        total: 5,
        passed: 1,
        failed: 1,
        blocked: 1,
        retest: 1,
        untested: 1,
      });
    });
  });
});
