'use client';

import { useCallback } from 'react';
import { CaseResultRow } from './CaseResultRow';
import type { TestRunCaseWithResultDto } from '@app/shared';

interface ExecutionTableProps {
  testRunCases: TestRunCaseWithResultDto[];
  onSubmit: (testRunCaseId: string, status: string, comment?: string, elapsed?: number) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  isPending: boolean;
}

export function ExecutionTable({
  testRunCases,
  onSubmit,
  onUpdateComment,
  isPending,
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
            <th className="px-4 py-3 text-sm font-medium">Suite / Case</th>
            <th className="px-4 py-3 text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-sm font-medium">Actions</th>
            <th className="px-4 py-3 text-sm font-medium">Comment</th>
            <th className="px-4 py-3 text-sm font-medium">Elapsed</th>
          </tr>
        </thead>
        <tbody>
          {testRunCases.map((trc) => (
            <CaseResultRow
              key={trc.id}
              testRunCase={trc}
              onSubmit={handleSubmit}
              onUpdateComment={handleUpdateComment}
              isPending={isPending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
