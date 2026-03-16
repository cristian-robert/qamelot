'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RunProgressEvent, TestRunExecutionDto } from '@app/shared';
import { executionQueryKey } from './useTestExecution';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * Subscribes to the SSE stream for a test run and updates
 * the React Query cache in real time.
 *
 * Falls back to polling when SSE disconnects.
 */
export function useRunSSE(runId: string) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [status, setStatus] = useState<SSEConnectionStatus>('connecting');

  const applyEvent = useCallback(
    (event: RunProgressEvent) => {
      const queryKey = executionQueryKey(runId);

      queryClient.setQueryData<TestRunExecutionDto>(queryKey, (prev) => {
        if (!prev) return prev;

        const updatedCases = prev.testRunCases.map((trc) => {
          if (trc.id === event.updatedCase.testRunCaseId) {
            return { ...trc, latestResult: event.updatedCase.latestResult };
          }
          return trc;
        });

        return {
          ...prev,
          status: event.runStatus,
          summary: event.summary,
          testRunCases: updatedCases,
        };
      });
    },
    [queryClient, runId],
  );

  useEffect(() => {
    const url = `${API_BASE}/runs/${runId}/stream`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('connected');
    };

    es.onmessage = (messageEvent: MessageEvent<string>) => {
      const raw = messageEvent.data;
      if (raw === '"heartbeat"') return;

      try {
        const parsed = JSON.parse(raw) as RunProgressEvent;
        applyEvent(parsed);
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      setStatus('disconnected');
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setStatus('disconnected');
    };
  }, [runId, applyEvent]);

  return { status };
}
