import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestResultStatus } from '@app/shared';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    project: { findFirst: jest.fn(), count: jest.fn() },
    testCase: { findMany: jest.fn() },
    testRunCase: { findMany: jest.fn() },
    testRun: { findMany: jest.fn(), count: jest.fn() },
    testResult: { findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('getCoverage', () => {
    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getCoverage('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns zero coverage when no test run cases exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testRunCase.findMany.mockResolvedValue([]);

      const result = await service.getCoverage('p1');

      expect(result.totalCases).toBe(0);
      expect(result.covered).toBe(0);
      expect(result.coveragePercent).toBe(0);
      expect(result.byStatus).toEqual([]);
    });

    it('calculates coverage with mixed statuses', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { testResults: [{ status: TestResultStatus.PASSED }] },
        { testResults: [{ status: TestResultStatus.FAILED }] },
        { testResults: [] },
      ]);

      const result = await service.getCoverage('p1');

      expect(result.totalCases).toBe(3);
      expect(result.covered).toBe(2);
      expect(result.coveragePercent).toBe(66.67);
      expect(result.byStatus).toEqual(
        expect.arrayContaining([
          { status: TestResultStatus.PASSED, count: 1 },
          { status: TestResultStatus.FAILED, count: 1 },
          { status: TestResultStatus.UNTESTED, count: 1 },
        ]),
      );
    });
  });

  describe('getProgress', () => {
    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getProgress('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns empty runs array when no runs exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testRun.findMany.mockResolvedValue([]);

      const result = await service.getProgress('p1');

      expect(result.runs).toEqual([]);
    });

    it('calculates per-run progress counts', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testRun.findMany.mockResolvedValue([
        {
          id: 'r1',
          name: 'Run 1',
          createdAt: new Date('2026-01-15'),
          testRunCases: [
            { testResults: [{ status: TestResultStatus.PASSED }] },
            { testResults: [{ status: TestResultStatus.FAILED }] },
          ],
        },
      ]);

      const result = await service.getProgress('p1');

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0]).toEqual({
        runId: 'r1',
        runName: 'Run 1',
        createdAt: '2026-01-15T00:00:00.000Z',
        total: 2,
        passed: 1,
        failed: 1,
        blocked: 0,
        retest: 0,
        untested: 0,
      });
    });
  });

  describe('getActivity', () => {
    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getActivity('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns empty entries when no results in last 30 days', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testResult.findMany.mockResolvedValue([]);

      const result = await service.getActivity('p1');

      expect(result.entries).toEqual([]);
    });

    it('groups results by user and date', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testResult.findMany.mockResolvedValue([
        { createdAt: new Date('2026-03-10T10:00:00Z'), executedBy: { id: 'u1', name: 'Alice' } },
        { createdAt: new Date('2026-03-10T11:00:00Z'), executedBy: { id: 'u1', name: 'Alice' } },
        { createdAt: new Date('2026-03-10T12:00:00Z'), executedBy: { id: 'u2', name: 'Bob' } },
      ]);

      const result = await service.getActivity('p1');

      expect(result.entries).toHaveLength(2);
      expect(result.entries).toEqual(
        expect.arrayContaining([
          { date: '2026-03-10', userId: 'u1', userName: 'Alice', count: 2 },
          { date: '2026-03-10', userId: 'u2', userName: 'Bob', count: 1 },
        ]),
      );
    });
  });

  describe('getReferenceCoverage', () => {
    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getReferenceCoverage('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('returns empty references when no cases have references', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      mockPrisma.testRunCase.findMany.mockResolvedValue([]);

      const result = await service.getReferenceCoverage('p1');

      expect(result.references).toEqual([]);
    });

    it('aggregates cases by reference and calculates coverage', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'c1', references: 'REQ-001, REQ-002', suiteId: 's1' },
        { id: 'c2', references: 'REQ-001', suiteId: 's1' },
        { id: 'c3', references: 'REQ-002', suiteId: 's2' },
      ]);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { suiteId: 's1', testResults: [{ status: TestResultStatus.PASSED }] },
        { suiteId: 's2', testResults: [] },
      ]);

      const result = await service.getReferenceCoverage('p1');

      expect(result.references).toHaveLength(2);

      const req001 = result.references.find((r) => r.reference === 'REQ-001');
      expect(req001).toEqual({
        reference: 'REQ-001',
        totalCases: 2,
        passed: 2,
        failed: 0,
        blocked: 0,
        retest: 0,
        untested: 0,
        coveragePercent: 100,
      });

      const req002 = result.references.find((r) => r.reference === 'REQ-002');
      expect(req002).toBeDefined();
      expect(req002!.totalCases).toBe(2);
      expect(req002!.passed).toBe(1);
      expect(req002!.untested).toBe(1);
      expect(req002!.coveragePercent).toBe(50);
    });

    it('handles URL references correctly', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'c1', references: 'https://jira.example.com/PROJ-42', suiteId: 's1' },
      ]);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { suiteId: 's1', testResults: [{ status: TestResultStatus.FAILED }] },
      ]);

      const result = await service.getReferenceCoverage('p1');

      expect(result.references).toHaveLength(1);
      expect(result.references[0].reference).toBe('https://jira.example.com/PROJ-42');
      expect(result.references[0].failed).toBe(1);
      expect(result.references[0].coveragePercent).toBe(100);
    });

    it('returns sorted references alphabetically', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'c1', references: 'ZEBRA-01', suiteId: 's1' },
        { id: 'c2', references: 'ALPHA-01', suiteId: 's1' },
      ]);
      mockPrisma.testRunCase.findMany.mockResolvedValue([]);

      const result = await service.getReferenceCoverage('p1');

      expect(result.references[0].reference).toBe('ALPHA-01');
      expect(result.references[1].reference).toBe('ZEBRA-01');
    });
  });

  describe('getSummary', () => {
    it('returns dashboard summary with counts and recent results', async () => {
      mockPrisma.project.count.mockResolvedValue(3);
      mockPrisma.testRun.count.mockResolvedValue(1);
      mockPrisma.testResult.findMany.mockResolvedValue([
        {
          id: 'tr1',
          status: TestResultStatus.PASSED,
          createdAt: new Date('2026-03-15'),
          executedBy: { name: 'Alice' },
          testRun: { name: 'Run 1' },
          testRunCase: { testCase: { title: 'Login Test' } },
        },
      ]);
      mockPrisma.testResult.count.mockResolvedValue(42);
      mockPrisma.testRunCase.findMany.mockResolvedValue([
        { testResults: [{ status: TestResultStatus.PASSED }] },
        { testResults: [{ status: TestResultStatus.FAILED }] },
      ]);

      const result = await service.getSummary();

      expect(result.totalProjects).toBe(3);
      expect(result.activeRuns).toBe(1);
      expect(result.overallPassRate).toBe(50);
      expect(result.recentActivityCount).toBe(42);
      expect(result.recentResults).toHaveLength(1);
      expect(result.recentResults[0]).toEqual({
        id: 'tr1',
        status: TestResultStatus.PASSED,
        userName: 'Alice',
        runName: 'Run 1',
        caseName: 'Login Test',
        createdAt: '2026-03-15T00:00:00.000Z',
      });
    });

    it('returns zero pass rate when no results exist', async () => {
      mockPrisma.project.count.mockResolvedValue(0);
      mockPrisma.testRun.count.mockResolvedValue(0);
      mockPrisma.testResult.findMany.mockResolvedValue([]);
      mockPrisma.testResult.count.mockResolvedValue(0);
      mockPrisma.testRunCase.findMany.mockResolvedValue([]);

      const result = await service.getSummary();

      expect(result.overallPassRate).toBe(0);
      expect(result.recentResults).toEqual([]);
    });
  });
});
