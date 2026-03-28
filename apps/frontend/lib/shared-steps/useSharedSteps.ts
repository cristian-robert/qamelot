'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSharedStepInput, UpdateSharedStepInput } from '@app/shared';
import { sharedStepsApi } from '@/lib/api/shared-steps';

export function useSharedSteps(projectId: string, params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['shared-steps', projectId, params],
    queryFn: () => sharedStepsApi.listByProject(projectId, params),
    enabled: !!projectId,
  });
}

export function useCreateSharedStep(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSharedStepInput) => sharedStepsApi.create(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-steps', projectId] }),
  });
}

export function useUpdateSharedStep(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSharedStepInput }) =>
      sharedStepsApi.update(projectId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-steps', projectId] }),
  });
}

export function useDeleteSharedStep(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharedStepsApi.remove(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-steps', projectId] }),
  });
}
