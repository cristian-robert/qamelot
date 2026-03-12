import type { UserDto, RegisterInput, LoginInput } from '@app/shared';
import { apiFetch } from './client';

export const authApi = {
  register: (data: RegisterInput) =>
    apiFetch<UserDto>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginInput) =>
    apiFetch<UserDto>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<UserDto>('/auth/me'),

  refresh: () =>
    apiFetch<{ ok: boolean }>('/auth/refresh', { method: 'POST' }),
};
