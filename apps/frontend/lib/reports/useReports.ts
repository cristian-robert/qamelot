'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';
import type { DateRangeFilter } from '@app/shared';

export const REPORTS_QUERY_KEY = ['reports'] as const;

export function useDashboardSummary() {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'summary'],
    queryFn: reportsApi.getSummary,
  });
}

export function useCoverageReport(projectId: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'coverage', projectId],
    queryFn: () => reportsApi.getCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useProgressReport(projectId: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'progress', projectId],
    queryFn: () => reportsApi.getProgress(projectId),
    enabled: !!projectId,
  });
}

export function useActivityReport(projectId: string, dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'activity', projectId, dateRange],
    queryFn: () => reportsApi.getActivity(projectId, dateRange),
    enabled: !!projectId,
  });
}

export function useReferenceCoverageReport(projectId: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'reference-coverage', projectId],
    queryFn: () => reportsApi.getReferenceCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useComparisonReport(
  projectId: string,
  runIdA: string,
  runIdB: string,
) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'comparison', projectId, runIdA, runIdB],
    queryFn: () => reportsApi.getComparison(projectId, runIdA, runIdB),
    enabled: !!projectId && !!runIdA && !!runIdB,
  });
}

export function useDefectSummaryReport(
  projectId: string,
  dateRange?: DateRangeFilter,
) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'defect-summary', projectId, dateRange],
    queryFn: () => reportsApi.getDefectSummary(projectId, dateRange),
    enabled: !!projectId,
  });
}

export function useUserWorkloadReport(
  projectId: string,
  dateRange?: DateRangeFilter,
) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'user-workload', projectId, dateRange],
    queryFn: () => reportsApi.getUserWorkload(projectId, dateRange),
    enabled: !!projectId,
  });
}
