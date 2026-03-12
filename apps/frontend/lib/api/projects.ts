import type { ProjectDto, CreateProjectInput, UpdateProjectInput } from '@app/shared';

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

export const projectsApi = {
  list: () => apiFetch<ProjectDto[]>('/projects'),

  getById: (id: string) => apiFetch<ProjectDto>(`/projects/${id}`),

  create: (data: CreateProjectInput) =>
    apiFetch<ProjectDto>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProjectInput) =>
    apiFetch<ProjectDto>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<ProjectDto>(`/projects/${id}`, { method: 'DELETE' }),
};
