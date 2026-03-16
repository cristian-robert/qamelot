'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestRunInput, UpdateTestRunInput } from '@app/shared';
import { testRunsApi, type TestRunFilters } from '../api/test-runs';

export function testRunsQueryKey(planId: string, filters?: TestRunFilters) {
  return ['plans', planId, 'runs', filters ?? {}] as const;
}

export function useTestRuns(planId: string, filters?: TestRunFilters) {
  const queryClient = useQueryClient();
  const queryKey = testRunsQueryKey(planId, filters);

  const { data: runs, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testRunsApi.listByPlan(planId, filters),
    enabled: !!planId,
  });

  const createRun = useMutation({
    mutationFn: (data: CreateTestRunInput) => testRunsApi.create(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId, 'runs'] });
    },
  });

  const updateRun = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRunInput }) =>
      testRunsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId, 'runs'] });
    },
  });

  const deleteRun = useMutation({
    mutationFn: (id: string) => testRunsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', planId, 'runs'] });
    },
  });

  return {
    runs: runs ?? [],
    isLoading,
    error,
    createRun,
    updateRun,
    deleteRun,
  };
}
