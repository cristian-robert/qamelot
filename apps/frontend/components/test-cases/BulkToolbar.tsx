'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CasePriority, CaseType } from '@app/shared';
import { formatLabel } from '@/lib/format';
import type { TestSuiteDto } from '@app/shared';
import { ConfirmDialog } from './ConfirmDialog';

interface BulkToolbarProps {
  selectedCount: number;
  suites: TestSuiteDto[];
  currentSuiteId: string;
  onDeselectAll: () => void;
  onBulkUpdate: (fields: { priority?: CasePriority; type?: CaseType }) => void;
  onBulkMove: (targetSuiteId: string) => void;
  onBulkDelete: () => void;
  isPending: boolean;
}

export function BulkToolbar({
  selectedCount,
  suites,
  currentSuiteId,
  onDeselectAll,
  onBulkUpdate,
  onBulkMove,
  onBulkDelete,
  isPending,
}: BulkToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePriorityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as CasePriority;
      if (value) {
        onBulkUpdate({ priority: value });
      }
      e.target.value = '';
    },
    [onBulkUpdate],
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as CaseType;
      if (value) {
        onBulkUpdate({ type: value });
      }
      e.target.value = '';
    },
    [onBulkUpdate],
  );

  const handleMoveChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value) {
        onBulkMove(value);
      }
      e.target.value = '';
    },
    [onBulkMove],
  );

  const otherSuites = suites.filter((s) => s.id !== currentSuiteId);

  return (
    <>
      <div
        role="toolbar"
        aria-label="Bulk actions"
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 shadow-2xl"
      >
        {/* Count badge */}
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-[13px] font-medium text-background">
          selected
        </span>

        <Separator orientation="vertical" className="mx-1 h-5 bg-background/20" />

        {/* Move */}
        {otherSuites.length > 0 && (
          <select
            aria-label="Move to suite"
            className="h-7 cursor-pointer rounded-md border-0 bg-background/10 px-2.5 text-xs font-medium text-background outline-none transition-colors hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue=""
            onChange={handleMoveChange}
            disabled={isPending}
          >
            <option value="" disabled>
              Move to...
            </option>
            {otherSuites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {/* Priority */}
        <select
          aria-label="Set priority"
          className="h-7 cursor-pointer rounded-md border-0 bg-background/10 px-2.5 text-xs font-medium text-background outline-none transition-colors hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue=""
          onChange={handlePriorityChange}
          disabled={isPending}
        >
          <option value="" disabled>
            Set Priority
          </option>
          {Object.values(CasePriority).map((p) => (
            <option key={p} value={p}>
              {formatLabel(p)}
            </option>
          ))}
        </select>

        {/* Type */}
        <select
          aria-label="Set type"
          className="h-7 cursor-pointer rounded-md border-0 bg-background/10 px-2.5 text-xs font-medium text-background outline-none transition-colors hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue=""
          onChange={handleTypeChange}
          disabled={isPending}
        >
          <option value="" disabled>
            Set Type
          </option>
          {Object.values(CaseType).map((t) => (
            <option key={t} value={t}>
              {formatLabel(t)}
            </option>
          ))}
        </select>

        <Separator orientation="vertical" className="mx-1 h-5 bg-background/20" />

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="h-7 cursor-pointer gap-1 text-xs"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending}
        >
          Delete
        </Button>

        {/* Close */}
        <button
          type="button"
          className="ml-1 flex size-6 cursor-pointer items-center justify-center rounded-full text-background/60 transition-colors hover:bg-background/10 hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onDeselectAll}
          disabled={isPending}
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete test cases"
        description={`Are you sure you want to delete ${selectedCount} test case${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={isPending}
        onConfirm={() => {
          onBulkDelete();
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}
