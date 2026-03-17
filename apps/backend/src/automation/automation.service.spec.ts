import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';

describe('AutomationService', () => {
  let service: AutomationService;
  const mockPrisma = {
    testPlan: { findFirst: jest.fn() },
    testCase: { findMany: jest.fn(), updateMany: jest.fn() },
    testRun: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    testRunCase: { findFirst: jest.fn() },
    testResult: { create: jest.fn() },
  };

  const mockRunEventsService = { emitUpdate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RunEventsService, useValue: mockRunEventsService },
      ],
    }).compile();
    service = module.get<AutomationService>(AutomationService);
  });

  describe('createRun', () => {
    it('creates an automated test run with matched cases', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue({ id: 'plan-1', projectId: 'proj-1' });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1', automationId: 'tests/login.spec.ts > should login' },
        { id: 'case-2', automationId: 'tests/signup.spec.ts > should signup' },
      ]);
      mockPrisma.testRun.create.mockResolvedValue({
        id: 'run-1', name: 'CI Run', executionType: 'AUTOMATED', status: 'PENDING',
        testRunCases: [
          { id: 'trc-1', testCaseId: 'case-1', testCase: { id: 'case-1', title: 'Login', automationId: 'tests/login.spec.ts > should login' } },
          { id: 'trc-2', testCaseId: 'case-2', testCase: { id: 'case-2', title: 'Signup', automationId: 'tests/signup.spec.ts > should signup' } },
        ],
      });

      const result = await service.createRun({
        projectId: 'proj-1', planId: 'plan-1', name: 'CI Run',
        automationIds: ['tests/login.spec.ts > should login', 'tests/signup.spec.ts > should signup'],
      }, 'proj-1');

      expect(result.id).toBe('run-1');
      expect(result.executionType).toBe('AUTOMATED');
      expect(mockPrisma.testRun.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);
      await expect(service.createRun({
        projectId: 'proj-1', planId: 'bad', name: 'Run', automationIds: ['x'],
      }, 'proj-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when no cases match', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue({ id: 'plan-1', projectId: 'proj-1' });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      await expect(service.createRun({
        projectId: 'proj-1', planId: 'plan-1', name: 'Run', automationIds: ['no-match'],
      }, 'proj-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitResult', () => {
    it('creates a test result for a matched case', async () => {
      mockPrisma.testRunCase.findFirst.mockResolvedValue({
        id: 'trc-1', testRunId: 'run-1', testRun: { status: 'IN_PROGRESS' },
      });
      mockPrisma.testResult.create.mockResolvedValue({
        id: 'result-1', status: 'PASSED', testRunCaseId: 'trc-1',
      });

      const result = await service.submitResult('run-1', {
        automationId: 'test.spec.ts > test', status: 'PASSED', duration: 1500,
      }, 'proj-1');

      expect(result).not.toBeNull();
      expect(mockPrisma.testResult.create).toHaveBeenCalled();
    });

    it('returns null when no matching case found', async () => {
      mockPrisma.testRunCase.findFirst.mockResolvedValue(null);
      const result = await service.submitResult('run-1', {
        automationId: 'unknown', status: 'PASSED',
      }, 'proj-1');
      expect(result).toBeNull();
    });

    it('auto-transitions run to IN_PROGRESS on first result', async () => {
      mockPrisma.testRunCase.findFirst.mockResolvedValue({
        id: 'trc-1', testRunId: 'run-1', testRun: { status: 'PENDING' },
      });
      mockPrisma.testRun.update.mockResolvedValue({});
      mockPrisma.testResult.create.mockResolvedValue({ id: 'r-1', status: 'PASSED' });

      await service.submitResult('run-1', {
        automationId: 'test', status: 'PASSED',
      }, 'proj-1');

      expect(mockPrisma.testRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'IN_PROGRESS' },
      });
    });
  });

  describe('completeRun', () => {
    it('marks run as completed', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue({ id: 'run-1' });
      mockPrisma.testRun.update.mockResolvedValue({ id: 'run-1', status: 'COMPLETED' });
      const result = await service.completeRun('run-1', 'proj-1');
      expect(result.status).toBe('COMPLETED');
    });

    it('throws NotFoundException when run not found', async () => {
      mockPrisma.testRun.findFirst.mockResolvedValue(null);
      await expect(service.completeRun('bad', 'proj-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAutomatedCases', () => {
    it('returns cases with automation IDs', async () => {
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1', automationId: 'test.spec.ts > should work', title: 'Login test', suiteId: 'suite-1' },
      ]);
      const result = await service.listAutomatedCases('proj-1');
      expect(result).toHaveLength(1);
      expect(result[0].automationId).toBe('test.spec.ts > should work');
    });
  });

  describe('syncTests', () => {
    it('updates matched cases and marks stale ones', async () => {
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1', automationId: 'test-a' },
        { id: 'case-2', automationId: 'test-stale' },
      ]);
      mockPrisma.testCase.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.syncTests('proj-1', [
        { automationId: 'test-a', title: 'Test A', filePath: 'a.spec.ts' },
        { automationId: 'test-new', title: 'Test New', filePath: 'new.spec.ts' },
      ]);

      expect(result.matched).toBe(1);
      expect(result.stale).toBe(1);
      expect(result.unmatched).toEqual(['test-new']);
    });
  });
});
