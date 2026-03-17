import type { ApiKeyDto, ApiKeyCreatedDto } from '@app/shared';
import { apiFetch } from './client';

export const apiKeysApi = {
  list: (projectId: string) =>
    apiFetch<ApiKeyDto[]>(`/projects/${projectId}/api-keys`),

  create: (
    projectId: string,
    data: { name: string; expiresAt?: string },
  ) =>
    apiFetch<ApiKeyCreatedDto>(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ ...data, projectId }),
    }),

  revoke: (projectId: string, keyId: string) =>
    apiFetch<ApiKeyDto>(`/projects/${projectId}/api-keys/${keyId}`, {
      method: 'DELETE',
    }),
};
