'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestPlanInput, UpdateTestPlanInput } from '@app/shared';
import { testPlansApi, type TestPlanFilters } from '../api/test-plans';

export function testPlansQueryKey(projectId: string, filters?: TestPlanFilters) {
  return ['projects', projectId, 'plans', filters ?? {}] as const;
}

export function useTestPlans(projectId: string, filters?: TestPlanFilters) {
  const queryClient = useQueryClient();
  const queryKey = testPlansQueryKey(projectId, filters);

  const { data: plans, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testPlansApi.listByProject(projectId, filters),
    enabled: !!projectId,
  });

  const createPlan = useMutation({
    mutationFn: (data: CreateTestPlanInput) => testPlansApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'plans'] });
    },
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestPlanInput }) =>
      testPlansApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'plans'] });
    },
  });

  const deletePlan = useMutation({
    mutationFn: (id: string) => testPlansApi.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'plans'] });
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
