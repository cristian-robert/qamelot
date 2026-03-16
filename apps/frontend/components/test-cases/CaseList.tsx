'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CasePriority, type TestCaseDto } from '@app/shared';
import { formatLabel } from '@/lib/format';
import { formatRelativeTime } from '@/lib/date-utils';

interface CaseListProps {
  cases: TestCaseDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const PRIORITY_VARIANT: Record<CasePriority, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  [CasePriority.CRITICAL]: 'destructive',
  [CasePriority.HIGH]: 'default',
  [CasePriority.MEDIUM]: 'secondary',
  [CasePriority.LOW]: 'outline',
};

export function CaseList({ cases, selectedId, onSelect, onCreate, onDelete }: CaseListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">Test Cases ({cases.length})</h3>
        <Button size="sm" variant="ghost" onClick={onCreate}>
          + New Case
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No test cases in this suite yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;+ New Case&quot; to create your first test case.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {cases.map((tc) => (
              <div
                key={tc.id}
                data-selected={selectedId === tc.id}
                className={`flex items-center transition-colors ${
                  selectedId === tc.id ? 'bg-muted' : ''
                }`}
              >
                <button
                  type="button"
                  className="flex flex-1 cursor-pointer flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  onClick={() => onSelect(tc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSelect(tc.id);
                    }
                  }}
                >
                  <span className="text-sm font-medium leading-tight">{tc.title}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={PRIORITY_VARIANT[tc.priority] ?? 'secondary'} className="text-[10px]">
                      {formatLabel(tc.priority)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {formatLabel(tc.type)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(tc.updatedAt)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${tc.title}`}
                  className="mr-4 shrink-0 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(tc.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
