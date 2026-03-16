import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RunExecutionPage from './page';
import { TestRunStatus, TestResultStatus } from '@app/shared';
import type { TestRunExecutionDto } from '@app/shared';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1', runId: 'run-1' }),
}));

vi.mock('@/lib/api/test-results', () => ({
  testResultsApi: {
    getExecution: vi.fn(),
    submit: vi.fn(),
    update: vi.fn(),
    listByRun: vi.fn(),
  },
}));

vi.mock('@/lib/test-results/useRunSSE', () => ({
  useRunSSE: () => ({ status: 'connected' }),
}));

import { testResultsApi } from '@/lib/api/test-results';

const mockGetExecution = testResultsApi.getExecution as ReturnType<typeof vi.fn>;

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

const fakeExecution: TestRunExecutionDto = {
  id: 'run-1',
  name: 'Smoke Test Run',
  testPlanId: 'plan-1',
  projectId: 'proj-1',
  assignedToId: null,
  status: TestRunStatus.IN_PROGRESS,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  testPlan: { id: 'plan-1', name: 'Regression Plan' },
  assignedTo: null,
  testRunCases: [
    {
      id: 'trc-1',
      testRunId: 'run-1',
      suiteId: 'suite-1',
      suite: { id: 'suite-1', name: 'Login Suite' },
      createdAt: '2026-01-01T00:00:00.000Z',
      latestResult: null,
    },
    {
      id: 'trc-2',
      testRunId: 'run-1',
      suiteId: 'suite-2',
      suite: { id: 'suite-2', name: 'Dashboard Suite' },
      createdAt: '2026-01-01T00:00:00.000Z',
      latestResult: {
        id: 'result-1',
        testRunCaseId: 'trc-2',
        testRunId: 'run-1',
        executedById: 'user-1',
        executedBy: { id: 'user-1', name: 'Tester', email: 'test@example.com' },
        status: TestResultStatus.PASSED,
        comment: null,
        elapsed: 30,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  ],
  summary: { total: 2, passed: 1, failed: 0, blocked: 0, retest: 0, untested: 1 },
};

describe('RunExecutionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetExecution.mockReturnValue(new Promise(() => {}));

    renderWithProviders(React.createElement(RunExecutionPage));

    expect(screen.getByText('Loading execution data...')).toBeInTheDocument();
  });

  it('renders run name and plan name after loading', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Smoke Test Run' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Regression Plan/)).toBeInTheDocument();
  });

  it('shows progress summary', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText(/Progress: 1\/2/)).toBeInTheDocument();
    });
    expect(screen.getByText(/1 passed/)).toBeInTheDocument();
    expect(screen.getByText(/1 untested/)).toBeInTheDocument();
  });

  it('renders case rows with suite names', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText('Login Suite')).toBeInTheDocument();
    });
    expect(screen.getByText('Dashboard Suite')).toBeInTheDocument();
  });

  it('shows Pass/Fail/Blocked/Retest action buttons', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Pass' })).toHaveLength(2);
    });
    expect(screen.getAllByRole('button', { name: 'Fail' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Blocked' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Retest' })).toHaveLength(2);
  });

  it('shows run status badge', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    });
  });

  it('shows live indicator when SSE is connected', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    mockGetExecution.mockRejectedValue(new Error('Not found'));

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText('Failed to load run execution.')).toBeInTheDocument();
    });
  });
});
