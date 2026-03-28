import { useState, useCallback, useMemo } from 'react';
import type {
  TestCaseStepDto,
  TestRunCaseWithResultDto,
  SubmitTestResultInput,
} from '@app/shared';
import { TestResultStatus, TestRunStatus } from '@app/shared';
import { toast } from 'sonner';
import {
  useTestExecution,
  useSubmitResult,
  useBulkSubmitResults,
} from '@/lib/test-results/useTestExecution';
import { useRunSSE } from '@/lib/test-results/useRunSSE';

interface StepResult {
  testCaseStepId: string;
  status: TestResultStatus;
  actualResult: string;
}

export interface ExecutionState {
  // Data
  execution: ReturnType<typeof useTestExecution>['data'];
  isLoading: boolean;
  isError: boolean;
  refetch: ReturnType<typeof useTestExecution>['refetch'];
  cases: TestRunCaseWithResultDto[];
  activeCase: TestRunCaseWithResultDto | undefined;
  steps: TestCaseStepDto[];
  isRunClosed: boolean;
  // Step state
  activeCaseIndex: number;
  stepResults: Map<string, StepResult>;
  comment: string;
  activeStepIndex: number;
  // Derived
  computedOverallStatus: TestResultStatus | null;
  // Mutation state
  isSubmitPending: boolean;
  isBulkSubmitPending: boolean;
  // Handlers
  caseStatus: (trc: TestRunCaseWithResultDto) => TestResultStatus;
  handleStepStatusChange: (stepId: string, status: TestResultStatus) => void;
  handleActualResultChange: (stepId: string, value: string) => void;
  handleSubmitCase: (overrideStatus?: TestResultStatus) => void;
  handlePassAllSteps: () => void;
  handleSkipCase: () => void;
  handleBulkSubmitAll: () => void;
  selectCase: (index: number) => void;
  setComment: React.Dispatch<React.SetStateAction<string>>;
}

export function useExecutionState(runId: string): ExecutionState {
  const { data: execution, isLoading, isError, refetch } = useTestExecution(runId);
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
  const isRunClosed = execution?.status === TestRunStatus.COMPLETED;

  const caseStatus = useCallback(
    (trc: TestRunCaseWithResultDto): TestResultStatus =>
      trc.latestResult?.status ?? TestResultStatus.UNTESTED,
    [],
  );

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
        setStepResults(new Map());
        setComment('');
        setActiveStepIndex(0);
        if (activeCaseIndex < cases.length - 1) {
          setActiveCaseIndex(activeCaseIndex + 1);
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to submit result');
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

    bulkSubmit.mutate(
      {
        testRunCaseIds: untestedIds,
        status: 'PASSED',
        comment: 'Bulk submitted as passed',
      },
      {
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to submit results');
        },
      },
    );
  }

  function selectCase(index: number) {
    setActiveCaseIndex(index);
    setStepResults(new Map());
    setComment('');
    setActiveStepIndex(0);
  }

  return {
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
    isSubmitPending: submitResult.isPending,
    isBulkSubmitPending: bulkSubmit.isPending,
    caseStatus,
    handleStepStatusChange,
    handleActualResultChange,
    handleSubmitCase,
    handlePassAllSteps,
    handleSkipCase,
    handleBulkSubmitAll,
    selectCase,
    setComment,
  };
}
