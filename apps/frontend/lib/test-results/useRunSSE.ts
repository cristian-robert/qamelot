'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RunProgressEvent } from '@app/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5002';

export function useRunSSE(runId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`${BASE}/runs/${runId}/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        JSON.parse(event.data) as RunProgressEvent;
        queryClient.invalidateQueries({ queryKey: ['execution', runId] });
        queryClient.invalidateQueries({ queryKey: ['test-runs'] });
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [runId, queryClient]);
}
