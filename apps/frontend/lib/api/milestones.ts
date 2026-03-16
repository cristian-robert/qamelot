import type { MilestoneDto, CreateMilestoneInput, UpdateMilestoneInput } from '@app/shared';
import { apiFetch } from './client';

export const milestonesApi = {
  listByProject: (projectId: string) =>
    apiFetch<MilestoneDto[]>(`/projects/${projectId}/milestones`),

  getById: (id: string) =>
    apiFetch<MilestoneDto>(`/milestones/${id}`),

  create: (projectId: string, data: CreateMilestoneInput) =>
    apiFetch<MilestoneDto>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateMilestoneInput) =>
    apiFetch<MilestoneDto>(`/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<MilestoneDto>(`/milestones/${id}`, { method: 'DELETE' }),
};
