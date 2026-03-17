'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestPlanInput, UpdateTestPlanInput } from '@app/shared';
import { testPlansApi, type TestPlanFilters } from '@/lib/api/test-plans';

export function useTestPlans(projectId: string, filters?: TestPlanFilters) {
  return useQuery({
    queryKey: ['test-plans', projectId, filters],
    queryFn: () => testPlansApi.listByProject(projectId, filters),
    enabled: !!projectId,
  });
}

export function useTestPlan(projectId: string, planId: string | null) {
  return useQuery({
    queryKey: ['test-plans', projectId, planId],
    queryFn: () => testPlansApi.getById(projectId, planId!),
    enabled: !!projectId && !!planId,
  });
}

export function useCreateTestPlan(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTestPlanInput) => testPlansApi.create(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-plans', projectId] }),
  });
}

export function useUpdateTestPlan(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestPlanInput }) =>
      testPlansApi.update(projectId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-plans', projectId] }),
  });
}

export function useDeleteTestPlan(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testPlansApi.remove(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-plans', projectId] }),
  });
}
