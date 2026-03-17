import type { DefectDto, DefectWithResultDto, CreateDefectInput, UpdateDefectInput } from '@app/shared';
import { apiFetch } from './client';

export interface DefectFilters { search?: string; }

function buildQueryString(filters?: DefectFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const defectsApi = {
  listByProject: (projectId: string, filters?: DefectFilters) =>
    apiFetch<DefectDto[]>(`/projects/${projectId}/defects${buildQueryString(filters)}`),
  listByTestResult: (resultId: string) =>
    apiFetch<DefectDto[]>(`/results/${resultId}/defects`),
  getById: (id: string) => apiFetch<DefectWithResultDto>(`/defects/${id}`),
  create: (projectId: string, data: CreateDefectInput) =>
    apiFetch<DefectDto>(`/projects/${projectId}/defects`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateDefectInput) =>
    apiFetch<DefectDto>(`/defects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<DefectDto>(`/defects/${id}`, { method: 'DELETE' }),
};
