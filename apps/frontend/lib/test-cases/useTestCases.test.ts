import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTestCases, testCasesQueryKey } from './useTestCases';
import { testCasesApi } from '../api/test-cases';
import type { TestCaseDto } from '@app/shared';

vi.mock('../api/test-cases', () => ({
  testCasesApi: {
    listBySuite: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockList = vi.mocked(testCasesApi.listBySuite);
const mockCreate = vi.mocked(testCasesApi.create);
const mockUpdate = vi.mocked(testCasesApi.update);
const mockRemove = vi.mocked(testCasesApi.remove);

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockCase: TestCaseDto = {
  id: 'case-1',
  title: 'Verify login',
  preconditions: null,
  steps: [],
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useTestCases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns cases for a suite', async () => {
    mockList.mockResolvedValue([mockCase]);
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.cases).toEqual([mockCase]);
    });
    expect(mockList).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID);
  });

  it('returns empty array when suiteId is null', () => {
    const { result } = renderHook(() => useTestCases(PROJECT_ID, null), {
      wrapper: createWrapper(),
    });

    expect(result.current.cases).toEqual([]);
    expect(mockList).not.toHaveBeenCalled();
  });

  it('exposes query key builder', () => {
    expect(testCasesQueryKey(PROJECT_ID, SUITE_ID)).toEqual([
      'projects',
      PROJECT_ID,
      'suites',
      SUITE_ID,
      'cases',
    ]);
  });

  it('createCase calls API', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue(mockCase);
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createCase.mutate({ title: 'New case' });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID, { title: 'New case' });
    });
  });

  it('updateCase calls API with id and data', async () => {
    mockList.mockResolvedValue([mockCase]);
    mockUpdate.mockResolvedValue({ ...mockCase, title: 'Updated' });
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.cases).toHaveLength(1));

    result.current.updateCase.mutate({ id: 'case-1', data: { title: 'Updated' } });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(PROJECT_ID, 'case-1', { title: 'Updated' });
    });
  });

  it('deleteCase calls API with id', async () => {
    mockList.mockResolvedValue([mockCase]);
    mockRemove.mockResolvedValue(mockCase);
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.cases).toHaveLength(1));

    result.current.deleteCase.mutate('case-1');

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    });
  });
});
