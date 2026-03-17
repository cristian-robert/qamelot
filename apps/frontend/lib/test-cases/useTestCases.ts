'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestCaseInput, UpdateTestCaseInput, BulkUpdateCasesInput, BulkMoveCasesInput, BulkDeleteCasesInput } from '@app/shared';
import { testCasesApi } from '@/lib/api/test-cases';

export function useTestCases(projectId: string, suiteId: string | null) {
  return useQuery({
    queryKey: ['test-cases', projectId, suiteId],
    queryFn: () => testCasesApi.listBySuite(projectId, suiteId!),
    enabled: !!projectId && !!suiteId,
  });
}

export function useTestCase(projectId: string, caseId: string | null) {
  return useQuery({
    queryKey: ['test-cases', 'detail', projectId, caseId],
    queryFn: () => testCasesApi.getById(projectId, caseId!),
    enabled: !!projectId && !!caseId,
  });
}

export function useCreateTestCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ suiteId, data }: { suiteId: string; data: CreateTestCaseInput }) =>
      testCasesApi.create(projectId, suiteId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });
}

export function useUpdateTestCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestCaseInput }) =>
      testCasesApi.update(projectId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases'] }),
  });
}

export function useDeleteTestCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testCasesApi.remove(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases'] }),
  });
}

export function useBulkUpdateCases(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkUpdateCasesInput) => testCasesApi.bulkUpdate(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases'] }),
  });
}

export function useBulkMoveCases(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkMoveCasesInput) => testCasesApi.bulkMove(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases'] }),
  });
}

export function useBulkDeleteCases(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkDeleteCasesInput) => testCasesApi.bulkDelete(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases'] }),
  });
}

export function useCaseHistory(projectId: string, caseId: string | null) {
  return useQuery({
    queryKey: ['case-history', projectId, caseId],
    queryFn: () => testCasesApi.getHistory(projectId, caseId!),
    enabled: !!projectId && !!caseId,
  });
}
