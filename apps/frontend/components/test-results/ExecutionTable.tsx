'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CaseResultRow } from './CaseResultRow';
import { useDefectsByResult, useCreateDefectForResult } from '@/lib/defects/useDefects';
import { useSelection } from '@/lib/test-cases/useSelection';
import { Button } from '@/components/ui/button';
import { TestResultStatus } from '@app/shared';
import { formatLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TestRunCaseWithResultDto, CreateDefectInput, StepResultInput } from '@app/shared';

/** Checkbox that supports indeterminate state */
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

interface ExecutionTableProps {
  testRunCases: TestRunCaseWithResultDto[];
  projectId: string;
  runName: string;
  onSubmit: (
    testRunCaseId: string,
    status: string,
    comment?: string,
    elapsed?: number,
    stepResults?: StepResultInput[],
    statusOverride?: boolean,
  ) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  onBulkSubmit?: (testRunCaseIds: string[], status: string) => void;
  isPending: boolean;
  isBulkPending?: boolean;
  disabled?: boolean;
}

const BULK_STATUSES = [
  TestResultStatus.PASSED,
  TestResultStatus.FAILED,
  TestResultStatus.BLOCKED,
  TestResultStatus.RETEST,
];

function CaseResultRowWithDefects({
  testRunCase,
  projectId,
  runName,
  onSubmit,
  onUpdateComment,
  isPending,
  disabled,
  showCheckbox,
  isChecked,
  onToggle,
}: {
  testRunCase: TestRunCaseWithResultDto;
  projectId: string;
  runName: string;
  onSubmit: (
    testRunCaseId: string,
    status: string,
    comment?: string,
    elapsed?: number,
    stepResults?: StepResultInput[],
    statusOverride?: boolean,
  ) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  isPending: boolean;
  disabled: boolean;
  showCheckbox: boolean;
  isChecked: boolean;
  onToggle: (id: string, shiftKey: boolean) => void;
}) {
  const resultId = testRunCase.latestResult?.id ?? null;
  const { data: defects } = useDefectsByResult(resultId);
  const createDefect = useCreateDefectForResult(projectId);

  const handleCreateDefect = useCallback(
    (data: CreateDefectInput) => {
      createDefect.mutate(data);
    },
    [createDefect],
  );

  return (
    <CaseResultRow
      testRunCase={testRunCase}
      runName={runName}
      onSubmit={onSubmit}
      onUpdateComment={onUpdateComment}
      onCreateDefect={handleCreateDefect}
      defects={defects ?? []}
      isPending={isPending}
      isDefectPending={createDefect.isPending}
      disabled={disabled}
      checkboxCell={
        showCheckbox ? (
          <td className="w-10 px-2 py-3">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggle(testRunCase.id, e.shiftKey);
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onToggle(testRunCase.id, e.shiftKey);
                }
              }}
            >
              <input
                type="checkbox"
                aria-label={`Select ${testRunCase.testCase.title}`}
                checked={isChecked}
                tabIndex={-1}
                readOnly
                disabled={disabled}
                className="h-4 w-4 shrink-0 rounded border border-primary shadow"
              />
            </div>
          </td>
        ) : undefined
      }
    />
  );
}

export function ExecutionTable({
  testRunCases,
  projectId,
  runName,
  onSubmit,
  onUpdateComment,
  onBulkSubmit,
  isPending,
  isBulkPending = false,
  disabled = false,
}: ExecutionTableProps) {
  const trcIds = useMemo(() => testRunCases.map((trc) => trc.id), [testRunCases]);
  const {
    selectedIds,
    toggle,
    toggleAll,
    deselectAll,
    isAllSelected,
    isSomeSelected,
    selectedCount,
  } = useSelection(trcIds);

  const [bulkStatus, setBulkStatus] = useState('');

  const handleSubmit = useCallback(
    (
      testRunCaseId: string,
      status: string,
      comment?: string,
      elapsed?: number,
      stepResults?: StepResultInput[],
      statusOverride?: boolean,
    ) => {
      onSubmit(testRunCaseId, status, comment, elapsed, stepResults, statusOverride);
    },
    [onSubmit],
  );

  const handleUpdateComment = useCallback(
    (resultId: string, comment: string) => {
      onUpdateComment(resultId, comment);
    },
    [onUpdateComment],
  );

  const handleBulkApply = useCallback(() => {
    if (bulkStatus && selectedCount > 0 && onBulkSubmit) {
      onBulkSubmit(Array.from(selectedIds), bulkStatus);
      deselectAll();
      setBulkStatus('');
    }
  }, [bulkStatus, selectedCount, selectedIds, onBulkSubmit, deselectAll]);

  const showCheckboxes = !!onBulkSubmit;

  if (testRunCases.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No cases in this run.
      </p>
    );
  }

  return (
    <div>
      {selectedCount > 0 && onBulkSubmit && (
        <div
          role="toolbar"
          aria-label="Bulk result actions"
          className="mb-2 flex items-center gap-2 rounded-md border bg-muted/30 px-4 py-2"
        >
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <select
            aria-label="Bulk set status"
            className="h-7 rounded-md border bg-background px-2 text-xs"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            disabled={isBulkPending || disabled}
          >
            <option value="" disabled>
              Set status...
            </option>
            {BULK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatLabel(s)}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!bulkStatus || isBulkPending || disabled}
            onClick={handleBulkApply}
          >
            {isBulkPending ? 'Applying...' : 'Apply'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={deselectAll}
            disabled={isBulkPending}
          >
            Clear
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-muted/50">
            <tr className="border-b">
              {showCheckboxes && (
                <th className="w-10 px-2 py-3">
                  <IndeterminateCheckbox
                    aria-label="Select all cases"
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={() => toggleAll()}
                    disabled={disabled}
                  />
                </th>
              )}
              <th className="px-4 py-3 text-sm font-medium">Test Case</th>
              <th className="px-4 py-3 text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-sm font-medium">Actions</th>
              <th className="px-4 py-3 text-sm font-medium">Comment</th>
              <th className="px-4 py-3 text-sm font-medium">Elapsed</th>
            </tr>
          </thead>
          <tbody>
            {testRunCases.map((trc) => (
              <CaseResultRowWithDefects
                key={trc.id}
                testRunCase={trc}
                projectId={projectId}
                runName={runName}
                onSubmit={handleSubmit}
                onUpdateComment={handleUpdateComment}
                isPending={isPending}
                disabled={disabled}
                showCheckbox={showCheckboxes}
                isChecked={selectedIds.has(trc.id)}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
