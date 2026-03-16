import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TestPlansPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1' }),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/projects/proj-1/plans',
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}));

vi.mock('@/lib/api/test-plans', () => ({
  testPlansApi: {
    listByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
  },
}));

import { testPlansApi } from '@/lib/api/test-plans';

const mockList = testPlansApi.listByProject as ReturnType<typeof vi.fn>;
const mockCreate = testPlansApi.create as ReturnType<typeof vi.fn>;

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

describe('TestPlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders test plans heading', async () => {
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(TestPlansPage));

    expect(screen.getByRole('heading', { name: /test plans/i })).toBeInTheDocument();
  });

  it('displays plans from the API', async () => {
    mockList.mockResolvedValue([
      {
        id: 'plan-1',
        name: 'Sprint 1 Plan',
        description: 'First sprint',
        projectId: 'proj-1',
        status: 'DRAFT',
        deletedAt: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        _count: { testRuns: 3 },
      },
    ]);

    renderWithProviders(React.createElement(TestPlansPage));

    await waitFor(() => {
      expect(screen.getByText('Sprint 1 Plan')).toBeInTheDocument();
      expect(screen.getByText('First sprint')).toBeInTheDocument();
      expect(screen.getByText('3 runs')).toBeInTheDocument();
    });
  });

  it('shows empty state when no plans exist', async () => {
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(TestPlansPage));

    await waitFor(() => {
      expect(screen.getByText(/no test plans/i)).toBeInTheDocument();
    });
  });

  it('opens create dialog when clicking New Plan button', async () => {
    mockList.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithProviders(React.createElement(TestPlansPage));

    const newButton = await screen.findByRole('button', { name: /new plan/i });
    await user.click(newButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument();
    });
  });

  it('submits create form and calls API', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({
      id: 'plan-2',
      name: 'Sprint 2',
      description: null,
      projectId: 'proj-1',
      status: 'DRAFT',
      deletedAt: null,
      createdAt: '2026-01-02',
      updatedAt: '2026-01-02',
    });
    const user = userEvent.setup();

    renderWithProviders(React.createElement(TestPlansPage));

    const newButton = await screen.findByRole('button', { name: /new plan/i });
    await user.click(newButton);

    const nameInput = screen.getByLabelText(/plan name/i);
    await user.type(nameInput, 'Sprint 2');

    const submitButton = screen.getByRole('button', { name: /^create$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({ name: 'Sprint 2' }),
      );
    });
  });
});
