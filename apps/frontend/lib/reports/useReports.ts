'use client';

import { useQuery } from '@tanstack/react-query';
import type { DateRangeFilter } from '@app/shared';
import { reportsApi } from '@/lib/api/reports';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: reportsApi.getSummary,
  });
}

export function useCoverageReport(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'coverage', projectId],
    queryFn: () => reportsApi.getCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useProgressReport(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'progress', projectId],
    queryFn: () => reportsApi.getProgress(projectId),
    enabled: !!projectId,
  });
}

export function useActivityReport(projectId: string, dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: ['reports', 'activity', projectId, dateRange],
    queryFn: () => reportsApi.getActivity(projectId, dateRange),
    enabled: !!projectId,
  });
}

export function useReferenceCoverage(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'reference-coverage', projectId],
    queryFn: () => reportsApi.getReferenceCoverage(projectId),
    enabled: !!projectId,
  });
}

export function useComparisonReport(projectId: string, runIdA: string | null, runIdB: string | null) {
  return useQuery({
    queryKey: ['reports', 'comparison', projectId, runIdA, runIdB],
    queryFn: () => reportsApi.getComparison(projectId, runIdA!, runIdB!),
    enabled: !!projectId && !!runIdA && !!runIdB,
  });
}

export function useDefectSummaryReport(projectId: string, dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: ['reports', 'defect-summary', projectId, dateRange],
    queryFn: () => reportsApi.getDefectSummary(projectId, dateRange),
    enabled: !!projectId,
  });
}

export function useUserWorkloadReport(projectId: string, dateRange?: DateRangeFilter) {
  return useQuery({
    queryKey: ['reports', 'user-workload', projectId, dateRange],
    queryFn: () => reportsApi.getUserWorkload(projectId, dateRange),
    enabled: !!projectId,
  });
}
