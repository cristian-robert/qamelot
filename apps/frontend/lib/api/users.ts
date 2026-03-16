import type { UserDto, InviteUserInput, UpdateRoleInput, UpdateProfileInput } from '@app/shared';
import { apiFetch } from './client';

export const usersApi = {
  list: () => apiFetch<UserDto[]>('/users'),

  getById: (id: string) => apiFetch<UserDto>(`/users/${id}`),

  updateRole: (id: string, data: UpdateRoleInput) =>
    apiFetch<UserDto>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<UserDto>(`/users/${id}`, { method: 'DELETE' }),

  invite: (data: InviteUserInput) =>
    apiFetch<UserDto & { temporaryPassword: string }>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (data: UpdateProfileInput) =>
    apiFetch<UserDto>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
