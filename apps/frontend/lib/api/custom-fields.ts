import type { CustomFieldDefinitionDto, CustomFieldValueWithDefinitionDto, CustomFieldValueDto, CustomFieldEntityType, CreateCustomFieldDefinitionInput, UpdateCustomFieldDefinitionInput, SetCustomFieldValuesInput } from '@app/shared';
import { apiFetch } from './client';

export const customFieldsApi = {
  listDefinitions: (projectId: string, entityType?: CustomFieldEntityType) => {
    const params = entityType ? `?entityType=${entityType}` : '';
    return apiFetch<CustomFieldDefinitionDto[]>(`/projects/${projectId}/custom-fields/definitions${params}`);
  },
  getDefinition: (projectId: string, definitionId: string) =>
    apiFetch<CustomFieldDefinitionDto>(`/projects/${projectId}/custom-fields/definitions/${definitionId}`),
  createDefinition: (projectId: string, data: CreateCustomFieldDefinitionInput) =>
    apiFetch<CustomFieldDefinitionDto>(`/projects/${projectId}/custom-fields/definitions`, { method: 'POST', body: JSON.stringify(data) }),
  updateDefinition: (projectId: string, definitionId: string, data: UpdateCustomFieldDefinitionInput) =>
    apiFetch<CustomFieldDefinitionDto>(`/projects/${projectId}/custom-fields/definitions/${definitionId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDefinition: (projectId: string, definitionId: string) =>
    apiFetch<CustomFieldDefinitionDto>(`/projects/${projectId}/custom-fields/definitions/${definitionId}`, { method: 'DELETE' }),
  getValues: (projectId: string, entityType: CustomFieldEntityType, entityId: string) =>
    apiFetch<CustomFieldValueWithDefinitionDto[]>(`/projects/${projectId}/custom-fields/values/${entityType}/${entityId}`),
  setValues: (projectId: string, entityType: CustomFieldEntityType, entityId: string, data: SetCustomFieldValuesInput) =>
    apiFetch<CustomFieldValueDto[]>(`/projects/${projectId}/custom-fields/values/${entityType}/${entityId}`, { method: 'POST', body: JSON.stringify(data) }),
  searchByFieldValue: (projectId: string, definitionId: string, value: string) =>
    apiFetch<string[]>(`/projects/${projectId}/custom-fields/search?definitionId=${encodeURIComponent(definitionId)}&value=${encodeURIComponent(value)}`),
};
