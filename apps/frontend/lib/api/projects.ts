import type { ProjectDto, CreateProjectInput, UpdateProjectInput, PaginatedResponse } from '@app/shared';
import { apiFetch } from './client';

export const projectsApi = {
  list: (params?: { page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    return apiFetch<PaginatedResponse<ProjectDto>>(`/projects${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => apiFetch<ProjectDto>(`/projects/${id}`),
  create: (data: CreateProjectInput) =>
    apiFetch<ProjectDto>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateProjectInput) =>
    apiFetch<ProjectDto>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<ProjectDto>(`/projects/${id}`, { method: 'DELETE' }),
};
