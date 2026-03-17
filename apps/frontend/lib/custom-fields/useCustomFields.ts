'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CustomFieldEntityType, CreateCustomFieldDefinitionInput, UpdateCustomFieldDefinitionInput, SetCustomFieldValuesInput } from '@app/shared';
import { customFieldsApi } from '@/lib/api/custom-fields';

export function useCustomFieldDefinitions(projectId: string, entityType?: CustomFieldEntityType) {
  return useQuery({
    queryKey: ['custom-fields', 'definitions', projectId, entityType],
    queryFn: () => customFieldsApi.listDefinitions(projectId, entityType),
    enabled: !!projectId,
  });
}

export function useCustomFieldValues(projectId: string, entityType: CustomFieldEntityType, entityId: string | null) {
  return useQuery({
    queryKey: ['custom-fields', 'values', projectId, entityType, entityId],
    queryFn: () => customFieldsApi.getValues(projectId, entityType, entityId!),
    enabled: !!projectId && !!entityId,
  });
}

export function useCreateCustomFieldDefinition(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomFieldDefinitionInput) => customFieldsApi.createDefinition(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields', 'definitions', projectId] }),
  });
}

export function useUpdateCustomFieldDefinition(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomFieldDefinitionInput }) =>
      customFieldsApi.updateDefinition(projectId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields', 'definitions', projectId] }),
  });
}

export function useDeleteCustomFieldDefinition(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customFieldsApi.deleteDefinition(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields', 'definitions', projectId] }),
  });
}

export function useSetCustomFieldValues(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { entityType: CustomFieldEntityType; entityId: string; data: SetCustomFieldValuesInput }) =>
      customFieldsApi.setValues(projectId, entityType, entityId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields', 'values'] }),
  });
}
