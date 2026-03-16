import type {
  ConfigGroupWithItemsDto,
  ConfigGroupDto,
  ConfigItemDto,
  CreateConfigGroupInput,
  UpdateConfigGroupInput,
  CreateConfigItemInput,
  UpdateConfigItemInput,
} from '@app/shared';
import { apiFetch } from './client';

export const configsApi = {
  listGroups: (projectId: string) =>
    apiFetch<ConfigGroupWithItemsDto[]>(`/projects/${projectId}/configs`),

  getGroup: (id: string) =>
    apiFetch<ConfigGroupWithItemsDto>(`/configs/${id}`),

  createGroup: (projectId: string, data: CreateConfigGroupInput) =>
    apiFetch<ConfigGroupWithItemsDto>(`/projects/${projectId}/configs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGroup: (id: string, data: UpdateConfigGroupInput) =>
    apiFetch<ConfigGroupWithItemsDto>(`/configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: string) =>
    apiFetch<ConfigGroupDto>(`/configs/${id}`, { method: 'DELETE' }),

  createItem: (groupId: string, data: CreateConfigItemInput) =>
    apiFetch<ConfigItemDto>(`/configs/${groupId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (id: string, data: UpdateConfigItemInput) =>
    apiFetch<ConfigItemDto>(`/config-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteItem: (id: string) =>
    apiFetch<ConfigItemDto>(`/config-items/${id}`, { method: 'DELETE' }),
};
