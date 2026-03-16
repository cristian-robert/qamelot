'use client';

import { useState, useCallback } from 'react';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResultStatusBadge } from './ResultStatusBadge';
import { TestResultStatus } from '@app/shared';
import { cn } from '@/lib/utils';
import type { TestCaseStepDto, TestStepResultDto, StepResultInput } from '@app/shared';

const STATUS_OPTIONS: Array<{
  value: TestResultStatus;
  label: string;
  activeClass: string;
}> = [
  { value: TestResultStatus.PASSED, label: 'Pass', activeClass: 'bg-green-600 hover:bg-green-700 text-white border-green-600' },
  { value: TestResultStatus.FAILED, label: 'Fail', activeClass: 'bg-red-600 hover:bg-red-700 text-white border-red-600' },
  { value: TestResultStatus.BLOCKED, label: 'Block', activeClass: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' },
  { value: TestResultStatus.RETEST, label: 'Retest', activeClass: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' },
];

interface StepState {
  testCaseStepId: string;
  status: TestResultStatus;
  actualResult: string;
}

interface StepResultsPanelProps {
  steps: TestCaseStepDto[];
  existingStepResults?: TestStepResultDto[];
  onSubmitSteps: (
    stepResults: StepResultInput[],
    overallStatus: string,
    isOverride: boolean,
  ) => void;
  isPending: boolean;
  disabled: boolean;
}

/** Derive overall status from step statuses (mirrors backend logic) */
function deriveOverallStatus(stepStates: StepState[]): TestResultStatus {
  if (stepStates.length === 0) return TestResultStatus.UNTESTED;

  if (stepStates.some((s) => s.status === TestResultStatus.FAILED)) {
    return TestResultStatus.FAILED;
  }
  if (stepStates.some((s) => s.status === TestResultStatus.BLOCKED)) {
    return TestResultStatus.BLOCKED;
  }
  if (stepStates.some((s) => s.status === TestResultStatus.RETEST)) {
    return TestResultStatus.RETEST;
  }
  if (stepStates.some((s) => s.status === TestResultStatus.UNTESTED)) {
    return TestResultStatus.RETEST;
  }
  return TestResultStatus.PASSED;
}

export function StepResultsPanel({
  steps,
  existingStepResults,
  onSubmitSteps,
  isPending,
  disabled,
}: StepResultsPanelProps) {
  const [stepStates, setStepStates] = useState<StepState[]>(() =>
    steps.map((step) => {
      const existing = existingStepResults?.find(
        (sr) => sr.testCaseStepId === step.id,
      );
      return {
        testCaseStepId: step.id,
        status: (existing?.status as TestResultStatus) ?? TestResultStatus.UNTESTED,
        actualResult: existing?.actualResult ?? '',
      };
    }),
  );

  const [overrideStatus, setOverrideStatus] = useState<TestResultStatus | null>(null);

  const derivedStatus = deriveOverallStatus(stepStates);
  const displayStatus = overrideStatus ?? derivedStatus;

  const handleStepStatusChange = useCallback(
    (stepId: string, status: TestResultStatus) => {
      setStepStates((prev) =>
        prev.map((s) =>
          s.testCaseStepId === stepId ? { ...s, status } : s,
        ),
      );
      setOverrideStatus(null);
    },
    [],
  );

  const handleActualResultChange = useCallback(
    (stepId: string, value: string) => {
      setStepStates((prev) =>
        prev.map((s) =>
          s.testCaseStepId === stepId ? { ...s, actualResult: value } : s,
        ),
      );
    },
    [],
  );

  const handleOverrideClick = useCallback(
    (status: TestResultStatus) => {
      setOverrideStatus(status === overrideStatus ? null : status);
    },
    [overrideStatus],
  );

  const handleSubmit = useCallback(() => {
    const stepResults: StepResultInput[] = stepStates.map((s) => ({
      testCaseStepId: s.testCaseStepId,
      status: s.status,
      ...(s.actualResult && { actualResult: s.actualResult }),
    }));

    const isOverride = overrideStatus !== null;
    const finalStatus = isOverride ? overrideStatus : derivedStatus;

    onSubmitSteps(stepResults, finalStatus, isOverride);
  }, [stepStates, overrideStatus, derivedStatus, onSubmitSteps]);

  const allStepsSet = stepStates.every(
    (s) => s.status !== TestResultStatus.UNTESTED,
  );

  const handlePassAll = useCallback(() => {
    setStepStates((prev) =>
      prev.map((s) => ({ ...s, status: TestResultStatus.PASSED })),
    );
    setOverrideStatus(null);
  }, []);

  return (
    <div className="space-y-3">
      {/* Header with Pass All shortcut */}
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold">Step-Level Results</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePassAll}
          disabled={disabled}
          className="h-7 cursor-pointer gap-1.5 border-green-300 text-xs text-green-700 hover:bg-green-50 hover:text-green-800"
        >
          <CheckCheck className="size-3.5" />
          Pass All Steps
        </Button>
      </div>

      {/* Step cards */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const stepState = stepStates[idx];
          return (
            <div
              key={step.id}
              className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
            >
              <div className="flex gap-3">
                {/* Step number */}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {step.stepNumber}
                </span>

                <div className="flex-1 space-y-2">
                  {/* Description */}
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Description</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[13px]">{step.description}</p>
                  </div>

                  {/* Expected result */}
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Expected Result</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-muted-foreground">{step.expectedResult}</p>
                  </div>

                  {/* Actual result */}
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Actual Result</p>
                    <Textarea
                      placeholder="Enter actual result..."
                      value={stepState.actualResult}
                      onChange={(e) =>
                        handleActualResultChange(step.id, e.target.value)
                      }
                      rows={1}
                      className="mt-0.5 min-h-[32px] resize-none text-[13px]"
                      disabled={disabled}
                    />
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant="outline"
                        className={cn(
                          'h-7 cursor-pointer px-3 text-xs font-medium transition-all',
                          stepState.status === opt.value
                            ? opt.activeClass
                            : 'hover:bg-muted',
                        )}
                        onClick={() =>
                          handleStepStatusChange(step.id, opt.value)
                        }
                        disabled={disabled}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall status bar */}
      <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold">Overall:</span>
          <ResultStatusBadge status={displayStatus} />
          {overrideStatus !== null && (
            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 bg-amber-50">
              Manual Override
            </Badge>
          )}
          {derivedStatus !== displayStatus && (
            <span className="text-[11px] text-muted-foreground">
              (auto-derived: {derivedStatus})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Override:</span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant="outline"
              className={cn(
                'h-6 cursor-pointer px-2 text-[10px] font-medium',
                overrideStatus === opt.value
                  ? opt.activeClass
                  : 'hover:bg-muted',
              )}
              onClick={() => handleOverrideClick(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="cursor-pointer"
          disabled={isPending || disabled || (!allStepsSet && overrideStatus === null)}
        >
          {isPending ? 'Submitting...' : 'Submit Step Results'}
        </Button>
      </div>
    </div>
  );
}
