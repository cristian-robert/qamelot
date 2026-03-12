'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';
import { testCasesApi } from '../api/test-cases';

export function testCasesQueryKey(projectId: string, suiteId: string) {
  return ['projects', projectId, 'suites', suiteId, 'cases'] as const;
}

export function useTestCases(projectId: string, suiteId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = suiteId ? testCasesQueryKey(projectId, suiteId) : [];

  const { data: cases, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testCasesApi.listBySuite(projectId, suiteId!),
    enabled: !!projectId && !!suiteId,
  });

  const createCase = useMutation({
    mutationFn: (data: CreateTestCaseInput) =>
      testCasesApi.create(projectId, suiteId!, data),
    onSuccess: () => {
      if (suiteId) queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateCase = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestCaseInput }) =>
      testCasesApi.update(projectId, id, data),
    onSuccess: () => {
      if (suiteId) queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteCase = useMutation({
    mutationFn: (id: string) => testCasesApi.remove(projectId, id),
    onSuccess: () => {
      if (suiteId) queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    cases: cases ?? [],
    isLoading,
    error,
    createCase,
    updateCase,
    deleteCase,
  };
}
