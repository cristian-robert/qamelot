'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubmitTestResultInput, UpdateTestResultInput } from '@app/shared';
import { testResultsApi } from '../api/test-results';

export function executionQueryKey(runId: string) {
  return ['runs', runId, 'execution'] as const;
}

export function useTestExecution(runId: string) {
  const queryClient = useQueryClient();
  const queryKey = executionQueryKey(runId);

  const { data: execution, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testResultsApi.getExecution(runId),
    enabled: !!runId,
  });

  const submitResult = useMutation({
    mutationFn: (data: SubmitTestResultInput) =>
      testResultsApi.submit(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateResult = useMutation({
    mutationFn: ({ resultId, data }: { resultId: string; data: UpdateTestResultInput }) =>
      testResultsApi.update(resultId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    execution,
    isLoading,
    error,
    submitResult,
    updateResult,
  };
}
