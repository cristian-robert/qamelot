import type { AutomationCaseMapDto, AutomationSyncResultDto } from '@app/shared';
import { apiFetch } from './client';

export const automationApi = {
  listCases: (projectId: string) =>
    apiFetch<AutomationCaseMapDto[]>(`/automation/cases/${projectId}`),

  syncTests: (
    projectId: string,
    tests: Array<{ automationId: string; title: string; filePath: string }>,
  ) =>
    apiFetch<AutomationSyncResultDto>('/automation/sync', {
      method: 'POST',
      body: JSON.stringify({ projectId, tests }),
    }),
};
