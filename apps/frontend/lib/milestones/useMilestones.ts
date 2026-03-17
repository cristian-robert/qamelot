'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@app/shared';
import { milestonesApi, type MilestoneFilters } from '@/lib/api/milestones';

export function useMilestones(projectId: string, filters?: MilestoneFilters) {
  return useQuery({
    queryKey: ['milestones', projectId, filters],
    queryFn: () => milestonesApi.listByProject(projectId, filters),
    enabled: !!projectId,
  });
}

export function useMilestoneTree(projectId: string) {
  return useQuery({
    queryKey: ['milestones', 'tree', projectId],
    queryFn: () => milestonesApi.treeByProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMilestoneInput) => milestonesApi.create(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestones', projectId] }),
  });
}

export function useUpdateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMilestoneInput }) =>
      milestonesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestones', projectId] }),
  });
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => milestonesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestones', projectId] }),
  });
}
