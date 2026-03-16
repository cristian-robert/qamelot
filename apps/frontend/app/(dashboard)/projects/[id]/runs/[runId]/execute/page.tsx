'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useTestExecution } from '@/lib/test-results/useTestExecution';
import { useRunSSE } from '@/lib/test-results/useRunSSE';
import { ExecutionProgress } from '@/components/test-results/ExecutionProgress';
import { ExecutionTable } from '@/components/test-results/ExecutionTable';
import { LiveIndicator } from '@/components/test-results/LiveIndicator';
import { ResultsCsvExportButton } from '@/components/test-results/ResultsCsvExportButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TestRunStatus } from '@app/shared';
import type { SubmitTestResultInput, StepResultInput } from '@app/shared';

export default function RunExecutionPage() {
  const { id: projectId, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();
  const { status: sseStatus } = useRunSSE(runId);
  const { execution, isLoading, error, submitResult, bulkSubmitResults, updateResult, closeRun, rerunRun } =
    useTestExecution(runId, { enablePolling: sseStatus === 'disconnected' });

  const isClosed = execution?.status === TestRunStatus.COMPLETED;

  const handleSubmit = useCallback(
    (
      testRunCaseId: string,
      status: string,
      comment?: string,
      elapsed?: number,
      stepResults?: StepResultInput[],
      statusOverride?: boolean,
    ) => {
      const input: SubmitTestResultInput = {
        testRunCaseId,
        status: status as SubmitTestResultInput['status'],
        ...(comment && { comment }),
        ...(elapsed && { elapsed }),
        ...(stepResults?.length && { stepResults }),
        ...(statusOverride !== undefined && { statusOverride }),
      };
      submitResult.mutate(input);
    },
    [submitResult],
  );

  const handleBulkSubmit = useCallback(
    (testRunCaseIds: string[], status: string) => {
      bulkSubmitResults.mutate({
        testRunCaseIds,
        status: status as 'PASSED' | 'FAILED' | 'BLOCKED' | 'RETEST',
      });
    },
    [bulkSubmitResults],
  );

  const handleUpdateComment = useCallback(
    (resultId: string, comment: string) => {
      updateResult.mutate({ resultId, data: { comment } });
    },
    [updateResult],
  );

  const handleClose = useCallback(() => {
    closeRun.mutate(undefined);
  }, [closeRun]);

  const handleRerun = useCallback(() => {
    rerunRun.mutate(undefined, {
      onSuccess: (newRun) => {
        router.push(`/projects/${projectId}/runs/${newRun.id}/execute`);
      },
    });
  }, [rerunRun, router, projectId]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <svg className="size-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">Failed to load run execution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{execution.name}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Plan: {execution.testPlan.name}
            {execution.assignedTo && (
              <> &middot; Assigned to: {execution.assignedTo.name}</>
            )}
            {execution.sourceRunId && (
              <> &middot; Rerun of previous run</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ResultsCsvExportButton runId={runId} />
          <LiveIndicator status={sseStatus} />
          <Badge
            variant="secondary"
            className={
              isClosed
                ? 'bg-green-100 text-green-800'
                : execution.status === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
            }
          >
            {execution.status.replace('_', ' ')}
          </Badge>
          {!isClosed && (
            <Button
              variant="destructive"
              size="sm"
              className="cursor-pointer"
              onClick={handleClose}
              disabled={closeRun.isPending}
            >
              {closeRun.isPending ? 'Closing...' : 'Close Run'}
            </Button>
          )}
          {isClosed && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleRerun}
              disabled={rerunRun.isPending}
            >
              {rerunRun.isPending ? 'Creating...' : 'Rerun'}
            </Button>
          )}
        </div>
      </div>

      {/* Progress card */}
      <Card className="p-5">
        <ExecutionProgress summary={execution.summary} />
      </Card>

      {/* Execution table */}
      <ExecutionTable
        testRunCases={execution.testRunCases}
        projectId={projectId}
        runName={execution.name}
        onSubmit={handleSubmit}
        onUpdateComment={handleUpdateComment}
        onBulkSubmit={handleBulkSubmit}
        isPending={submitResult.isPending || updateResult.isPending}
        isBulkPending={bulkSubmitResults.isPending}
        disabled={isClosed}
      />
    </div>
  );
}
