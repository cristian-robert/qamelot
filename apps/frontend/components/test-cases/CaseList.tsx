'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        'h-4 w-4 shrink-0 cursor-pointer rounded border border-primary shadow-sm accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
      )}
      checked={checked}
      onChange={onChange}
      {...props}
    />
  );
}

/** Color-coded priority badge styling */
const PRIORITY_COLORS: Record<CasePriority, string> = {
  [CasePriority.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
  [CasePriority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [CasePriority.MEDIUM]: 'bg-blue-100 text-blue-800 border-blue-200',
  [CasePriority.LOW]: 'bg-gray-100 text-gray-600 border-gray-200',
};

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = searchQuery.trim()
    ? cases.filter((tc) =>
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : cases;

  const handleCheckboxClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelect?.(id, e.shiftKey);
    },
    [onToggleSelect],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          {selectionEnabled && cases.length > 0 && (
            <IndeterminateCheckbox
              aria-label="Select all test cases"
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onChange={() => onToggleAll?.()}
            />
          )}
          <h3 className="text-[13px] font-semibold">
            Test Cases
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary">
              {cases.length}
            </span>
          </h3>
        </div>
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={onCreate}>
          + New Case
        </Button>
      </div>

      {/* Search bar */}
      {cases.length > 0 && (
        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-[13px]"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <Search className="size-4 text-muted-foreground" />
            </div>
            <p className="text-[13px] font-medium text-muted-foreground">
              {searchQuery ? 'No matching cases found.' : 'No test cases in this suite yet.'}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-xs text-muted-foreground">
                Click &quot;+ New Case&quot; to create your first test case.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredCases.map((tc) => {
              const isSelected = selectedId === tc.id;
              const isChecked = selectedIds?.has(tc.id) ?? false;
              const stepCount = ('steps' in tc && Array.isArray(tc.steps)) ? tc.steps.length : 0;

              return (
                <div
                  key={tc.id}
                  data-selected={isSelected}
                  className={cn(
                    'group flex items-center transition-colors',
                    isSelected && 'bg-primary/5 border-l-2 border-l-primary',
                    !isSelected && 'border-l-2 border-l-transparent',
                    isChecked && !isSelected && 'bg-primary/[0.03]',
                  )}
                >
                  {selectionEnabled && (
                    <div
                      className="flex shrink-0 cursor-pointer items-center pl-3"
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
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border border-primary shadow-sm accent-primary"
                        checked={isChecked}
                        tabIndex={-1}
                        readOnly
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                    onClick={() => onSelect(tc.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSelect(tc.id);
                      }
                    }}
                  >
                    <span className="text-[13px] font-medium leading-snug">{tc.title}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn('h-[18px] px-1.5 text-[10px] font-semibold', PRIORITY_COLORS[tc.priority])}
                      >
                        {formatLabel(tc.priority)}
                      </Badge>
                      <Badge variant="outline" className="h-[18px] px-1.5 text-[10px]">
                        {formatLabel(tc.type)}
                      </Badge>
                      {stepCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          {stepCount} step{stepCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(tc.updatedAt)}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${tc.title}`}
                    className="mr-3 shrink-0 cursor-pointer rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onDelete(tc.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
