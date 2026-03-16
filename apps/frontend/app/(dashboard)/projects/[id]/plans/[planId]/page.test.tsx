import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlanDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1', planId: 'plan-1' }),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/projects/proj-1/plans/plan-1',
}));

vi.mock('@/lib/api/test-plans', () => ({
  testPlansApi: {
    listByProject: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/api/test-runs', () => ({
  testRunsApi: {
    listByPlan: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('@/lib/api/test-suites', () => ({
  testSuitesApi: {
    listByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/api/test-cases', () => ({
  testCasesApi: {
    listBySuite: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { testPlansApi } from '@/lib/api/test-plans';
import { testRunsApi } from '@/lib/api/test-runs';
import { testSuitesApi } from '@/lib/api/test-suites';

const mockGetPlan = testPlansApi.getById as ReturnType<typeof vi.fn>;
const mockListRuns = testRunsApi.listByPlan as ReturnType<typeof vi.fn>;
const mockListSuites = testSuitesApi.listByProject as ReturnType<typeof vi.fn>;

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

describe('PlanDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetPlan.mockReturnValue(new Promise(() => {}));
    mockListRuns.mockReturnValue(new Promise(() => {}));
    mockListSuites.mockReturnValue(new Promise(() => {}));

    renderWithProviders(React.createElement(PlanDetailPage));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders plan name and description', async () => {
    mockGetPlan.mockResolvedValue({
      id: 'plan-1',
      name: 'Sprint 1 Plan',
      description: 'Testing sprint 1',
      projectId: 'proj-1',
      status: 'ACTIVE',
      deletedAt: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      _count: { testRuns: 0 },
    });
    mockListRuns.mockResolvedValue([]);
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(PlanDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sprint 1 Plan' })).toBeInTheDocument();
    });
    expect(screen.getByText('Testing sprint 1')).toBeInTheDocument();
  });

  it('shows not found when plan does not exist', async () => {
    mockGetPlan.mockRejectedValue(new Error('HTTP 404'));
    mockListRuns.mockResolvedValue([]);
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(PlanDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Test plan not found.')).toBeInTheDocument();
    });
  });

  it('shows empty runs state', async () => {
    mockGetPlan.mockResolvedValue({
      id: 'plan-1',
      name: 'Sprint 1 Plan',
      description: null,
      projectId: 'proj-1',
      status: 'DRAFT',
      deletedAt: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      _count: { testRuns: 0 },
    });
    mockListRuns.mockResolvedValue([]);
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(PlanDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sprint 1 Plan' })).toBeInTheDocument();
    });
    expect(screen.getByText(/no test runs/i)).toBeInTheDocument();
  });

  it('renders runs list with case count', async () => {
    mockGetPlan.mockResolvedValue({
      id: 'plan-1',
      name: 'Sprint 1 Plan',
      description: null,
      projectId: 'proj-1',
      status: 'ACTIVE',
      deletedAt: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      _count: { testRuns: 1 },
    });
    mockListRuns.mockResolvedValue([
      {
        id: 'run-1',
        name: 'Smoke Test',
        testPlanId: 'plan-1',
        projectId: 'proj-1',
        assignedToId: null,
        assignedTo: null,
        status: 'PENDING',
        deletedAt: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        _count: { testRunCases: 5 },
      },
    ]);
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(PlanDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Smoke Test')).toBeInTheDocument();
      expect(screen.getByText(/5 cases/)).toBeInTheDocument();
    });
  });

  it('shows create run button', async () => {
    mockGetPlan.mockResolvedValue({
      id: 'plan-1',
      name: 'Sprint 1 Plan',
      description: null,
      projectId: 'proj-1',
      status: 'DRAFT',
      deletedAt: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      _count: { testRuns: 0 },
    });
    mockListRuns.mockResolvedValue([]);
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(PlanDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new run/i })).toBeInTheDocument();
    });
  });
});
