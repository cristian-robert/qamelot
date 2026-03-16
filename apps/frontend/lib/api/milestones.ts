import type {
  MilestoneDto,
  MilestoneTreeNode,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from '@app/shared';
import { apiFetch } from './client';

export interface MilestoneFilters {
  status?: string;
}

function buildQueryString(filters?: MilestoneFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const milestonesApi = {
  listByProject: (projectId: string, filters?: MilestoneFilters) =>
    apiFetch<MilestoneDto[]>(`/projects/${projectId}/milestones${buildQueryString(filters)}`),

  treeByProject: (projectId: string) =>
    apiFetch<MilestoneTreeNode[]>(`/projects/${projectId}/milestones/tree`),

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
