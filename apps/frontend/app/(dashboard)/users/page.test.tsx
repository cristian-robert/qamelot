import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UsersPage from './page';
import { Role } from '@app/shared';

vi.mock('@/lib/api/users', () => ({
  usersApi: {
    list: vi.fn(),
    invite: vi.fn(),
    updateRole: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/lib/auth/useAuth', () => ({
  useAuth: vi.fn(),
  AUTH_QUERY_KEY: ['auth', 'me'],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/useAuth';

const mockList = usersApi.list as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

const adminUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Admin',
  role: Role.ADMIN,
  deletedAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const testerUser = {
  id: 'user-1',
  email: 'tester@test.com',
  name: 'Tester',
  role: Role.TESTER,
  deletedAt: null,
  createdAt: '2026-01-02',
  updatedAt: '2026-01-02',
};

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

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows forbidden message for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: testerUser,
      isLoading: false,
      isAuthenticated: true,
    });
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(UsersPage));

    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('renders users heading for admin users', () => {
    mockUseAuth.mockReturnValue({
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
    });
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(UsersPage));

    expect(screen.getByRole('heading', { name: /users/i })).toBeInTheDocument();
  });

  it('displays users in a table', async () => {
    mockUseAuth.mockReturnValue({
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
    });
    mockList.mockResolvedValue([adminUser, testerUser]);

    renderWithProviders(React.createElement(UsersPage));

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Tester')).toBeInTheDocument();
    });
  });

  it('has an invite user button', () => {
    mockUseAuth.mockReturnValue({
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
    });
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(UsersPage));

    expect(screen.getByRole('button', { name: /invite user/i })).toBeInTheDocument();
  });
});
