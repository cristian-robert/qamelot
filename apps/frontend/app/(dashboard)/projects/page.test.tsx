import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsPage from './page';

vi.mock('@/lib/api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { projectsApi } from '@/lib/api/projects';

const mockList = projectsApi.list as ReturnType<typeof vi.fn>;
const mockCreate = projectsApi.create as ReturnType<typeof vi.fn>;

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

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list heading', async () => {
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectsPage));

    expect(screen.getByRole('heading', { name: /projects/i })).toBeInTheDocument();
  });

  it('displays projects from the API', async () => {
    mockList.mockResolvedValue([
      { id: 'p1', name: 'Alpha', description: 'First project', deletedAt: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'p2', name: 'Beta', description: null, deletedAt: null, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
    ]);

    renderWithProviders(React.createElement(ProjectsPage));

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  it('shows empty state when no projects exist', async () => {
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectsPage));

    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
  });

  it('opens create dialog when clicking New Project button', async () => {
    mockList.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithProviders(React.createElement(ProjectsPage));

    const newButton = await screen.findByRole('button', { name: /new project/i });
    await user.click(newButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    });
  });

  it('submits create form and calls API', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'p3', name: 'Gamma', description: null, deletedAt: null, createdAt: '2026-01-03', updatedAt: '2026-01-03' });
    const user = userEvent.setup();

    renderWithProviders(React.createElement(ProjectsPage));

    const newButton = await screen.findByRole('button', { name: /new project/i });
    await user.click(newButton);

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Gamma');

    const submitButton = screen.getByRole('button', { name: /create$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gamma' }));
    });
  });
});
