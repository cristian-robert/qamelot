'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
        className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2"
      >
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>

        <select
          aria-label="Set priority"
          className="h-7 rounded-md border bg-background px-2 text-xs"
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

        <select
          aria-label="Set type"
          className="h-7 rounded-md border bg-background px-2 text-xs"
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

        {otherSuites.length > 0 && (
          <select
            aria-label="Move to suite"
            className="h-7 rounded-md border bg-background px-2 text-xs"
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

        <Button
          variant="destructive"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending}
        >
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onDeselectAll}
          disabled={isPending}
        >
          Clear selection
        </Button>
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
