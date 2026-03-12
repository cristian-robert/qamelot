'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TestCaseDto } from '@app/shared';

interface CaseListProps {
  cases: TestCaseDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const PRIORITY_VARIANT: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function CaseList({ cases, selectedId, onSelect, onCreate, onDelete }: CaseListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">Test Cases</h3>
        <Button size="sm" variant="ghost" onClick={onCreate}>
          + New Case
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {cases.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No test cases in this suite yet.
          </p>
        ) : (
          <div className="divide-y">
            {cases.map((tc) => (
              <div
                key={tc.id}
                role="button"
                tabIndex={0}
                data-selected={selectedId === tc.id}
                className={`flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedId === tc.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelect(tc.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(tc.id);
                  }
                }}
              >
                <span className="text-sm font-medium">{tc.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[tc.priority] ?? 'secondary'}>
                    {formatLabel(tc.priority)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatLabel(tc.type)}</span>
                  {tc.automationFlag && (
                    <span className="text-xs text-muted-foreground">Auto</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {tc.steps.length} step{tc.steps.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${tc.title}`}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(tc.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
