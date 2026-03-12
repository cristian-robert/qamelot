import type { UserDto, RegisterInput, LoginInput } from '@app/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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
