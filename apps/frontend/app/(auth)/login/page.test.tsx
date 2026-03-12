import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import LoginPage from './page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock authApi
const mockMe = vi.fn();
const mockLogin = vi.fn();

vi.mock('@/lib/api/auth', () => ({
  authApi: {
    me: () => mockMe(),
    login: (data: unknown) => mockLogin(data),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockRejectedValue(new Error('Unauthorized'));
  });

  it('renders email and password fields', () => {
    renderWithProviders(React.createElement(LoginPage));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(React.createElement(LoginPage));

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls login mutation on valid submit', async () => {
    mockLogin.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      role: 'TESTER',
    });

    const user = userEvent.setup();
    renderWithProviders(React.createElement(LoginPage));

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'mypassword123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'mypassword123',
      });
    });
  });
});
