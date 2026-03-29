'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, ListFilter, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTestCases, useCreateTestCase } from '@/lib/test-cases/useTestCases';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { TestCaseDto } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseListSkeleton } from './CaseListSkeleton';
import { priorityCompactStyles, typeCompactStyles } from '@/lib/constants';

interface CaseListPanelProps {
  projectId: string;
  suiteId: string | null;
  suiteName?: string;
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  selection: {
    selected: Set<string>;
    toggle: (id: string) => void;
    toggleAll: (ids: string[]) => void;
    isSelected: (id: string) => boolean;
    count: number;
  };
}

export function CaseListPanel({
  projectId,
  suiteId,
  suiteName,
  selectedCaseId,
  onSelectCase,
  selection,
}: CaseListPanelProps) {
  const { data: cases, isLoading } = useTestCases(projectId, suiteId);
  const createMutation = useCreateTestCase(projectId);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (!debouncedSearch) return cases;
    const q = debouncedSearch.toLowerCase();
    return cases.filter((c: TestCaseDto) => c.title.toLowerCase().includes(q));
  }, [cases, debouncedSearch]);

  const allIds = useMemo(
    () => filteredCases.map((c: TestCaseDto) => c.id),
    [filteredCases],
  );

  const handleAddCase = async () => {
    if (!suiteId) return;
    const newCase = await createMutation.mutateAsync({
      suiteId,
      data: { title: 'Untitled Test Case' },
    });
    onSelectCase(newCase.id);
  };

  if (!suiteId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <ListFilter className="mb-2 size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Select a suite to view its test cases
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden h-full">
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{suiteName ?? 'Test Cases'}</h3>
            {cases && (
              <p className="text-xs text-muted-foreground">
                {cases.length} case{cases.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddCase}
            disabled={createMutation.isPending}
          >
            <Plus className="mr-1 size-3.5" />
            Add Case
          </Button>
        </div>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <CaseListSkeleton />
        ) : filteredCases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? 'No cases match your search.' : 'No test cases yet.'}
            </p>
          </div>
        ) : (
          <div className="p-1.5">
            {filteredCases.length > 1 && (
              <button
                className="mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                onClick={() => selection.toggleAll(allIds)}
              >
                <Checkbox
                  checked={allIds.length > 0 && allIds.every((id: string) => selection.isSelected(id))}
                  onCheckedChange={() => selection.toggleAll(allIds)}
                />
                Select all ({filteredCases.length})
              </button>
            )}

            {filteredCases.map((tc: TestCaseDto) => {
              const isActive = tc.id === selectedCaseId;
              return (
                <div
                  key={tc.id}
                  className={cn(
                    'group flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2 transition-colors',
                    isActive
                      ? 'border-l-2 border-primary bg-primary/5'
                      : 'border-l-2 border-transparent hover:bg-muted/60',
                  )}
                  onClick={() => onSelectCase(tc.id)}
                >
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selection.isSelected(tc.id)}
                      onCheckedChange={() => selection.toggle(tc.id)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          'truncate text-sm',
                          isActive ? 'font-medium text-primary' : 'text-foreground',
                        )}
                      >
                        {tc.title.replace(/^"|"$/g, '')}
                      </p>
                      {tc.automationStatus === 'AUTOMATED' && (
                        <Zap className="h-3 w-3 shrink-0 text-green-500" />
                      )}
                      {tc.automationStatus === 'NEEDS_UPDATE' && (
                        <AlertTriangle className="h-3 w-3 shrink-0 text-yellow-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'h-4 px-1.5 text-[10px] font-medium',
                          priorityCompactStyles[tc.priority],
                        )}
                      >
                        {tc.priority}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'h-4 px-1.5 text-[10px] font-medium',
                          typeCompactStyles[tc.type],
                        )}
                      >
                        {tc.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
