'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';
import { testSuitesApi } from '../api/test-suites';
import { buildTree } from './tree-utils';

export function testSuitesQueryKey(projectId: string) {
  return ['projects', projectId, 'suites'] as const;
}

export function useTestSuites(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = testSuitesQueryKey(projectId);

  const { data: suites, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testSuitesApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const tree = suites ? buildTree(suites) : [];

  const createSuite = useMutation({
    mutationFn: (data: CreateTestSuiteInput) => testSuitesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSuite = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestSuiteInput }) =>
      testSuitesApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteSuite = useMutation({
    mutationFn: (id: string) => testSuitesApi.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    suites: suites ?? [],
    tree,
    isLoading,
    error,
    createSuite,
    updateSuite,
    deleteSuite,
  };
}
