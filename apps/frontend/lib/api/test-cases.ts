import type {
  TestCaseDto,
  CreateTestCaseInput,
  UpdateTestCaseInput,
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
  listBySuite: (projectId: string, suiteId: string) =>
    apiFetch<TestCaseDto[]>(`/projects/${projectId}/suites/${suiteId}/cases`),

  getById: (projectId: string, id: string) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`),

  create: (projectId: string, suiteId: string, data: CreateTestCaseInput) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/suites/${suiteId}/cases`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateTestCaseInput) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (projectId: string, id: string) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`, {
      method: 'DELETE',
    }),

  bulkUpdate: (projectId: string, data: BulkUpdateCasesInput) =>
    apiFetch<BulkOperationResult>(`/projects/${projectId}/cases/bulk`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  bulkMove: (projectId: string, data: BulkMoveCasesInput) =>
    apiFetch<BulkOperationResult>(`/projects/${projectId}/cases/bulk-move`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkDelete: (projectId: string, data: BulkDeleteCasesInput) =>
    apiFetch<BulkOperationResult>(`/projects/${projectId}/cases/bulk`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    }),

  exportCsv: (projectId: string) =>
    apiDownload(
      `/projects/${projectId}/cases/export?format=csv`,
      `test-cases-${projectId}.csv`,
    ),

  importCsv: (projectId: string, file: File) =>
    apiUpload<CsvImportResult>(
      `/projects/${projectId}/cases/import`,
      file,
    ),

  getHistory: (projectId: string, caseId: string) =>
    apiFetch<CaseHistoryDto[]>(`/projects/${projectId}/cases/${caseId}/history`),
};
