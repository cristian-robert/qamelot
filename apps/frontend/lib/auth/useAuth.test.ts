import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useAuth } from './useAuth';
import type { UserDto } from '@app/shared';
import { Role } from '@app/shared';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock authApi
const mockMe = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();

vi.mock('../api/auth', () => ({
  authApi: {
    me: () => mockMe(),
    login: (data: unknown) => mockLogin(data),
    register: (data: unknown) => mockRegister(data),
    logout: () => mockLogout(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

const fakeUser: UserDto = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: Role.TESTER,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isLoading: true initially', () => {
    mockMe.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns user data after successful /auth/me fetch', async () => {
    mockMe.mockResolvedValue(fakeUser);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(fakeUser);
  });

  it('isAuthenticated is true when user is loaded', async () => {
    mockMe.mockResolvedValue(fakeUser);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('isAuthenticated is false when /auth/me fails', async () => {
    mockMe.mockRejectedValue(new Error('Unauthorized'));
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeUndefined();
  });
});
