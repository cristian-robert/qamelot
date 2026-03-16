import type { DefectDto, CreateDefectInput, UpdateDefectInput } from '@app/shared';
import { apiFetch } from './client';

export const defectsApi = {
  listByProject: (projectId: string) =>
    apiFetch<DefectDto[]>(`/projects/${projectId}/defects`),

  getById: (id: string) =>
    apiFetch<DefectDto>(`/defects/${id}`),

  create: (projectId: string, data: CreateDefectInput) =>
    apiFetch<DefectDto>(`/projects/${projectId}/defects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateDefectInput) =>
    apiFetch<DefectDto>(`/defects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<DefectDto>(`/defects/${id}`, { method: 'DELETE' }),
};
