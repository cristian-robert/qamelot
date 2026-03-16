'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CasePriority, type TestCaseDto } from '@app/shared';
import { formatLabel } from '@/lib/format';
import { formatRelativeTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

/** Checkbox that supports indeterminate state via a ref callback */
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 shrink-0 rounded border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      )}
      checked={checked}
      onChange={onChange}
      {...props}
    />
  );
}

interface CaseListProps {
  cases: TestCaseDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
  onToggleAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
}

const PRIORITY_VARIANT: Record<CasePriority, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  [CasePriority.CRITICAL]: 'destructive',
  [CasePriority.HIGH]: 'default',
  [CasePriority.MEDIUM]: 'secondary',
  [CasePriority.LOW]: 'outline',
};

export function CaseList({
  cases,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  isAllSelected,
  isSomeSelected,
}: CaseListProps) {
  const selectionEnabled = !!onToggleSelect;

  const handleCheckboxClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelect?.(id, e.shiftKey);
    },
    [onToggleSelect],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {selectionEnabled && cases.length > 0 && (
            <IndeterminateCheckbox
              aria-label="Select all test cases"
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onChange={() => onToggleAll?.()}
            />
          )}
          <h3 className="text-sm font-semibold">Test Cases ({cases.length})</h3>
        </div>
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
                } ${selectedIds?.has(tc.id) ? 'bg-primary/5' : ''}`}
              >
                {selectionEnabled && (
                  <div
                    className="flex shrink-0 items-center pl-4"
                    onClick={(e) => handleCheckboxClick(tc.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        onToggleSelect?.(tc.id, e.shiftKey);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${tc.title}`}
                      className="h-4 w-4 shrink-0 rounded border border-primary shadow"
                      checked={selectedIds?.has(tc.id) ?? false}
                      tabIndex={-1}
                      readOnly
                    />
                  </div>
                )}
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
