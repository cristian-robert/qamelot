'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDefectInput, UpdateDefectInput } from '@app/shared';
import { defectsApi, type DefectFilters } from '@/lib/api/defects';

export function useDefects(projectId: string, filters?: DefectFilters) {
  return useQuery({
    queryKey: ['defects', projectId, filters],
    queryFn: () => defectsApi.listByProject(projectId, filters),
    enabled: !!projectId,
    placeholderData: (prev) => prev,
  });
}

export function useCreateDefect(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDefectInput) => defectsApi.create(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defects', projectId] }),
  });
}

export function useUpdateDefect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDefectInput }) =>
      defectsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defects'] }),
  });
}

export function useDeleteDefect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => defectsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defects'] }),
  });
}
