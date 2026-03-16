import type {
  CoverageReportDto,
  ProgressReportDto,
  ActivityReportDto,
  DashboardSummaryDto,
} from '@app/shared';
import { apiFetch } from './client';

export const reportsApi = {
  getCoverage: (projectId: string) =>
    apiFetch<CoverageReportDto>(`/projects/${projectId}/reports/coverage`),

  getProgress: (projectId: string) =>
    apiFetch<ProgressReportDto>(`/projects/${projectId}/reports/progress`),

  getActivity: (projectId: string) =>
    apiFetch<ActivityReportDto>(`/projects/${projectId}/reports/activity`),

  getSummary: () =>
    apiFetch<DashboardSummaryDto>('/reports/summary'),
};
