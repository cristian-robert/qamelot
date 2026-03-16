'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSharedStepInput, UpdateSharedStepInput } from '@app/shared';
import { sharedStepsApi } from '../api/shared-steps';

export function sharedStepsQueryKey(projectId: string) {
  return ['projects', projectId, 'shared-steps'] as const;
}

export function useSharedSteps(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = sharedStepsQueryKey(projectId);

  const { data: sharedSteps, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => sharedStepsApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const createSharedStep = useMutation({
    mutationFn: (data: CreateSharedStepInput) =>
      sharedStepsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSharedStep = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSharedStepInput }) =>
      sharedStepsApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteSharedStep = useMutation({
    mutationFn: (id: string) => sharedStepsApi.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    sharedSteps: sharedSteps ?? [],
    isLoading,
    error,
    createSharedStep,
    updateSharedStep,
    deleteSharedStep,
  };
}
