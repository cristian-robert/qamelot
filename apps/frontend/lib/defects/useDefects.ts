'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDefectInput, UpdateDefectInput } from '@app/shared';
import { defectsApi } from '../api/defects';

export function defectsQueryKey(projectId: string) {
  return ['projects', projectId, 'defects'] as const;
}

export function useDefects(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = defectsQueryKey(projectId);

  const { data: defects, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => defectsApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const createDefect = useMutation({
    mutationFn: (data: CreateDefectInput) =>
      defectsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateDefect = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDefectInput }) =>
      defectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteDefect = useMutation({
    mutationFn: (id: string) => defectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    defects: defects ?? [],
    isLoading,
    error,
    createDefect,
    updateDefect,
    deleteDefect,
  };
}
