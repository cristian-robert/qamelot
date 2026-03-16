'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@app/shared';
import { milestonesApi } from '../api/milestones';

export function milestonesQueryKey(projectId: string) {
  return ['projects', projectId, 'milestones'] as const;
}

export function useMilestones(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = milestonesQueryKey(projectId);

  const { data: milestones, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => milestonesApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const createMilestone = useMutation({
    mutationFn: (data: CreateMilestoneInput) =>
      milestonesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMilestoneInput }) =>
      milestonesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: (id: string) => milestonesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
