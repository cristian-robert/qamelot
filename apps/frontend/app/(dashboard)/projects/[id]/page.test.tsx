import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import { projectsApi } from '@/lib/api/projects';
import { testSuitesApi } from '@/lib/api/test-suites';
import { testCasesApi } from '@/lib/api/test-cases';

const mockGetById = projectsApi.getById as ReturnType<typeof vi.fn>;
const mockListSuites = testSuitesApi.listByProject as ReturnType<typeof vi.fn>;
const mockListCases = testCasesApi.listBySuite as ReturnType<typeof vi.fn>;

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

const mockProject = {
  id: 'proj-1',
  name: 'Alpha Project',
  description: 'A great project',
  deletedAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const mockSuite = {
  id: 'suite-1',
  projectId: 'proj-1',
  name: 'Login Tests',
  description: null,
  parentId: null,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetById.mockReturnValue(new Promise(() => {}));
    mockListSuites.mockReturnValue(new Promise(() => {}));

    const { container } = renderWithProviders(React.createElement(ProjectDetailPage));

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders project name and description', async () => {
    mockGetById.mockResolvedValue(mockProject);
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Project' })).toBeInTheDocument();
    });
    expect(screen.getByText('A great project')).toBeInTheDocument();
  });

  it('shows not found when project does not exist', async () => {
    mockGetById.mockRejectedValue(new Error('HTTP 404'));
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Project not found')).toBeInTheDocument();
    });
  });

  it('shows suite sidebar with empty state', async () => {
    mockGetById.mockResolvedValue({ ...mockProject, description: null });
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha Project' })).toBeInTheDocument();
    });
    expect(screen.getByText(/no suites/i)).toBeInTheDocument();
  });

  it('renders suites in the sidebar', async () => {
    mockGetById.mockResolvedValue({ ...mockProject, description: null });
    mockListSuites.mockResolvedValue([mockSuite]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Login Tests')).toBeInTheDocument();
    });
  });

  it('shows create suite button', async () => {
    mockGetById.mockResolvedValue({ ...mockProject, description: null });
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new suite/i })).toBeInTheDocument();
    });
  });

  it('shows case list when a suite is selected', async () => {
    const user = userEvent.setup();
    mockGetById.mockResolvedValue(mockProject);
    mockListSuites.mockResolvedValue([mockSuite]);
    mockListCases.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Login Tests')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Login Tests'));

    await waitFor(() => {
      expect(screen.getByText(/no test cases/i)).toBeInTheDocument();
    });
  });

  it('shows project overview when no suite is selected', async () => {
    mockGetById.mockResolvedValue(mockProject);
    mockListSuites.mockResolvedValue([mockSuite]);

    renderWithProviders(React.createElement(ProjectDetailPage));

    await waitFor(() => {
      expect(screen.getByText('Select a suite from the sidebar to view its test cases.')).toBeInTheDocument();
    });
  });
});
