import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from './useProjects';

vi.mock('../api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { projectsApi } from '../api/projects';

const mockList = projectsApi.list as ReturnType<typeof vi.fn>;
const mockCreate = projectsApi.create as ReturnType<typeof vi.fn>;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns projects', async () => {
    const projects = [
      { id: 'p1', name: 'Project 1', description: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockList.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.projects).toEqual(projects);
    });

    expect(mockList).toHaveBeenCalled();
  });

  it('exposes isLoading state', () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('provides a create mutation', async () => {
    mockList.mockResolvedValue([]);
    const newProject = { id: 'p2', name: 'New', description: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockCreate.mockResolvedValue(newProject);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.createProject.mutate({ name: 'New' });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ name: 'New' });
    });
  });
});
