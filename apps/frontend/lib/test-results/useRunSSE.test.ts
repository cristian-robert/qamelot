import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useRunSSE } from './useRunSSE';
import { TestRunStatus, TestResultStatus, CasePriority, CaseType } from '@app/shared';
import type { RunProgressEvent, TestRunExecutionDto } from '@app/shared';

/** Minimal mock for EventSource */
class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  closed = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(url: string, init?: EventSourceInit) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  /** Helper to simulate the open event */
  simulateOpen() {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  /** Helper to simulate a message event */
  simulateMessage(data: string) {
    const event = new MessageEvent('message', { data });
    this.onmessage?.(event);
  }

  /** Helper to simulate an error */
  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

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

const fakeEvent: RunProgressEvent = {
  runId: 'run-1',
  summary: { total: 2, passed: 1, failed: 0, blocked: 0, retest: 0, untested: 1 },
  updatedCase: {
    testRunCaseId: 'trc-1',
    latestResult: {
      id: 'result-1',
      testRunCaseId: 'trc-1',
      testRunId: 'run-1',
      executedById: 'user-1',
      executedBy: { id: 'user-1', name: 'Tester', email: 'test@example.com' },
      status: TestResultStatus.PASSED,
      statusOverride: false,
      comment: null,
      elapsed: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  runStatus: TestRunStatus.IN_PROGRESS,
};

describe('useRunSSE', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects to the correct SSE URL', () => {
    renderHook(() => useRunSSE('run-1'), { wrapper: createWrapper() });

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toContain('/runs/run-1/stream');
  });

  it('starts with connecting status', () => {
    const { result } = renderHook(() => useRunSSE('run-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('connecting');
  });

  it('transitions to connected on open', async () => {
    const { result } = renderHook(() => useRunSSE('run-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('connected');
    });
  });

  it('transitions to disconnected on error', async () => {
    const { result } = renderHook(() => useRunSSE('run-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      MockEventSource.instances[0].simulateOpen();
    });

    act(() => {
      MockEventSource.instances[0].simulateError();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('disconnected');
    });
    expect(MockEventSource.instances[0].closed).toBe(true);
  });

  it('ignores heartbeat messages', () => {
    const wrapper = createWrapper();
    renderHook(() => useRunSSE('run-1'), { wrapper });

    act(() => {
      MockEventSource.instances[0].simulateOpen();
      MockEventSource.instances[0].simulateMessage('"heartbeat"');
    });

    // No error thrown means heartbeat was gracefully ignored
  });

  it('updates React Query cache when receiving a progress event', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const fakeExecution: TestRunExecutionDto = {
      id: 'run-1',
      name: 'Smoke Test',
      testPlanId: 'plan-1',
      projectId: 'proj-1',
      assignedToId: null,
      sourceRunId: null,
      status: TestRunStatus.PENDING,
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      testPlan: { id: 'plan-1', name: 'Plan 1' },
      assignedTo: null,
      testRunCases: [
        {
          id: 'trc-1',
          testRunId: 'run-1',
          testCaseId: 'case-1',
          testCase: {
            id: 'case-1',
            title: 'Login Test',
            priority: CasePriority.MEDIUM,
            type: CaseType.FUNCTIONAL,
            suiteId: 'suite-1',
            suite: { id: 'suite-1', name: 'Login Suite' },
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          latestResult: null,
        },
      ],
      summary: { total: 2, passed: 0, failed: 0, blocked: 0, retest: 0, untested: 2 },
    };

    queryClient.setQueryData(['runs', 'run-1', 'execution'], fakeExecution);

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    }

    renderHook(() => useRunSSE('run-1'), { wrapper: Wrapper });

    act(() => {
      MockEventSource.instances[0].simulateOpen();
      MockEventSource.instances[0].simulateMessage(JSON.stringify(fakeEvent));
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<TestRunExecutionDto>([
        'runs', 'run-1', 'execution',
      ]);
      expect(cached?.summary.passed).toBe(1);
      expect(cached?.status).toBe(TestRunStatus.IN_PROGRESS);
      expect(cached?.testRunCases[0].latestResult?.status).toBe(TestResultStatus.PASSED);
    });
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = renderHook(() => useRunSSE('run-1'), {
      wrapper: createWrapper(),
    });

    unmount();

    expect(MockEventSource.instances[0].closed).toBe(true);
  });
});
