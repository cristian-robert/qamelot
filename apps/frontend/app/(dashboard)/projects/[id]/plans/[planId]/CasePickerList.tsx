'use client';

import { Folder } from 'lucide-react';
import type { TestCaseDto } from '@app/shared';
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

interface CasePickerListProps {
  projectId: string;
  suiteId: string | null;
  selectedCaseIds: Set<string>;
  onToggleCase: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}

/** Case picker list that loads cases for a given suite */
export function CasePickerList({
  projectId,
  suiteId,
  selectedCaseIds,
  onToggleCase,
  onToggleAll,
}: CasePickerListProps) {
  const { data: cases, isLoading } = useTestCases(projectId, suiteId);

  if (!suiteId) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed py-6 text-sm text-muted-foreground">
        <Folder className="mr-2 size-4" />
        Select a suite above to browse cases
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-1 rounded-md border p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  }

  if (!cases?.length) {
    return (
      <div className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
        No cases in this suite.
      </div>
    );
  }

  const allIds = cases.map((c: TestCaseDto) => c.id);
  const allSelected = allIds.every((id: string) => selectedCaseIds.has(id));

  return (
    <div className="max-h-48 overflow-y-auto rounded-md border">
      <button
        type="button"
        className="flex w-full items-center gap-2 border-b bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50"
        onClick={() => onToggleAll(allIds)}
      >
        <Checkbox checked={allSelected} />
        Select all ({cases.length})
      </button>
      {cases.map((c: TestCaseDto) => (
        <button
          key={c.id}
          type="button"
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/40"
          onClick={() => onToggleCase(c.id)}
        >
          <Checkbox
            checked={selectedCaseIds.has(c.id)}
          />
          <span className="truncate">{c.title}</span>
        </button>
      ))}
    </div>
  );
}
