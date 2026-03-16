'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDefectInput, UpdateDefectInput } from '@app/shared';
import { defectsApi, type DefectFilters } from '../api/defects';

export function defectsQueryKey(projectId: string, filters?: DefectFilters) {
  return ['projects', projectId, 'defects', filters ?? {}] as const;
}

export function useDefects(projectId: string, filters?: DefectFilters) {
  const queryClient = useQueryClient();
  const queryKey = defectsQueryKey(projectId, filters);

  const { data: defects, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => defectsApi.listByProject(projectId, filters),
    enabled: !!projectId,
  });

  const createDefect = useMutation({
    mutationFn: (data: CreateDefectInput) =>
      defectsApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'defects'] });
    },
  });

  const updateDefect = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDefectInput }) =>
      defectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'defects'] });
    },
  });

  const deleteDefect = useMutation({
    mutationFn: (id: string) => defectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'defects'] });
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

export function defectsByResultQueryKey(resultId: string) {
  return ['defects', 'by-result', resultId] as const;
}

export function useDefectsByResult(resultId: string | null) {
  return useQuery({
    queryKey: defectsByResultQueryKey(resultId ?? ''),
    queryFn: () => defectsApi.listByTestResult(resultId!),
    enabled: !!resultId,
  });
}

export function useCreateDefectForResult(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDefectInput) =>
      defectsApi.create(projectId, data),
    onSuccess: (_defect, variables) => {
      if (variables.testResultId) {
        queryClient.invalidateQueries({
          queryKey: defectsByResultQueryKey(variables.testResultId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'defects'],
      });
    },
  });
}
