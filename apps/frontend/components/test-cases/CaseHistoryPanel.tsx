'use client';

import { useQuery } from '@tanstack/react-query';
import { testCasesApi } from '@/lib/api/test-cases';
import { formatLabel } from '@/lib/format';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CaseHistoryPanelProps {
  projectId: string;
  caseId: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatFieldName(field: string): string {
  const names: Record<string, string> = {
    title: 'Title',
    preconditions: 'Preconditions',
    templateType: 'Template',
    priority: 'Priority',
    type: 'Type',
    estimate: 'Estimate',
    references: 'References',
  };
  return names[field] ?? formatLabel(field);
}

function formatFieldValue(field: string, value: string | null): string {
  if (value === null || value === '') return '(empty)';
  if (field === 'estimate') {
    const seconds = parseInt(value, 10);
    if (isNaN(seconds)) return value;
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  }
  if (['priority', 'type', 'templateType'].includes(field)) {
    return formatLabel(value);
  }
  return value;
}

export function CaseHistoryPanel({ projectId, caseId }: CaseHistoryPanelProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'cases', caseId, 'history'],
    queryFn: () => testCasesApi.getHistory(projectId, caseId),
    enabled: !!projectId && !!caseId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No changes recorded yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {history.map((entry) => (
          <div key={entry.id} className="flex gap-3">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
              title={entry.user.name}
            >
              {getInitials(entry.user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1 text-sm">
                <span className="font-medium truncate">{entry.user.name}</span>
                <span className="text-muted-foreground">changed</span>
                <span className="font-medium">{formatFieldName(entry.field)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-start gap-1">
                  <span className="text-red-500/70 shrink-0">-</span>
                  <span className="break-all">
                    {formatFieldValue(entry.field, entry.oldValue)}
                  </span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-green-500/70 shrink-0">+</span>
                  <span className="break-all">
                    {formatFieldValue(entry.field, entry.newValue)}
                  </span>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatRelativeTime(entry.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
