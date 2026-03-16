import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from './useProfile';

vi.mock('../api/users', () => ({
  usersApi: {
    updateProfile: vi.fn(),
  },
}));

import { usersApi } from '../api/users';

const mockUpdateProfile = usersApi.updateProfile as ReturnType<typeof vi.fn>;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides an updateProfile mutation', async () => {
    const updated = { id: 'u1', email: 'alice@test.com', name: 'New Name', role: 'TESTER', deletedAt: null };
    mockUpdateProfile.mockResolvedValue(updated);

    const { result } = renderHook(() => useProfile(), { wrapper });

    result.current.updateProfile.mutate({ name: 'New Name' });

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'New Name' });
    });
  });

  it('calls API with password data', async () => {
    mockUpdateProfile.mockResolvedValue({ id: 'u1' });

    const { result } = renderHook(() => useProfile(), { wrapper });

    result.current.updateProfile.mutate({
      currentPassword: 'old',
      newPassword: 'newpass123',
    });

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        currentPassword: 'old',
        newPassword: 'newpass123',
      });
    });
  });
});
