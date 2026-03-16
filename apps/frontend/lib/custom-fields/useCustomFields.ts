'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CustomFieldEntityType,
  CreateCustomFieldDefinitionInput,
  UpdateCustomFieldDefinitionInput,
  SetCustomFieldValuesInput,
} from '@app/shared';
import { customFieldsApi } from '../api/custom-fields';

export function customFieldDefinitionsQueryKey(projectId: string) {
  return ['projects', projectId, 'custom-fields', 'definitions'] as const;
}

export function customFieldValuesQueryKey(
  projectId: string,
  entityType: CustomFieldEntityType,
  entityId: string,
) {
  return ['projects', projectId, 'custom-fields', 'values', entityType, entityId] as const;
}

/** Hook for managing custom field definitions (admin) */
export function useCustomFieldDefinitions(
  projectId: string,
  entityType?: CustomFieldEntityType,
) {
  const queryClient = useQueryClient();
  const queryKey = customFieldDefinitionsQueryKey(projectId);

  const { data: definitions, isLoading, error } = useQuery({
    queryKey: [...queryKey, entityType],
    queryFn: () => customFieldsApi.listDefinitions(projectId, entityType),
    enabled: !!projectId,
  });

  const createDefinition = useMutation({
    mutationFn: (data: CreateCustomFieldDefinitionInput) =>
      customFieldsApi.createDefinition(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateDefinition = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomFieldDefinitionInput }) =>
      customFieldsApi.updateDefinition(projectId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteDefinition = useMutation({
    mutationFn: (id: string) => customFieldsApi.deleteDefinition(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    definitions: definitions ?? [],
    isLoading,
    error,
    createDefinition,
    updateDefinition,
    deleteDefinition,
  };
}

/** Hook for getting and setting custom field values on an entity */
export function useCustomFieldValues(
  projectId: string,
  entityType: CustomFieldEntityType,
  entityId: string | null,
) {
  const queryClient = useQueryClient();
  const queryKey = entityId
    ? customFieldValuesQueryKey(projectId, entityType, entityId)
    : [];

  const { data: values, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => customFieldsApi.getValues(projectId, entityType, entityId!),
    enabled: !!projectId && !!entityId,
  });

  const setValues = useMutation({
    mutationFn: (data: SetCustomFieldValuesInput) =>
      customFieldsApi.setValues(projectId, entityType, entityId!, data),
    onSuccess: () => {
      if (entityId) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return {
    values: values ?? [],
    isLoading,
    error,
    setValues,
  };
}
