import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import type {
  CoverageReportDto,
  ProgressReportDto,
  ActivityReportDto,
  DashboardSummaryDto,
} from '@app/shared';
import { TestResultStatus } from '@app/shared';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockService = {
    getCoverage: jest.fn(),
    getProgress: jest.fn(),
    getActivity: jest.fn(),
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
    it('delegates to service and returns activity report', async () => {
      const activity: ActivityReportDto = { entries: [] };
      mockService.getActivity.mockResolvedValue(activity);

      const result = await controller.getActivity('proj-1');

      expect(mockService.getActivity).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(activity);
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
