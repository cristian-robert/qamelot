'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { useTestExecution } from '@/lib/test-results/useTestExecution';
import { ExecutionProgress } from '@/components/test-results/ExecutionProgress';
import { ExecutionTable } from '@/components/test-results/ExecutionTable';
import { Badge } from '@/components/ui/badge';
import type { SubmitTestResultInput } from '@app/shared';

export default function RunExecutionPage() {
  const { runId } = useParams<{ id: string; runId: string }>();
  const { execution, isLoading, error, submitResult, updateResult } =
    useTestExecution(runId);

  const handleSubmit = useCallback(
    (testRunCaseId: string, status: string, comment?: string, elapsed?: number) => {
      const input: SubmitTestResultInput = {
        testRunCaseId,
        status: status as SubmitTestResultInput['status'],
        ...(comment && { comment }),
        ...(elapsed && { elapsed }),
      };
      submitResult.mutate(input);
    },
    [submitResult],
  );

  const handleUpdateComment = useCallback(
    (resultId: string, comment: string) => {
      updateResult.mutate({ resultId, data: { comment } });
    },
    [updateResult],
  );

  if (isLoading) {
    return <div className="p-6">Loading execution data...</div>;
  }

  if (error || !execution) {
    return <div className="p-6">Failed to load run execution.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{execution.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan: {execution.testPlan.name}
            {execution.assignedTo && (
              <> &middot; Assigned to: {execution.assignedTo.name}</>
            )}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={
            execution.status === 'COMPLETED'
              ? 'bg-green-100 text-green-800'
              : execution.status === 'IN_PROGRESS'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
          }
        >
          {execution.status.replace('_', ' ')}
        </Badge>
      </div>

      <ExecutionProgress summary={execution.summary} />

      <ExecutionTable
        testRunCases={execution.testRunCases}
        onSubmit={handleSubmit}
        onUpdateComment={handleUpdateComment}
        isPending={submitResult.isPending || updateResult.isPending}
      />
    </div>
  );
}
