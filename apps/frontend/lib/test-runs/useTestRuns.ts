'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestRunInput, UpdateTestRunInput } from '@app/shared';
import { testRunsApi } from '../api/test-runs';

export function testRunsQueryKey(planId: string) {
  return ['plans', planId, 'runs'] as const;
}

export function useTestRuns(planId: string) {
  const queryClient = useQueryClient();
  const queryKey = testRunsQueryKey(planId);

  const { data: runs, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testRunsApi.listByPlan(planId),
    enabled: !!planId,
  });

  const createRun = useMutation({
    mutationFn: (data: CreateTestRunInput) => testRunsApi.create(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateRun = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRunInput }) =>
      testRunsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteRun = useMutation({
    mutationFn: (id: string) => testRunsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
