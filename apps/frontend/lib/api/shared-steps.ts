import type { SharedStepWithItemsDto, CreateSharedStepInput, UpdateSharedStepInput, PaginatedResponse } from '@app/shared';
import { apiFetch } from './client';

export const sharedStepsApi = {
  listByProject: (projectId: string, params?: { page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    return apiFetch<PaginatedResponse<SharedStepWithItemsDto>>(`/projects/${projectId}/shared-steps${query ? `?${query}` : ''}`);
  },
  getById: (projectId: string, id: string) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps/${id}`),
  create: (projectId: string, data: CreateSharedStepInput) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps`, { method: 'POST', body: JSON.stringify(data) }),
  update: (projectId: string, id: string, data: UpdateSharedStepInput) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (projectId: string, id: string) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps/${id}`, { method: 'DELETE' }),
};
