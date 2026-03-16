import type {
  TestResultDto,
  TestRunExecutionDto,
  SubmitTestResultInput,
  UpdateTestResultInput,
} from '@app/shared';
import { apiFetch } from './client';

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

  update: (resultId: string, data: UpdateTestResultInput) =>
    apiFetch<TestResultDto>(`/results/${resultId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
