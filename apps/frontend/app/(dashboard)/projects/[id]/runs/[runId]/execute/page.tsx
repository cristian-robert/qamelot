'use client';

import { useState, useCallback, useMemo } from 'react';
import { use } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
  Send,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react';
import type {
  TestCaseStepDto,
  TestRunCaseWithResultDto,
  SubmitTestResultInput,
} from '@app/shared';
import { TestResultStatus, CasePriority, CaseType } from '@app/shared';
import {
  useTestExecution,
  useSubmitResult,
  useBulkSubmitResults,
} from '@/lib/test-results/useTestExecution';
import { useRunSSE } from '@/lib/test-results/useRunSSE';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { LiveIndicator } from '@/components/test-results/LiveIndicator';
import { ExecutionProgress } from '@/components/test-results/ExecutionProgress';
import { CaseResultRow } from '@/components/test-results/CaseResultRow';
import { StepResultsPanel } from '@/components/test-results/StepResultsPanel';
import { ResultStatusBadge } from '@/components/test-results/ResultStatusBadge';
import { CreateDefectDialog } from '@/components/test-results/CreateDefectDialog';

interface StepResult {
  testCaseStepId: string;
  status: TestResultStatus;
  actualResult: string;
}

const priorityStyles: Record<CasePriority, string> = {
  [CasePriority.CRITICAL]: 'bg-red-50 text-red-700 border-red-200',
  [CasePriority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [CasePriority.MEDIUM]: 'bg-blue-50 text-blue-700 border-blue-200',
  [CasePriority.LOW]: 'bg-gray-50 text-gray-600 border-gray-200',
};

const typeStyles: Record<CaseType, string> = {
  [CaseType.FUNCTIONAL]: 'bg-purple-50 text-purple-700 border-purple-200',
  [CaseType.REGRESSION]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [CaseType.SMOKE]: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  [CaseType.EXPLORATORY]: 'bg-pink-50 text-pink-700 border-pink-200',
  [CaseType.OTHER]: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function ExecutePage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id: projectId, runId } = use(params);

  const { data: execution, isLoading } = useTestExecution(runId);
  const submitResult = useSubmitResult(runId);
  const bulkSubmit = useBulkSubmitResults(runId);

  useRunSSE(runId);

  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [stepResults, setStepResults] = useState<Map<string, StepResult>>(new Map());
  const [comment, setComment] = useState('');
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const cases = execution?.testRunCases ?? [];
  const activeCase: TestRunCaseWithResultDto | undefined = cases[activeCaseIndex];
  const steps: TestCaseStepDto[] = activeCase?.testCase.steps ?? [];

  const caseStatus = useCallback(
    (trc: TestRunCaseWithResultDto): TestResultStatus =>
      trc.latestResult?.status ?? TestResultStatus.UNTESTED,
    [],
  );

  // Compute overall status from step results
  const computedOverallStatus = useMemo((): TestResultStatus | null => {
    if (steps.length === 0) return null;
    const statuses = steps.map(
      (s) => stepResults.get(s.id)?.status ?? TestResultStatus.UNTESTED,
    );
    if (statuses.some((s) => s === TestResultStatus.UNTESTED)) return null;
    if (statuses.some((s) => s === TestResultStatus.FAILED)) return TestResultStatus.FAILED;
    if (statuses.some((s) => s === TestResultStatus.BLOCKED)) return TestResultStatus.BLOCKED;
    return TestResultStatus.PASSED;
  }, [steps, stepResults]);

  function handleStepStatusChange(stepId: string, status: TestResultStatus) {
    setStepResults((prev) => {
      const next = new Map(prev);
      const existing = next.get(stepId);
      next.set(stepId, {
        testCaseStepId: stepId,
        status,
        actualResult: existing?.actualResult ?? '',
      });
      return next;
    });

    // Auto-advance to next step
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex >= 0 && stepIndex < steps.length - 1) {
      setActiveStepIndex(stepIndex + 1);
    }
  }

  function handleActualResultChange(stepId: string, value: string) {
    setStepResults((prev) => {
      const next = new Map(prev);
      const existing = next.get(stepId);
      next.set(stepId, {
        testCaseStepId: stepId,
        status: existing?.status ?? TestResultStatus.UNTESTED,
        actualResult: value,
      });
      return next;
    });
  }

  function handleSubmitCase(overrideStatus?: TestResultStatus) {
    if (!activeCase) return;

    const resolvedStatus =
      overrideStatus ?? computedOverallStatus ?? TestResultStatus.PASSED;

    // SubmitTestResultInput.status only allows non-UNTESTED values
    const status = resolvedStatus as 'PASSED' | 'FAILED' | 'BLOCKED' | 'RETEST';

    const payload: SubmitTestResultInput = {
      testRunCaseId: activeCase.id,
      status,
      comment: comment.trim() || undefined,
      stepResults: steps.length > 0
        ? steps.map((s) => {
            const result = stepResults.get(s.id);
            return {
              testCaseStepId: s.id,
              status: result?.status ?? TestResultStatus.UNTESTED,
              actualResult: result?.actualResult || undefined,
            };
          })
        : undefined,
    };

    submitResult.mutate(payload, {
      onSuccess: () => {
        // Reset state and advance to next case
        setStepResults(new Map());
        setComment('');
        setActiveStepIndex(0);
        if (activeCaseIndex < cases.length - 1) {
          setActiveCaseIndex(activeCaseIndex + 1);
        }
      },
    });
  }

  function handlePassAllSteps() {
    if (steps.length === 0) {
      handleSubmitCase(TestResultStatus.PASSED);
      return;
    }

    const newResults = new Map<string, StepResult>();
    steps.forEach((s) => {
      newResults.set(s.id, {
        testCaseStepId: s.id,
        status: TestResultStatus.PASSED,
        actualResult: stepResults.get(s.id)?.actualResult ?? '',
      });
    });
    setStepResults(newResults);
  }

  function handleSkipCase() {
    setStepResults(new Map());
    setComment('');
    setActiveStepIndex(0);
    if (activeCaseIndex < cases.length - 1) {
      setActiveCaseIndex(activeCaseIndex + 1);
    }
  }

  function handleBulkSubmitAll() {
    const untestedIds = cases
      .filter((c) => caseStatus(c) === TestResultStatus.UNTESTED)
      .map((c) => c.id);

    if (untestedIds.length === 0) return;

    bulkSubmit.mutate({
      testRunCaseIds: untestedIds,
      status: 'PASSED',
      comment: 'Bulk submitted as passed',
    });
  }

  function selectCase(index: number) {
    setActiveCaseIndex(index);
    setStepResults(new Map());
    setComment('');
    setActiveStepIndex(0);
  }

  // Loading state
  if (isLoading) {
    return <ExecutionSkeleton />;
  }

  if (!execution) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Run not found or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Sidebar - Case list */}
      <aside className="flex w-[280px] shrink-0 flex-col border-r bg-card">
        {/* Sidebar header */}
        <div className="space-y-3 border-b p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold truncate">{execution.name}</h2>
            <LiveIndicator />
          </div>
          <ExecutionProgress summary={execution.summary} />
        </div>

        {/* Case list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-0.5 p-2">
            {cases.map((trc, index) => (
              <CaseResultRow
                key={trc.id}
                title={trc.testCase.title}
                status={caseStatus(trc)}
                isActive={index === activeCaseIndex}
                onClick={() => selectCase(index)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main execution area */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {activeCase ? (
          <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                {
                  label: activeCase.testCase.suite?.name ?? 'Suite',
                  href: `/projects/${projectId}/runs/${runId}`,
                },
                { label: activeCase.testCase.title },
              ]}
            />

            {/* Case header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl font-bold tracking-tight">
                  {activeCase.testCase.title}
                </h1>
                {activeCase.latestResult && (
                  <ResultStatusBadge status={activeCase.latestResult.status} />
                )}
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    priorityStyles[activeCase.testCase.priority],
                  )}
                >
                  {activeCase.testCase.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    typeStyles[activeCase.testCase.type],
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

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handlePassAllSteps}
              >
                <Zap className="size-3.5" />
                Pass All Steps
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleSkipCase}
              >
                <SkipForward className="size-3.5" />
                Skip
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleSubmitCase()}
                disabled={
                  submitResult.isPending ||
                  (steps.length > 0 && !computedOverallStatus)
                }
              >
                <Send className="size-3.5" />
                {submitResult.isPending ? 'Submitting...' : 'Submit'}
              </Button>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={handleBulkSubmitAll}
                  disabled={bulkSubmit.isPending}
                >
                  <CheckCircle2 className="size-3.5" />
                  {bulkSubmit.isPending ? 'Submitting...' : 'Submit All Remaining'}
                </Button>
              </div>
            </div>

            {/* Preconditions */}
            {activeCase.testCase.steps &&
              activeCase.testCase.steps.length > 0 &&
              getPreconditions(cases, activeCaseIndex) && (
                <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                    <AlertTriangle className="size-4" />
                    Preconditions
                  </div>
                  <p className="mt-1.5 text-sm text-amber-700 leading-relaxed">
                    {getPreconditions(cases, activeCaseIndex)}
                  </p>
                </div>
              )}

            {/* Steps panel */}
            <StepResultsPanel
              steps={steps}
              stepResults={stepResults}
              onStepStatusChange={handleStepStatusChange}
              onActualResultChange={handleActualResultChange}
              activeStepIndex={activeStepIndex}
            />

            {/* Comment section */}
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

            {/* Defect actions for failed results */}
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

            {/* Navigation footer */}
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

/** Extract preconditions text from the test case data if available */
function getPreconditions(
  cases: TestRunCaseWithResultDto[],
  index: number,
): string | null {
  const trc = cases[index];
  if (!trc) return null;
  // The preconditions field isn't on TestRunCaseDto.testCase directly,
  // but we check for it defensively
  const testCase = trc.testCase as Record<string, unknown>;
  if (typeof testCase.preconditions === 'string' && testCase.preconditions) {
    return testCase.preconditions;
  }
  return null;
}

function ExecutionSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-[280px] shrink-0 flex-col border-r bg-card p-3 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-2 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  );
}
