import type {
  TestResultDto,
  TestRunExecutionDto,
  SubmitTestResultInput,
  UpdateTestResultInput,
  BulkSubmitTestResultsInput,
} from '@app/shared';
import { apiFetch, apiDownload } from './client';

export interface BulkSubmitResult {
  submitted: number;
}

export const testResultsApi = {
  listByRun: (runId: string) =>
    apiFetch<TestResultDto[]>(`/runs/${runId}/results`),

  getExecution: (runId: string) =>
    apiFetch<TestRunExecutionDto>(`/runs/${runId}/execution`),

  submit: (runId: string, data: SubmitTestResultInput) =>
    apiFetch<TestResultDto>(`/runs/${runId}/results`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkSubmit: (runId: string, data: BulkSubmitTestResultsInput) =>
    apiFetch<BulkSubmitResult>(`/runs/${runId}/results/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (resultId: string, data: UpdateTestResultInput) =>
    apiFetch<TestResultDto>(`/results/${resultId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  exportCsv: (runId: string) =>
    apiDownload(
      `/runs/${runId}/results/export?format=csv`,
      `run-results-${runId}.csv`,
    ),
};
