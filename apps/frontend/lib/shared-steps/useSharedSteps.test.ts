import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSharedSteps, sharedStepsQueryKey } from './useSharedSteps';
import { sharedStepsApi } from '../api/shared-steps';
import type { SharedStepWithItemsDto } from '@app/shared';

vi.mock('../api/shared-steps', () => ({
  sharedStepsApi: {
    listByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockList = vi.mocked(sharedStepsApi.listByProject);
const mockCreate = vi.mocked(sharedStepsApi.create);
const mockUpdate = vi.mocked(sharedStepsApi.update);
const mockRemove = vi.mocked(sharedStepsApi.remove);

const PROJECT_ID = 'proj-1';

const mockSharedStep: SharedStepWithItemsDto = {
  id: 'ss-1',
  title: 'Login flow',
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  items: [
    {
      id: 'ssi-1',
      sharedStepId: 'ss-1',
      stepNumber: 1,
      description: 'Navigate to login',
      expectedResult: 'Login page shown',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useSharedSteps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns shared steps for a project', async () => {
    mockList.mockResolvedValue([mockSharedStep]);
    const { result } = renderHook(() => useSharedSteps(PROJECT_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.sharedSteps).toEqual([mockSharedStep]);
    });
    expect(mockList).toHaveBeenCalledWith(PROJECT_ID);
  });

  it('returns empty array initially', () => {
    mockList.mockResolvedValue([]);
    const { result } = renderHook(() => useSharedSteps(PROJECT_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.sharedSteps).toEqual([]);
  });

  it('exposes query key builder', () => {
    expect(sharedStepsQueryKey(PROJECT_ID)).toEqual([
      'projects',
      PROJECT_ID,
      'shared-steps',
    ]);
  });

  it('createSharedStep calls API', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue(mockSharedStep);
    const { result } = renderHook(() => useSharedSteps(PROJECT_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const input = {
      title: 'Login flow',
      items: [{ description: 'Navigate to login', expectedResult: 'Login page shown' }],
    };
    result.current.createSharedStep.mutate(input);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(PROJECT_ID, input);
    });
  });

  it('updateSharedStep calls API with id and data', async () => {
    mockList.mockResolvedValue([mockSharedStep]);
    const updated = { ...mockSharedStep, title: 'Updated flow' };
    mockUpdate.mockResolvedValue(updated);
    const { result } = renderHook(() => useSharedSteps(PROJECT_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.sharedSteps).toHaveLength(1));

    result.current.updateSharedStep.mutate({
      id: 'ss-1',
      data: { title: 'Updated flow' },
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(PROJECT_ID, 'ss-1', { title: 'Updated flow' });
    });
  });

  it('deleteSharedStep calls API with id', async () => {
    mockList.mockResolvedValue([mockSharedStep]);
    mockRemove.mockResolvedValue(mockSharedStep);
    const { result } = renderHook(() => useSharedSteps(PROJECT_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.sharedSteps).toHaveLength(1));

    result.current.deleteSharedStep.mutate('ss-1');

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(PROJECT_ID, 'ss-1');
    });
  });
});
