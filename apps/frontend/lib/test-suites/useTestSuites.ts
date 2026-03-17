'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';
import { testSuitesApi } from '@/lib/api/test-suites';

export function useTestSuites(projectId: string) {
  return useQuery({
    queryKey: ['test-suites', projectId],
    queryFn: () => testSuitesApi.listByProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTestSuite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestSuiteInput) => testSuitesApi.create(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] }),
  });
}

export function useUpdateTestSuite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestSuiteInput }) =>
      testSuitesApi.update(projectId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] }),
  });
}

export function useDeleteTestSuite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testSuitesApi.remove(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-suites', projectId] }),
  });
}
