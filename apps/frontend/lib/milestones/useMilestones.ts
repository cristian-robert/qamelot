'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@app/shared';
import { milestonesApi, type MilestoneFilters } from '../api/milestones';

export function milestonesQueryKey(projectId: string, filters?: MilestoneFilters) {
  return ['projects', projectId, 'milestones', filters ?? {}] as const;
}

export function useMilestones(projectId: string, filters?: MilestoneFilters) {
  const queryClient = useQueryClient();
  const queryKey = milestonesQueryKey(projectId, filters);

  const { data: milestones, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => milestonesApi.listByProject(projectId, filters),
    enabled: !!projectId,
  });

  const createMilestone = useMutation({
    mutationFn: (data: CreateMilestoneInput) =>
      milestonesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMilestoneInput }) =>
      milestonesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: (id: string) => milestonesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'milestones'] });
    },
  });

  return {
    milestones: milestones ?? [],
    isLoading,
    error,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
