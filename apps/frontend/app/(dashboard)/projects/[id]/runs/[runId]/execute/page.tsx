'use client';

import { use } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, SkipForward, Send, ChevronRight, Clock, Zap } from 'lucide-react';
import { type TestRunCaseWithResultDto, TestResultStatus } from '@app/shared';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/empty-state';
import { LiveIndicator } from '@/components/test-results/LiveIndicator';
import { ExecutionProgress } from '@/components/test-results/ExecutionProgress';
import { CaseResultRow } from '@/components/test-results/CaseResultRow';
import { StepResultsPanel } from '@/components/test-results/StepResultsPanel';
import { ResultStatusBadge } from '@/components/test-results/ResultStatusBadge';
import { CreateDefectDialog } from '@/components/test-results/CreateDefectDialog';
import { priorityBadgeStyles, typeBadgeStyles } from '@/lib/constants';
import { ExecutionSkeleton } from './ExecutionSkeleton';
import { useExecutionState } from './useExecutionState';

// Defensively reads preconditions — the field isn't on TestRunCaseDto.testCase directly
function getPreconditions(cases: TestRunCaseWithResultDto[], index: number): string | null {
  const testCase = cases[index]?.testCase as Record<string, unknown> | undefined;
  return typeof testCase?.preconditions === 'string' && testCase.preconditions
    ? testCase.preconditions
    : null;
}

export default function ExecutePage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id: projectId, runId } = use(params);

  const {
    execution,
    isLoading,
    isError,
    refetch,
    cases,
    activeCase,
    steps,
    isRunClosed,
    activeCaseIndex,
    stepResults,
    comment,
    activeStepIndex,
    computedOverallStatus,
    isSubmitPending,
    isBulkSubmitPending,
    caseStatus,
    handleStepStatusChange,
    handleActualResultChange,
    handleSubmitCase,
    handlePassAllSteps,
    handleSkipCase,
    handleBulkSubmitAll,
    selectCase,
    setComment,
  } = useExecutionState(runId);

  if (isLoading) {
    return <ExecutionSkeleton />;
  }

  if (isError || !execution) {
    return (
      <div className="flex items-center justify-center py-20">
        <ErrorState
          message="Failed to load test run data."
          onRetry={refetch}
        />
      </div>
    );
  }

  const preconditions = getPreconditions(cases, activeCaseIndex);
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-[280px] shrink-0 flex-col border-r bg-card">
        <div className="space-y-3 border-b p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold truncate">{execution.name}</h2>
            <LiveIndicator />
          </div>
          <ExecutionProgress summary={execution.summary} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-0.5 p-2">
            {cases.map((trc, index) => (
              <CaseResultRow
                key={trc.id}
                title={trc.testCase.title.replace(/^"|"$/g, '')}
                status={caseStatus(trc)}
                isActive={index === activeCaseIndex}
                onClick={() => selectCase(index)}
              />
            ))}
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeCase ? (
          <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
            <Breadcrumb
              items={[
                {
                  label: activeCase.testCase.suite?.name ?? 'Suite',
                  href: `/projects/${projectId}/runs/${runId}`,
                },
                { label: activeCase.testCase.title },
              ]}
            />

            {isRunClosed && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This run is completed. Results cannot be modified.
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl font-bold tracking-tight">
                  {activeCase.testCase.title.replace(/^"|"$/g, '')}
                </h1>
                {activeCase.latestResult && (
                  <ResultStatusBadge status={activeCase.latestResult.status} />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    priorityBadgeStyles[activeCase.testCase.priority],
                  )}
                >
                  {activeCase.testCase.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    typeBadgeStyles[activeCase.testCase.type],
                  )}
                >
                  {activeCase.testCase.type}
                </Badge>
                {activeCase.testCase.templateType && (
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {activeCase.testCase.templateType}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 bg-status-passed hover:bg-status-passed/90 text-white"
                onClick={handlePassAllSteps}
                disabled={isRunClosed}
              >
                <Zap className="size-3.5" />
                Pass All Steps
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleSkipCase}
                disabled={isRunClosed}
              >
                <SkipForward className="size-3.5" />
                Skip
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleSubmitCase()}
                disabled={
                  isRunClosed ||
                  isSubmitPending ||
                  (steps.length > 0 && !computedOverallStatus)
                }
              >
                <Send className="size-3.5" />
                {isSubmitPending ? 'Submitting...' : 'Submit'}
              </Button>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={handleBulkSubmitAll}
                  disabled={isRunClosed || isBulkSubmitPending}
                >
                  <CheckCircle2 className="size-3.5" />
                  {isBulkSubmitPending ? 'Submitting...' : 'Submit All Remaining'}
                </Button>
              </div>
            </div>

            {activeCase.testCase.steps &&
              activeCase.testCase.steps.length > 0 &&
              preconditions && (
                <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                    <AlertTriangle className="size-4" />
                    Preconditions
                  </div>
                  <p className="mt-1.5 text-sm text-amber-700 leading-relaxed">{preconditions}</p>
                </div>
              )}

            <StepResultsPanel
              steps={steps}
              stepResults={stepResults}
              onStepStatusChange={handleStepStatusChange}
              onActualResultChange={handleActualResultChange}
              activeStepIndex={activeStepIndex}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Comment
              </label>
              <Textarea
                placeholder="Add a comment for this result..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            {activeCase.latestResult?.status === TestResultStatus.FAILED && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <XCircle className="size-4 text-red-600" />
                <span className="text-sm text-red-700">This case failed.</span>
                <CreateDefectDialog
                  projectId={projectId}
                  testResultId={activeCase.latestResult.id}
                  caseTitle={activeCase.testCase.title}
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground tabular-nums">
                Case {activeCaseIndex + 1} of {cases.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeCaseIndex === 0}
                  onClick={() => selectCase(activeCaseIndex - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeCaseIndex === cases.length - 1}
                  onClick={() => selectCase(activeCaseIndex + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Clock className="mx-auto size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                Select a test case from the sidebar to begin execution.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
