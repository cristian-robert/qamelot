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

export const testRunsApi = {
  listByPlan: (planId: string) =>
    apiFetch<TestRunListItem[]>(`/plans/${planId}/runs`),

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

  remove: (id: string) =>
    apiFetch<TestRunDto>(`/runs/${id}`, { method: 'DELETE' }),
};
