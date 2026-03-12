import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1' }),
}));

vi.mock('@/lib/api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { projectsApi } from '@/lib/api/projects';

const mockGetById = projectsApi.getById as ReturnType<typeof vi.fn>;

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

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetById.mockReturnValue(new Promise(() => {}));

    renderWithProviders(React.createElement(ProjectDetailPage));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders project name and description', async () => {
    mockGetById.mockResolvedValue({
      id: 'proj-1',
      name: 'Alpha Project',
      description: 'A great project',
      deletedAt: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Project' })).toBeInTheDocument();
    });
    expect(screen.getByText('A great project')).toBeInTheDocument();
  });

  it('shows not found when project does not exist', async () => {
    mockGetById.mockRejectedValue(new Error('HTTP 404'));

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Project not found.')).toBeInTheDocument();
    });
  });
});
