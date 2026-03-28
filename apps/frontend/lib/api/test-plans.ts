import type { TestPlanDto, TestPlanWithRunCountDto, CreateTestPlanInput, UpdateTestPlanInput, PaginatedResponse } from '@app/shared';
import { apiFetch } from './client';

export interface TestPlanFilters { status?: string; page?: number; pageSize?: number; }

function buildQueryString(filters?: TestPlanFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const testPlansApi = {
  listByProject: (projectId: string, filters?: TestPlanFilters) =>
    apiFetch<PaginatedResponse<TestPlanWithRunCountDto>>(`/projects/${projectId}/plans${buildQueryString(filters)}`),
  getById: (projectId: string, id: string) =>
    apiFetch<TestPlanWithRunCountDto>(`/projects/${projectId}/plans/${id}`),
  create: (projectId: string, data: CreateTestPlanInput) =>
    apiFetch<TestPlanDto>(`/projects/${projectId}/plans`, { method: 'POST', body: JSON.stringify(data) }),
  update: (projectId: string, id: string, data: UpdateTestPlanInput) =>
    apiFetch<TestPlanDto>(`/projects/${projectId}/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (projectId: string, id: string) =>
    apiFetch<TestPlanDto>(`/projects/${projectId}/plans/${id}`, { method: 'DELETE' }),
};
