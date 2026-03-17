'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SubmitTestResultInput, UpdateTestResultInput, BulkSubmitTestResultsInput } from '@app/shared';
import { testResultsApi } from '@/lib/api/test-results';

export function useTestExecution(runId: string) {
  return useQuery({
    queryKey: ['execution', runId],
    queryFn: () => testResultsApi.getExecution(runId),
    enabled: !!runId,
  });
}

export function useSubmitResult(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitTestResultInput) => testResultsApi.submit(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution', runId] });
      queryClient.invalidateQueries({ queryKey: ['test-runs'] });
    },
  });
}

export function useBulkSubmitResults(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSubmitTestResultsInput) => testResultsApi.bulkSubmit(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution', runId] });
      queryClient.invalidateQueries({ queryKey: ['test-runs'] });
    },
  });
}

export function useUpdateResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestResultInput }) =>
      testResultsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['execution'] }),
  });
}
