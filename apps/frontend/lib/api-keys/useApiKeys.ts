'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '@/lib/api/api-keys';

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: ['api-keys', projectId],
    queryFn: () => apiKeysApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: { name: string; expiresAt?: string };
    }) => apiKeysApi.create(projectId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['api-keys', variables.projectId],
      });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      keyId,
    }: {
      projectId: string;
      keyId: string;
    }) => apiKeysApi.revoke(projectId, keyId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['api-keys', variables.projectId],
      });
    },
  });
}
