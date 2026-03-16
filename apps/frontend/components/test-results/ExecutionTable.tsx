'use client';

import { useCallback } from 'react';
import { CaseResultRow } from './CaseResultRow';
import { useDefectsByResult, useCreateDefectForResult } from '@/lib/defects/useDefects';
import type { TestRunCaseWithResultDto, CreateDefectInput } from '@app/shared';

interface ExecutionTableProps {
  testRunCases: TestRunCaseWithResultDto[];
  projectId: string;
  runName: string;
  onSubmit: (testRunCaseId: string, status: string, comment?: string, elapsed?: number) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  isPending: boolean;
  disabled?: boolean;
}

function CaseResultRowWithDefects({
  testRunCase,
  projectId,
  runName,
  onSubmit,
  onUpdateComment,
  isPending,
  disabled,
}: {
  testRunCase: TestRunCaseWithResultDto;
  projectId: string;
  runName: string;
  onSubmit: (testRunCaseId: string, status: string, comment?: string, elapsed?: number) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  isPending: boolean;
  disabled: boolean;
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
    />
  );
}

export function ExecutionTable({
  testRunCases,
  projectId,
  runName,
  onSubmit,
  onUpdateComment,
  isPending,
  disabled = false,
}: ExecutionTableProps) {
  const handleSubmit = useCallback(
    (testRunCaseId: string, status: string, comment?: string, elapsed?: number) => {
      onSubmit(testRunCaseId, status, comment, elapsed);
    },
    [onSubmit],
  );

  const handleUpdateComment = useCallback(
    (resultId: string, comment: string) => {
      onUpdateComment(resultId, comment);
    },
    [onUpdateComment],
  );

  if (testRunCases.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No cases in this run.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left">
        <thead className="bg-muted/50">
          <tr className="border-b">
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
