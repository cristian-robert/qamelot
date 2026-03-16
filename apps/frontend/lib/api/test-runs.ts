import type {
  TestRunDto,
  TestRunDetailDto,
  CreateTestRunInput,
  UpdateTestRunInput,
} from '@app/shared';
import { apiFetch } from './client';

/** Run list item includes assignedTo relation and case count */
export interface TestRunListItem extends TestRunDto {
  assignedTo: { id: string; name: string; email: string } | null;
  _count: { testRunCases: number };
}

export interface TestRunFilters {
  status?: string;
  assigneeId?: string;
}

function buildQueryString(filters?: TestRunFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const testRunsApi = {
  listByPlan: (planId: string, filters?: TestRunFilters) =>
    apiFetch<TestRunListItem[]>(`/plans/${planId}/runs${buildQueryString(filters)}`),

  getById: (id: string) =>
    apiFetch<TestRunDetailDto>(`/runs/${id}`),

  create: (planId: string, data: CreateTestRunInput) =>
    apiFetch<TestRunDetailDto>(`/plans/${planId}/runs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTestRunInput) =>
    apiFetch<TestRunDto>(`/runs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  close: (id: string) =>
    apiFetch<TestRunDetailDto>(`/runs/${id}/close`, { method: 'PATCH' }),

  rerun: (id: string) =>
    apiFetch<TestRunDetailDto>(`/runs/${id}/rerun`, { method: 'POST' }),

  remove: (id: string) =>
    apiFetch<TestRunDto>(`/runs/${id}`, { method: 'DELETE' }),
};
