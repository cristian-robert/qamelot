import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaseHistoryPanel } from './CaseHistoryPanel';

vi.mock('@/lib/api/test-cases', () => ({
  testCasesApi: {
    getHistory: vi.fn(),
  },
}));

import { testCasesApi } from '@/lib/api/test-cases';

const mockGetHistory = testCasesApi.getHistory as ReturnType<typeof vi.fn>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('CaseHistoryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while fetching', () => {
    mockGetHistory.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <CaseHistoryPanel projectId="proj-1" caseId="case-1" />,
      { wrapper: createWrapper() },
    );

    // Should show animated pulse placeholders
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows empty state when no history exists', async () => {
    mockGetHistory.mockResolvedValue([]);
    render(
      <CaseHistoryPanel projectId="proj-1" caseId="case-1" />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText(/no changes recorded/i)).toBeInTheDocument();
    });
  });

  it('renders history entries with user info and field changes', async () => {
    mockGetHistory.mockResolvedValue([
      {
        id: 'hist-1',
        caseId: 'case-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Jane Doe', email: 'jane@test.com' },
        field: 'title',
        oldValue: 'Old Title',
        newValue: 'New Title',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <CaseHistoryPanel projectId="proj-1" caseId="case-1" />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Old Title')).toBeInTheDocument();
    expect(screen.getByText('New Title')).toBeInTheDocument();
  });

  it('shows user avatar initials', async () => {
    mockGetHistory.mockResolvedValue([
      {
        id: 'hist-1',
        caseId: 'case-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'John Smith', email: 'john@test.com' },
        field: 'priority',
        oldValue: 'MEDIUM',
        newValue: 'HIGH',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <CaseHistoryPanel projectId="proj-1" caseId="case-1" />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('JS')).toBeInTheDocument();
    });
  });

  it('formats enum values with formatLabel', async () => {
    mockGetHistory.mockResolvedValue([
      {
        id: 'hist-1',
        caseId: 'case-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
        field: 'priority',
        oldValue: 'MEDIUM',
        newValue: 'HIGH',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <CaseHistoryPanel projectId="proj-1" caseId="case-1" />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('shows (empty) for null values', async () => {
    mockGetHistory.mockResolvedValue([
      {
        id: 'hist-1',
        caseId: 'case-1',
        userId: 'user-1',
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
        field: 'preconditions',
        oldValue: null,
        newValue: 'New precondition',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(
      <CaseHistoryPanel projectId="proj-1" caseId="case-1" />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('(empty)')).toBeInTheDocument();
      expect(screen.getByText('New precondition')).toBeInTheDocument();
    });
  });
});
