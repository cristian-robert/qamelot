import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import type {
  CoverageReportDto,
  ProgressReportDto,
  ActivityReportDto,
  DashboardSummaryDto,
  ReferenceCoverageDto,
  ComparisonReportDto,
  DefectSummaryReportDto,
  UserWorkloadReportDto,
} from '@app/shared';
import { TestResultStatus } from '@app/shared';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockService = {
    getCoverage: jest.fn(),
    getProgress: jest.fn(),
    getActivity: jest.fn(),
    getReferenceCoverage: jest.fn(),
    getComparison: jest.fn(),
    getDefectSummary: jest.fn(),
    getUserWorkload: jest.fn(),
    getSummary: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  describe('getCoverage', () => {
    it('delegates to service and returns coverage report', async () => {
      const coverage: CoverageReportDto = {
        totalCases: 10,
        covered: 8,
        coveragePercent: 80,
        byStatus: [
          { status: TestResultStatus.PASSED, count: 6 },
          { status: TestResultStatus.FAILED, count: 2 },
          { status: TestResultStatus.UNTESTED, count: 2 },
        ],
      };
      mockService.getCoverage.mockResolvedValue(coverage);

      const result = await controller.getCoverage('proj-1');

      expect(mockService.getCoverage).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(coverage);
    });
  });

  describe('getProgress', () => {
    it('delegates to service and returns progress report', async () => {
      const progress: ProgressReportDto = { runs: [] };
      mockService.getProgress.mockResolvedValue(progress);

      const result = await controller.getProgress('proj-1');

      expect(mockService.getProgress).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(progress);
    });
  });

  describe('getActivity', () => {
    it('delegates to service with date range and returns activity report', async () => {
      const activity: ActivityReportDto = { entries: [] };
      mockService.getActivity.mockResolvedValue(activity);

      const dateRange = { startDate: '2026-01-01', endDate: '2026-06-30' };
      const result = await controller.getActivity('proj-1', dateRange);

      expect(mockService.getActivity).toHaveBeenCalledWith('proj-1', dateRange);
      expect(result).toEqual(activity);
    });
  });

  describe('getReferenceCoverage', () => {
    it('delegates to service and returns reference coverage report', async () => {
      const refCoverage: ReferenceCoverageDto = {
        references: [
          {
            reference: 'REQ-001',
            totalCases: 3,
            passed: 2,
            failed: 1,
            blocked: 0,
            retest: 0,
            untested: 0,
            coveragePercent: 100,
          },
        ],
      };
      mockService.getReferenceCoverage.mockResolvedValue(refCoverage);

      const result = await controller.getReferenceCoverage('proj-1');

      expect(mockService.getReferenceCoverage).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(refCoverage);
    });
  });

  describe('getComparison', () => {
    it('delegates to service with run IDs', async () => {
      const comparison: ComparisonReportDto = {
        runA: { id: 'r1', name: 'Run 1', createdAt: '2026-01-01T00:00:00.000Z', total: 5, passed: 3, failed: 2 },
        runB: { id: 'r2', name: 'Run 2', createdAt: '2026-01-15T00:00:00.000Z', total: 5, passed: 4, failed: 1 },
        newPasses: [],
        newFailures: [],
        fixed: [{ testCaseId: 'c1', testCaseTitle: 'Test', statusInA: TestResultStatus.FAILED, statusInB: TestResultStatus.PASSED }],
        regressions: [],
        unchanged: 4,
      };
      mockService.getComparison.mockResolvedValue(comparison);

      const result = await controller.getComparison('proj-1', { runIdA: 'r1', runIdB: 'r2' });

      expect(mockService.getComparison).toHaveBeenCalledWith('proj-1', 'r1', 'r2');
      expect(result).toEqual(comparison);
    });
  });

  describe('getDefectSummary', () => {
    it('delegates to service with date range', async () => {
      const summary: DefectSummaryReportDto = {
        totalDefects: 0,
        defects: [],
        byAge: [],
      };
      mockService.getDefectSummary.mockResolvedValue(summary);

      const dateRange = { startDate: '2026-01-01' };
      const result = await controller.getDefectSummary('proj-1', dateRange);

      expect(mockService.getDefectSummary).toHaveBeenCalledWith('proj-1', dateRange);
      expect(result).toEqual(summary);
    });
  });

  describe('getUserWorkload', () => {
    it('delegates to service with date range', async () => {
      const workload: UserWorkloadReportDto = {
        users: [{
          userId: 'u1',
          userName: 'Alice',
          totalAssigned: 10,
          passed: 7,
          failed: 2,
          blocked: 1,
          retest: 0,
          untested: 0,
          completionPercent: 100,
        }],
      };
      mockService.getUserWorkload.mockResolvedValue(workload);

      const dateRange = {};
      const result = await controller.getUserWorkload('proj-1', dateRange);

      expect(mockService.getUserWorkload).toHaveBeenCalledWith('proj-1', dateRange);
      expect(result).toEqual(workload);
    });
  });

  describe('getSummary', () => {
    it('delegates to service and returns dashboard summary', async () => {
      const summary: DashboardSummaryDto = {
        totalProjects: 3,
        activeRuns: 1,
        overallPassRate: 75,
        recentActivityCount: 42,
        recentResults: [],
      };
      mockService.getSummary.mockResolvedValue(summary);

      const result = await controller.getSummary();

      expect(mockService.getSummary).toHaveBeenCalled();
      expect(result).toEqual(summary);
    });
  });
});
