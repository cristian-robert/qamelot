import type { TestSuiteDto, CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';
import { apiFetch } from './client';

export const testSuitesApi = {
  listByProject: (projectId: string) =>
    apiFetch<TestSuiteDto[]>(`/projects/${projectId}/suites`),

  create: (projectId: string, data: CreateTestSuiteInput) =>
    apiFetch<TestSuiteDto>(`/projects/${projectId}/suites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateTestSuiteInput) =>
    apiFetch<TestSuiteDto>(`/projects/${projectId}/suites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (projectId: string, id: string) =>
    apiFetch<{ deleted: number }>(`/projects/${projectId}/suites/${id}`, {
      method: 'DELETE',
    }),
};
