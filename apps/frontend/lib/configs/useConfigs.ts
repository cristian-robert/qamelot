'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateConfigGroupInput,
  UpdateConfigGroupInput,
  CreateConfigItemInput,
  UpdateConfigItemInput,
} from '@app/shared';
import { configsApi } from '../api/configs';

export function configsQueryKey(projectId: string) {
  return ['projects', projectId, 'configs'] as const;
}

export function useConfigs(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = configsQueryKey(projectId);

  const { data: groups, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => configsApi.listGroups(projectId),
    enabled: !!projectId,
  });

  const createGroup = useMutation({
    mutationFn: (data: CreateConfigGroupInput) =>
      configsApi.createGroup(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigGroupInput }) =>
      configsApi.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (id: string) => configsApi.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const createItem = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateConfigItemInput }) =>
      configsApi.createItem(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigItemInput }) =>
      configsApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => configsApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    groups: groups ?? [],
    isLoading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    createItem,
    updateItem,
    deleteItem,
  };
}
