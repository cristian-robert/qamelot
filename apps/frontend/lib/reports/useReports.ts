'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports';

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

export function useActivityReport(projectId: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'activity', projectId],
    queryFn: () => reportsApi.getActivity(projectId),
    enabled: !!projectId,
  });
}
