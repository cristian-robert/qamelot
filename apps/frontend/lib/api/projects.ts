import type { ProjectDto, CreateProjectInput, UpdateProjectInput } from '@app/shared';
import { apiFetch } from './client';

export const projectsApi = {
  list: () => apiFetch<ProjectDto[]>('/projects'),
  getById: (id: string) => apiFetch<ProjectDto>(`/projects/${id}`),
  create: (data: CreateProjectInput) =>
    apiFetch<ProjectDto>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateProjectInput) =>
    apiFetch<ProjectDto>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<ProjectDto>(`/projects/${id}`, { method: 'DELETE' }),
};
