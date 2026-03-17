'use client';

import { Clock, ArrowRight } from 'lucide-react';
import { useCaseHistory } from '@/lib/test-cases/useTestCases';
import { formatRelativeTime } from '@/lib/format';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { CaseHistoryDto } from '@app/shared';

interface CaseHistoryPanelProps {
  projectId: string;
  caseId: string;
}

function HistoryEntry({ entry }: { entry: CaseHistoryDto }) {
  return (
    <div className="flex gap-3 py-2">
      <div className="flex flex-col items-center">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
          <Clock className="size-3 text-muted-foreground" />
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium">{entry.user.name}</span>
          <span className="text-xs text-muted-foreground">
            changed <span className="font-medium text-foreground">{entry.field}</span>
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {entry.oldValue && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through">
              {entry.oldValue}
            </span>
          )}
          {entry.oldValue && entry.newValue && (
            <ArrowRight className="size-3" />
          )}
          {entry.newValue && (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600">
              {entry.newValue}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(entry.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function CaseHistoryPanel({ projectId, caseId }: CaseHistoryPanelProps) {
  const { data: history, isLoading } = useCaseHistory(projectId, caseId);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Clock className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No history yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="px-4 py-2">
        {history.map((entry) => (
          <HistoryEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </ScrollArea>
  );
}
