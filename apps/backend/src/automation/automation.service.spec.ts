import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';

describe('AutomationService', () => {
  let service: AutomationService;
  const mockPrisma = {
    project: { findFirst: jest.fn(), create: jest.fn() },
    testPlan: { findFirst: jest.fn(), create: jest.fn() },
    testCase: { findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    testRun: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    testRunCase: { findFirst: jest.fn() },
    testResult: { create: jest.fn() },
    apiKey: { findUnique: jest.fn() },
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
      mockPrisma.testCase.findMany
        .mockResolvedValueOnce([])   // exact match
        .mockResolvedValueOnce([]);  // suffix fallback: allAutomated
      await expect(service.createRun({
        projectId: 'proj-1', planId: 'plan-1', name: 'Run', automationIds: ['no-match'],
      }, 'proj-1')).rejects.toThrow(BadRequestException);
    });

    it('matches cases via suffix fallback when DB has absolute paths', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue({ id: 'plan-1', projectId: 'proj-1' });
      // First call: exact match finds nothing
      mockPrisma.testCase.findMany
        .mockResolvedValueOnce([])
        // Second call: suffix fallback loads all automated cases
        .mockResolvedValueOnce([
          { id: 'case-1', automationId: '/Users/dev/project/tests/login.spec.ts > Auth > should login' },
        ]);
      mockPrisma.testRun.create.mockResolvedValue({
        id: 'run-1', name: 'CI Run', executionType: 'AUTOMATED', status: 'PENDING',
        testRunCases: [{ id: 'trc-1', testCaseId: 'case-1', testCase: { id: 'case-1', title: 'Login', automationId: 'tests/login.spec.ts > Auth > should login' } }],
      });

      const result = await service.createRun({
        projectId: 'proj-1', planId: 'plan-1', name: 'CI Run',
        automationIds: ['tests/login.spec.ts > Auth > should login'],
      }, 'proj-1');

      expect(result.id).toBe('run-1');
      expect(result.unmatchedIds).toEqual([]);
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

      mockPrisma.apiKey.findUnique.mockResolvedValue({ createdById: 'user-1' });
      const result = await service.submitResult('run-1', {
        automationId: 'test.spec.ts > test', status: 'PASSED', duration: 1500,
      }, 'proj-1', 'key-1');

      expect(result).not.toBeNull();
      expect(mockPrisma.testResult.create).toHaveBeenCalled();
    });

    it('returns null when no matching case found', async () => {
      mockPrisma.testRunCase.findFirst.mockResolvedValue(null);
      const result = await service.submitResult('run-1', {
        automationId: 'unknown', status: 'PASSED',
      }, 'proj-1', 'key-1');
      expect(result).toBeNull();
    });

    it('auto-transitions run to IN_PROGRESS on first result', async () => {
      mockPrisma.testRunCase.findFirst.mockResolvedValue({
        id: 'trc-1', testRunId: 'run-1', testRun: { status: 'PENDING' },
      });
      mockPrisma.testRun.update.mockResolvedValue({});
      mockPrisma.testResult.create.mockResolvedValue({ id: 'r-1', status: 'PASSED' });

      mockPrisma.apiKey.findUnique.mockResolvedValue({ createdById: 'user-1' });
      await service.submitResult('run-1', {
        automationId: 'test', status: 'PASSED',
      }, 'proj-1', 'key-1');

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

    it('migrates absolute-path automation IDs to relative via suffix matching', async () => {
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1', automationId: '/Users/dev/project/tests/login.spec.ts > Auth > should login' },
      ]);
      mockPrisma.testCase.update.mockResolvedValue({});
      mockPrisma.testCase.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.syncTests('proj-1', [
        { automationId: 'tests/login.spec.ts > Auth > should login', title: 'Login', filePath: 'tests/login.spec.ts' },
      ]);

      expect(result.matched).toBe(1);
      expect(result.stale).toBe(0);
      expect(result.unmatched).toEqual([]);
      // Should have updated the automationId to the relative version
      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: {
          automationId: 'tests/login.spec.ts > Auth > should login',
          automationFilePath: 'tests/login.spec.ts',
          automationStatus: 'AUTOMATED',
        },
      });
    });
  });

  describe('setupProject', () => {
    it('returns existing project and plan when found by name', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'proj-1', name: 'Playwright Integration Test',
      });
      mockPrisma.testPlan.findFirst.mockResolvedValue({
        id: 'plan-1', name: 'Automation Plan', projectId: 'proj-1',
      });

      const result = await service.setupProject({
        projectName: 'Playwright Integration Test',
        planName: 'Automation Plan',
      });

      expect(result.projectId).toBe('proj-1');
      expect(result.planId).toBe('plan-1');
      expect(result.created).toBe(false);
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });

    it('creates project when not found by name', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue({
        id: 'proj-new', name: 'New Project',
      });
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);
      mockPrisma.testPlan.create.mockResolvedValue({
        id: 'plan-new', name: 'Automation Plan', projectId: 'proj-new',
      });

      const result = await service.setupProject({
        projectName: 'New Project',
        planName: 'Automation Plan',
      });

      expect(result.projectId).toBe('proj-new');
      expect(result.planId).toBe('plan-new');
      expect(result.created).toBe(true);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: { name: 'New Project' },
      });
    });

    it('creates plan when project exists but plan does not', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'proj-1', name: 'Existing Project',
      });
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);
      mockPrisma.testPlan.create.mockResolvedValue({
        id: 'plan-new', name: 'Automation Plan', projectId: 'proj-1',
      });

      const result = await service.setupProject({
        projectName: 'Existing Project',
        planName: 'Automation Plan',
      });

      expect(result.projectId).toBe('proj-1');
      expect(result.planId).toBe('plan-new');
      expect(result.created).toBe(false);
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
      expect(mockPrisma.testPlan.create).toHaveBeenCalled();
    });
  });
});
