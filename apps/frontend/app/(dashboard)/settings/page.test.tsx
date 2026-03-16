import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from './page';
import { Role } from '@app/shared';

vi.mock('@/lib/api/users', () => ({
  usersApi: {
    updateProfile: vi.fn(),
  },
}));

vi.mock('@/lib/auth/useAuth', () => ({
  useAuth: vi.fn(),
  AUTH_QUERY_KEY: ['auth', 'me'],
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { useAuth } from '@/lib/auth/useAuth';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

const testUser = {
  id: 'user-1',
  email: 'alice@test.com',
  name: 'Alice',
  role: Role.TESTER,
  deletedAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
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

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile settings heading', () => {
    mockUseAuth.mockReturnValue({
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    });

    renderWithProviders(React.createElement(SettingsPage));

    expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
  });

  it('displays user email and name', () => {
    mockUseAuth.mockReturnValue({
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    });

    renderWithProviders(React.createElement(SettingsPage));

    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Alice');
  });

  it('has password change fields', () => {
    mockUseAuth.mockReturnValue({
      user: testUser,
      isLoading: false,
      isAuthenticated: true,
    });

    renderWithProviders(React.createElement(SettingsPage));

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it('shows loading state when user is not available', () => {
    mockUseAuth.mockReturnValue({
      user: undefined,
      isLoading: true,
      isAuthenticated: false,
    });

    renderWithProviders(React.createElement(SettingsPage));

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
