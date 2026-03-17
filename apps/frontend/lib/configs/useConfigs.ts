'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateConfigGroupInput, UpdateConfigGroupInput, CreateConfigItemInput, UpdateConfigItemInput } from '@app/shared';
import { configsApi } from '@/lib/api/configs';

export function useConfigGroups(projectId: string) {
  return useQuery({
    queryKey: ['configs', projectId],
    queryFn: () => configsApi.listGroups(projectId),
    enabled: !!projectId,
  });
}

export function useCreateConfigGroup(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConfigGroupInput) => configsApi.createGroup(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs', projectId] }),
  });
}

export function useUpdateConfigGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigGroupInput }) => configsApi.updateGroup(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs'] }),
  });
}

export function useDeleteConfigGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configsApi.deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs'] }),
  });
}

export function useCreateConfigItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateConfigItemInput }) => configsApi.createItem(groupId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs'] }),
  });
}

export function useUpdateConfigItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigItemInput }) => configsApi.updateItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs'] }),
  });
}

export function useDeleteConfigItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configsApi.deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs'] }),
  });
}
