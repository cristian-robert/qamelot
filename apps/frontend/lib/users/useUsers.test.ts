import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers } from './useUsers';

vi.mock('../api/users', () => ({
  usersApi: {
    list: vi.fn(),
    invite: vi.fn(),
    updateRole: vi.fn(),
    remove: vi.fn(),
  },
}));

import { usersApi } from '../api/users';

const mockList = usersApi.list as ReturnType<typeof vi.fn>;
const mockInvite = usersApi.invite as ReturnType<typeof vi.fn>;
const mockUpdateRole = usersApi.updateRole as ReturnType<typeof vi.fn>;
const mockRemove = usersApi.remove as ReturnType<typeof vi.fn>;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns users', async () => {
    const users = [
      { id: 'u1', email: 'alice@test.com', name: 'Alice', role: 'ADMIN', deletedAt: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];
    mockList.mockResolvedValue(users);

    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.users).toEqual(users);
    });

    expect(mockList).toHaveBeenCalled();
  });

  it('exposes isLoading state', () => {
    mockList.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUsers(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('provides an invite mutation', async () => {
    mockList.mockResolvedValue([]);
    const invited = { id: 'u2', email: 'bob@test.com', name: 'Bob', role: 'TESTER', deletedAt: null, temporaryPassword: 'temp' };
    mockInvite.mockResolvedValue(invited);

    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.inviteUser.mutate({ email: 'bob@test.com', name: 'Bob', role: 'TESTER' });

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith({ email: 'bob@test.com', name: 'Bob', role: 'TESTER' });
    });
  });

  it('provides an updateRole mutation', async () => {
    mockList.mockResolvedValue([]);
    mockUpdateRole.mockResolvedValue({ id: 'u1', role: 'LEAD' });

    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.updateRole.mutate({ id: 'u1', data: { role: 'LEAD' } });

    await waitFor(() => {
      expect(mockUpdateRole).toHaveBeenCalledWith('u1', { role: 'LEAD' });
    });
  });

  it('provides a deactivate mutation', async () => {
    mockList.mockResolvedValue([]);
    mockRemove.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.deactivateUser.mutate('u1');

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('u1');
    });
  });
});
