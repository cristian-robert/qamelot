import type {
  TestCaseDto,
  TestCaseWithStepsDto,
  TestCaseStepDto,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  CreateTestCaseStepInput,
  UpdateTestCaseStepInput,
  BulkUpdateCasesInput,
  BulkMoveCasesInput,
  BulkDeleteCasesInput,
  CaseHistoryDto,
} from '@app/shared';
import { apiFetch, apiDownload, apiUpload } from './client';

export interface CsvImportResult {
  imported: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

export interface BulkOperationResult {
  updated?: number;
  moved?: number;
  deleted?: number;
}

export const testCasesApi = {
  listBySuite: async (projectId: string, suiteId: string, filters?: { automationStatus?: string }) => {
    const params = new URLSearchParams();
    if (filters?.automationStatus) params.set('automationStatus', filters.automationStatus);
    const qs = params.toString();
    const res = await apiFetch<{ data: TestCaseDto[] }>(`/projects/${projectId}/suites/${suiteId}/cases${qs ? `?${qs}` : ''}`);
    return res.data;
  },
  getById: (projectId: string, id: string) =>
    apiFetch<TestCaseWithStepsDto>(`/projects/${projectId}/cases/${id}`),
  create: (projectId: string, suiteId: string, data: CreateTestCaseInput) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/suites/${suiteId}/cases`, { method: 'POST', body: JSON.stringify(data) }),
  update: (projectId: string, id: string, data: UpdateTestCaseInput) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (projectId: string, id: string) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`, { method: 'DELETE' }),
  copy: (projectId: string, id: string, targetSuiteId: string) =>
    apiFetch<TestCaseWithStepsDto>(`/projects/${projectId}/cases/${id}/copy`, { method: 'POST', body: JSON.stringify({ targetSuiteId }) }),
  move: (projectId: string, id: string, targetSuiteId: string) =>
    apiFetch<TestCaseWithStepsDto>(`/projects/${projectId}/cases/${id}/move`, { method: 'POST', body: JSON.stringify({ targetSuiteId }) }),
  bulkUpdate: (projectId: string, data: BulkUpdateCasesInput) =>
    apiFetch<BulkOperationResult>(`/projects/${projectId}/cases/bulk`, { method: 'PATCH', body: JSON.stringify(data) }),
  bulkMove: (projectId: string, data: BulkMoveCasesInput) =>
    apiFetch<BulkOperationResult>(`/projects/${projectId}/cases/bulk-move`, { method: 'POST', body: JSON.stringify(data) }),
  bulkDelete: (projectId: string, data: BulkDeleteCasesInput) =>
    apiFetch<BulkOperationResult>(`/projects/${projectId}/cases/bulk`, { method: 'DELETE', body: JSON.stringify(data) }),
  exportCsv: (projectId: string) =>
    apiDownload(`/projects/${projectId}/cases/export?format=csv`, `test-cases-${projectId}.csv`),
  importCsv: (projectId: string, file: File) =>
    apiUpload<CsvImportResult>(`/projects/${projectId}/cases/import`, file),
  getHistory: (projectId: string, caseId: string) =>
    apiFetch<CaseHistoryDto[]>(`/projects/${projectId}/cases/${caseId}/history`),

  // ── Steps ──
  listSteps: (projectId: string, caseId: string) =>
    apiFetch<TestCaseStepDto[]>(`/projects/${projectId}/cases/${caseId}/steps`),
  createStep: (projectId: string, caseId: string, data: CreateTestCaseStepInput) =>
    apiFetch<TestCaseStepDto>(`/projects/${projectId}/cases/${caseId}/steps`, { method: 'POST', body: JSON.stringify(data) }),
  updateStep: (projectId: string, caseId: string, stepId: string, data: UpdateTestCaseStepInput) =>
    apiFetch<TestCaseStepDto>(`/projects/${projectId}/cases/${caseId}/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStep: (projectId: string, caseId: string, stepId: string) =>
    apiFetch<{ deleted: boolean }>(`/projects/${projectId}/cases/${caseId}/steps/${stepId}`, { method: 'DELETE' }),
  reorderSteps: (projectId: string, caseId: string, stepIds: string[]) =>
    apiFetch<{ ok: boolean }>(`/projects/${projectId}/cases/${caseId}/steps/reorder`, { method: 'POST', body: JSON.stringify({ stepIds }) }),
};
