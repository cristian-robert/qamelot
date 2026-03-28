'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestRunInput, UpdateTestRunInput, CreateMatrixRunsInput } from '@app/shared';
import { testRunsApi, type TestRunFilters } from '@/lib/api/test-runs';

export function useTestRuns(planId: string, filters?: TestRunFilters) {
  return useQuery({
    queryKey: ['test-runs', planId, filters],
    queryFn: () => testRunsApi.listByPlan(planId, filters),
    enabled: !!planId,
    placeholderData: (prev) => prev,
  });
}

export function useTestRun(runId: string | null) {
  return useQuery({
    queryKey: ['test-runs', 'detail', runId],
    queryFn: () => testRunsApi.getById(runId!),
    enabled: !!runId,
  });
}

export function useCreateTestRun(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestRunInput) => testRunsApi.create(planId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs', planId] }),
  });
}

export function useUpdateTestRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestRunInput }) =>
      testRunsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs'] }),
  });
}

export function useCloseTestRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testRunsApi.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs'] }),
  });
}

export function useRerunTestRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testRunsApi.rerun(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs'] }),
  });
}

export function useDeleteTestRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testRunsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs'] }),
  });
}

export function useCreateMatrixRuns(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMatrixRunsInput) => testRunsApi.createMatrixRuns(planId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs', planId] }),
  });
}
