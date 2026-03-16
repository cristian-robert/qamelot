'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CaseResultRow } from './CaseResultRow';
import { useDefectsByResult, useCreateDefectForResult } from '@/lib/defects/useDefects';
import { useSelection } from '@/lib/test-cases/useSelection';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
        'h-4 w-4 shrink-0 cursor-pointer rounded border border-primary shadow-sm accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
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
              className="cursor-pointer"
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
                className="h-4 w-4 shrink-0 cursor-pointer rounded border border-primary shadow-sm accent-primary"
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
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <p className="text-[13px] text-muted-foreground">No cases in this run.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk actions floating toolbar */}
      {selectedCount > 0 && onBulkSubmit && (
        <div
          role="toolbar"
          aria-label="Bulk result actions"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 shadow-2xl"
        >
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
            {selectedCount}
          </span>
          <span className="text-[13px] font-medium text-background">selected</span>

          <Separator orientation="vertical" className="mx-1 h-5 bg-background/20" />

          <select
            aria-label="Bulk set status"
            className="h-7 cursor-pointer rounded-md border-0 bg-background/10 px-2.5 text-xs font-medium text-background outline-none transition-colors hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring"
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
            className="h-7 cursor-pointer text-xs"
            disabled={!bulkStatus || isBulkPending || disabled}
            onClick={handleBulkApply}
          >
            {isBulkPending ? 'Applying...' : 'Apply'}
          </Button>
          <button
            type="button"
            className="ml-1 flex size-6 cursor-pointer items-center justify-center rounded-full text-background/60 transition-colors hover:bg-background/10 hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={deselectAll}
            disabled={isBulkPending}
            aria-label="Clear selection"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
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
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Test Case</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Comment</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Elapsed</th>
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
