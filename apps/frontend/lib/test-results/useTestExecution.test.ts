import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useTestExecution } from './useTestExecution';
import { TestResultStatus, TestRunStatus, CasePriority, CaseType } from '@app/shared';
import type { TestRunExecutionDto } from '@app/shared';

const mockGetExecution = vi.fn();
const mockSubmit = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../api/test-results', () => ({
  testResultsApi: {
    getExecution: (runId: string) => mockGetExecution(runId),
    submit: (runId: string, data: unknown) => mockSubmit(runId, data),
    update: (resultId: string, data: unknown) => mockUpdate(resultId, data),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

const fakeExecution: TestRunExecutionDto = {
  id: 'run-1',
  name: 'Smoke Test',
  testPlanId: 'plan-1',
  projectId: 'proj-1',
  assignedToId: null,
  sourceRunId: null,
  configLabel: null,
  status: TestRunStatus.PENDING,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  testPlan: { id: 'plan-1', name: 'Plan 1' },
  assignedTo: null,
  testRunCases: [
    {
      id: 'trc-1',
      testRunId: 'run-1',
      testCaseId: 'case-1',
      testCase: {
        id: 'case-1',
        title: 'Login Test',
        priority: CasePriority.MEDIUM,
        type: CaseType.FUNCTIONAL,
        suiteId: 'suite-1',
        suite: { id: 'suite-1', name: 'Login Suite' },
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      latestResult: null,
    },
  ],
  summary: { total: 1, passed: 0, failed: 0, blocked: 0, retest: 0, untested: 1 },
};

describe('useTestExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isLoading: true initially', () => {
    mockGetExecution.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTestExecution('run-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns execution data after successful fetch', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);
    const { result } = renderHook(() => useTestExecution('run-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.execution).toEqual(fakeExecution);
    expect(result.current.execution?.summary.total).toBe(1);
  });

  it('returns error when fetch fails', async () => {
    mockGetExecution.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useTestExecution('run-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.execution).toBeUndefined();
  });

  it('provides submitResult mutation', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);
    mockSubmit.mockResolvedValue({
      id: 'result-1',
      status: TestResultStatus.PASSED,
    });

    const { result } = renderHook(() => useTestExecution('run-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.submitResult).toBeDefined();
    expect(typeof result.current.submitResult.mutate).toBe('function');
  });

  it('provides updateResult mutation', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    const { result } = renderHook(() => useTestExecution('run-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.updateResult).toBeDefined();
    expect(typeof result.current.updateResult.mutate).toBe('function');
  });
});
