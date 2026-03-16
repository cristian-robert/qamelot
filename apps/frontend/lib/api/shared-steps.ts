import type {
  SharedStepWithItemsDto,
  CreateSharedStepInput,
  UpdateSharedStepInput,
} from '@app/shared';
import { apiFetch } from './client';

export const sharedStepsApi = {
  listByProject: (projectId: string) =>
    apiFetch<SharedStepWithItemsDto[]>(`/projects/${projectId}/shared-steps`),

  getById: (projectId: string, id: string) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps/${id}`),

  create: (projectId: string, data: CreateSharedStepInput) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateSharedStepInput) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (projectId: string, id: string) =>
    apiFetch<SharedStepWithItemsDto>(`/projects/${projectId}/shared-steps/${id}`, {
      method: 'DELETE',
    }),
};
