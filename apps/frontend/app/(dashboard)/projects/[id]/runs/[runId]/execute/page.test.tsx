import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RunExecutionPage from './page';
import { TestRunStatus, TestResultStatus, CasePriority, CaseType } from '@app/shared';
import type { TestRunExecutionDto } from '@app/shared';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1', runId: 'run-1' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/api/test-results', () => ({
  testResultsApi: {
    getExecution: vi.fn(),
    submit: vi.fn(),
    update: vi.fn(),
    listByRun: vi.fn(),
  },
}));

vi.mock('@/lib/api/test-runs', () => ({
  testRunsApi: {
    close: vi.fn(),
    rerun: vi.fn(),
    listByPlan: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/api/defects', () => ({
  defectsApi: {
    listByTestResult: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    listByProject: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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
  sourceRunId: null,
  configLabel: null,
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
    {
      id: 'trc-2',
      testRunId: 'run-1',
      testCaseId: 'case-2',
      testCase: {
        id: 'case-2',
        title: 'Dashboard Test',
        priority: CasePriority.HIGH,
        type: CaseType.FUNCTIONAL,
        suiteId: 'suite-2',
        suite: { id: 'suite-2', name: 'Dashboard Suite' },
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      latestResult: {
        id: 'result-1',
        testRunCaseId: 'trc-2',
        testRunId: 'run-1',
        executedById: 'user-1',
        executedBy: { id: 'user-1', name: 'Tester', email: 'test@example.com' },
        status: TestResultStatus.PASSED,
        statusOverride: false,
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

  it('renders case rows with case titles', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });
    expect(screen.getByText('Dashboard Test')).toBeInTheDocument();
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

  it('shows Create Bug button on failed result rows', async () => {
    const failedExecution: TestRunExecutionDto = {
      ...fakeExecution,
      testRunCases: [
        {
          id: 'trc-3',
          testRunId: 'run-1',
          testCaseId: 'case-3',
          testCase: { id: 'case-3', title: 'Failed Case', priority: 'HIGH' as CasePriority, type: 'FUNCTIONAL' as CaseType, suiteId: 'suite-3' },
          createdAt: '2026-01-01T00:00:00.000Z',
          latestResult: {
            id: 'result-3',
            testRunCaseId: 'trc-3',
            testRunId: 'run-1',
            executedById: 'user-1',
            executedBy: { id: 'user-1', name: 'Tester', email: 'test@example.com' },
            status: TestResultStatus.FAILED,
            statusOverride: false,
            comment: 'Button did not respond',
            elapsed: 15,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      ],
      summary: { total: 1, passed: 0, failed: 1, blocked: 0, retest: 0, untested: 0 },
    };
    mockGetExecution.mockResolvedValue(failedExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Bug' })).toBeInTheDocument();
    });
  });

  it('does not show Create Bug button on passed result rows', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Suite')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Create Bug' })).not.toBeInTheDocument();
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

  it('shows Close Run button when run is not completed', async () => {
    mockGetExecution.mockResolvedValue(fakeExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close Run' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Rerun' })).not.toBeInTheDocument();
  });

  it('shows Rerun button when run is COMPLETED', async () => {
    const completedExecution: TestRunExecutionDto = {
      ...fakeExecution,
      status: TestRunStatus.COMPLETED,
    };
    mockGetExecution.mockResolvedValue(completedExecution);

    renderWithProviders(React.createElement(RunExecutionPage));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Rerun' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Close Run' })).not.toBeInTheDocument();
  });
});
