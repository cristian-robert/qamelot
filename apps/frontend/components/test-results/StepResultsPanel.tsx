'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResultStatusBadge } from './ResultStatusBadge';
import { TestResultStatus } from '@app/shared';
import type { TestCaseStepDto, TestStepResultDto, StepResultInput } from '@app/shared';

const STATUS_OPTIONS: Array<{
  value: TestResultStatus;
  label: string;
  className: string;
}> = [
  { value: TestResultStatus.PASSED, label: 'Pass', className: 'bg-green-600 hover:bg-green-700 text-white' },
  { value: TestResultStatus.FAILED, label: 'Fail', className: 'bg-red-600 hover:bg-red-700 text-white' },
  { value: TestResultStatus.BLOCKED, label: 'Blocked', className: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  { value: TestResultStatus.RETEST, label: 'Retest', className: 'bg-blue-600 hover:bg-blue-700 text-white' },
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
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Step-Level Results</h4>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePassAll}
            disabled={disabled}
            className="text-xs"
          >
            Pass All Steps
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="w-10 px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Step Description</th>
              <th className="px-3 py-2 font-medium">Expected Result</th>
              <th className="px-3 py-2 font-medium">Actual Result</th>
              <th className="w-32 px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, idx) => {
              const stepState = stepStates[idx];
              return (
                <tr key={step.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 text-muted-foreground">
                    {step.stepNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap">
                    {step.description}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap text-muted-foreground">
                    {step.expectedResult}
                  </td>
                  <td className="px-3 py-2">
                    <Textarea
                      placeholder="Actual result..."
                      value={stepState.actualResult}
                      onChange={(e) =>
                        handleActualResultChange(step.id, e.target.value)
                      }
                      rows={1}
                      className="min-h-[32px] resize-none text-xs"
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          size="sm"
                          variant={
                            stepState.status === opt.value
                              ? 'default'
                              : 'outline'
                          }
                          className={
                            stepState.status === opt.value
                              ? opt.className
                              : 'h-6 px-1.5 text-xs'
                          }
                          onClick={() =>
                            handleStepStatusChange(step.id, opt.value)
                          }
                          disabled={disabled}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Overall Status:</span>
          <ResultStatusBadge status={displayStatus} />
          {overrideStatus !== null && (
            <Badge variant="outline" className="text-xs text-amber-700">
              Manual Override
            </Badge>
          )}
          {derivedStatus !== displayStatus && (
            <span className="text-xs text-muted-foreground">
              (auto-derived: {derivedStatus})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Override:</span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={overrideStatus === opt.value ? 'default' : 'outline'}
              className={
                overrideStatus === opt.value
                  ? opt.className
                  : 'h-6 px-1.5 text-xs'
              }
              onClick={() => handleOverrideClick(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isPending || disabled || (!allStepsSet && overrideStatus === null)}
        >
          {isPending ? 'Submitting...' : 'Submit Step Results'}
        </Button>
      </div>
    </div>
  );
}
