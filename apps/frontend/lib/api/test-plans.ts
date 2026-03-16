import type {
  TestPlanDto,
  TestPlanWithRunCountDto,
  CreateTestPlanInput,
  UpdateTestPlanInput,
} from '@app/shared';
import { apiFetch } from './client';

export const testPlansApi = {
  listByProject: (projectId: string) =>
    apiFetch<TestPlanWithRunCountDto[]>(`/projects/${projectId}/plans`),

  getById: (projectId: string, id: string) =>
    apiFetch<TestPlanWithRunCountDto>(`/projects/${projectId}/plans/${id}`),

  create: (projectId: string, data: CreateTestPlanInput) =>
    apiFetch<TestPlanDto>(`/projects/${projectId}/plans`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateTestPlanInput) =>
    apiFetch<TestPlanDto>(`/projects/${projectId}/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (projectId: string, id: string) =>
    apiFetch<TestPlanDto>(`/projects/${projectId}/plans/${id}`, {
      method: 'DELETE',
    }),
};
