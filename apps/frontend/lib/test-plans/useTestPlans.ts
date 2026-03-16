'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestPlanInput, UpdateTestPlanInput } from '@app/shared';
import { testPlansApi } from '../api/test-plans';

export function testPlansQueryKey(projectId: string) {
  return ['projects', projectId, 'plans'] as const;
}

export function useTestPlans(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = testPlansQueryKey(projectId);

  const { data: plans, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testPlansApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const createPlan = useMutation({
    mutationFn: (data: CreateTestPlanInput) => testPlansApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestPlanInput }) =>
      testPlansApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletePlan = useMutation({
    mutationFn: (id: string) => testPlansApi.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    plans: plans ?? [],
    isLoading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
