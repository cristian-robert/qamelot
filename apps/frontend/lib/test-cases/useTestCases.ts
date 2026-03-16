'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTestCaseInput,
  UpdateTestCaseInput,
  BulkUpdateCasesInput,
  BulkMoveCasesInput,
  BulkDeleteCasesInput,
} from '@app/shared';
import { testCasesApi } from '../api/test-cases';

export function testCasesQueryKey(projectId: string, suiteId: string) {
  return ['projects', projectId, 'suites', suiteId, 'cases'] as const;
}

export function useTestCases(projectId: string, suiteId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = suiteId ? testCasesQueryKey(projectId, suiteId) : [];

  const invalidate = () => {
    if (suiteId) queryClient.invalidateQueries({ queryKey });
  };

  const { data: cases, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testCasesApi.listBySuite(projectId, suiteId!),
    enabled: !!projectId && !!suiteId,
  });

  const createCase = useMutation({
    mutationFn: (data: CreateTestCaseInput) =>
      testCasesApi.create(projectId, suiteId!, data),
    onSuccess: invalidate,
  });

  const updateCase = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestCaseInput }) =>
      testCasesApi.update(projectId, id, data),
    onSuccess: invalidate,
  });

  const deleteCase = useMutation({
    mutationFn: (id: string) => testCasesApi.remove(projectId, id),
    onSuccess: invalidate,
  });

  const bulkUpdateCases = useMutation({
    mutationFn: (data: BulkUpdateCasesInput) =>
      testCasesApi.bulkUpdate(projectId, data),
    onSuccess: invalidate,
  });

  const bulkMoveCases = useMutation({
    mutationFn: (data: BulkMoveCasesInput) =>
      testCasesApi.bulkMove(projectId, data),
    onSuccess: () => {
      // Invalidate all suite queries since cases moved between suites
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'suites'],
      });
    },
  });

  const bulkDeleteCases = useMutation({
    mutationFn: (data: BulkDeleteCasesInput) =>
      testCasesApi.bulkDelete(projectId, data),
    onSuccess: invalidate,
  });

  return {
    cases: cases ?? [],
    isLoading,
    error,
    createCase,
    updateCase,
    deleteCase,
    bulkUpdateCases,
    bulkMoveCases,
    bulkDeleteCases,
  };
}
