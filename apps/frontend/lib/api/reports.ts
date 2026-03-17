import type { CoverageReportDto, ProgressReportDto, ActivityReportDto, DashboardSummaryDto, ReferenceCoverageDto, ComparisonReportDto, DefectSummaryReportDto, UserWorkloadReportDto, DateRangeFilter } from '@app/shared';
import { apiFetch } from './client';

function buildDateParams(dateRange?: DateRangeFilter): string {
  const params = new URLSearchParams();
  if (dateRange?.startDate) params.set('startDate', dateRange.startDate);
  if (dateRange?.endDate) params.set('endDate', dateRange.endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const reportsApi = {
  getCoverage: (projectId: string) =>
    apiFetch<CoverageReportDto>(`/projects/${projectId}/reports/coverage`),
  getProgress: (projectId: string) =>
    apiFetch<ProgressReportDto>(`/projects/${projectId}/reports/progress`),
  getActivity: (projectId: string, dateRange?: DateRangeFilter) =>
    apiFetch<ActivityReportDto>(`/projects/${projectId}/reports/activity${buildDateParams(dateRange)}`),
  getReferenceCoverage: (projectId: string) =>
    apiFetch<ReferenceCoverageDto>(`/projects/${projectId}/reports/reference-coverage`),
  getComparison: (projectId: string, runIdA: string, runIdB: string) =>
    apiFetch<ComparisonReportDto>(`/projects/${projectId}/reports/comparison?runIdA=${encodeURIComponent(runIdA)}&runIdB=${encodeURIComponent(runIdB)}`),
  getDefectSummary: (projectId: string, dateRange?: DateRangeFilter) =>
    apiFetch<DefectSummaryReportDto>(`/projects/${projectId}/reports/defect-summary${buildDateParams(dateRange)}`),
  getUserWorkload: (projectId: string, dateRange?: DateRangeFilter) =>
    apiFetch<UserWorkloadReportDto>(`/projects/${projectId}/reports/user-workload${buildDateParams(dateRange)}`),
  getSummary: () => apiFetch<DashboardSummaryDto>('/reports/summary'),
};
