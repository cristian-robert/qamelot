'use client';

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { TestCaseStepDto } from '@app/shared';
import { TestResultStatus } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface StepResult {
  testCaseStepId: string;
  status: TestResultStatus;
  actualResult: string;
}

interface StepResultsPanelProps {
  steps: TestCaseStepDto[];
  stepResults: Map<string, StepResult>;
  onStepStatusChange: (stepId: string, status: TestResultStatus) => void;
  onActualResultChange: (stepId: string, value: string) => void;
  activeStepIndex: number;
}

const borderByStatus: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'border-l-emerald-500',
  [TestResultStatus.FAILED]: 'border-l-red-500',
  [TestResultStatus.BLOCKED]: 'border-l-amber-500',
  [TestResultStatus.RETEST]: 'border-l-blue-500',
  [TestResultStatus.UNTESTED]: 'border-l-gray-300',
};

export function StepResultsPanel({
  steps,
  stepResults,
  onStepStatusChange,
  onActualResultChange,
  activeStepIndex,
}: StepResultsPanelProps) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          This test case has no steps. Use the action buttons above to set the overall result.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const result = stepResults.get(step.id);
        const status = result?.status ?? TestResultStatus.UNTESTED;
        const isActive = index === activeStepIndex;
        const hasResult = result && result.status !== TestResultStatus.UNTESTED;

        return (
          <div
            key={step.id}
            className={cn(
              'rounded-lg border-l-4 bg-card ring-1 ring-foreground/5 transition-all',
              borderByStatus[status],
              isActive && 'ring-2 ring-emerald-400/50 shadow-sm',
            )}
          >
            <div className="p-4">
              {/* Step header */}
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : status === TestResultStatus.PASSED
                        ? 'bg-emerald-100 text-emerald-700'
                        : status === TestResultStatus.FAILED
                          ? 'bg-red-100 text-red-700'
                          : status === TestResultStatus.BLOCKED
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {step.stepNumber}
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  {/* Description */}
                  <p className="text-sm leading-relaxed">{step.description}</p>

                  {/* Expected result */}
                  {step.expectedResult && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Expected
                      </span>
                      <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                        {step.expectedResult}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex items-center gap-2 pl-10">
                <StatusButton
                  label="Pass"
                  icon={<CheckCircle2 className="size-3.5" />}
                  isSelected={status === TestResultStatus.PASSED}
                  variant="pass"
                  onClick={() => onStepStatusChange(step.id, TestResultStatus.PASSED)}
                />
                <StatusButton
                  label="Fail"
                  icon={<XCircle className="size-3.5" />}
                  isSelected={status === TestResultStatus.FAILED}
                  variant="fail"
                  onClick={() => onStepStatusChange(step.id, TestResultStatus.FAILED)}
                />
                <StatusButton
                  label="Block"
                  icon={<AlertTriangle className="size-3.5" />}
                  isSelected={status === TestResultStatus.BLOCKED}
                  variant="block"
                  onClick={() => onStepStatusChange(step.id, TestResultStatus.BLOCKED)}
                />
              </div>

              {/* Actual result textarea - shown when step is active or has a result */}
              {(isActive || hasResult) && (
                <div className="mt-3 pl-10 animate-in">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actual Result
                  </label>
                  <Textarea
                    className="mt-1 min-h-[60px] text-sm"
                    placeholder="Describe the actual result..."
                    value={result?.actualResult ?? ''}
                    onChange={(e) => onActualResultChange(step.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusButton({
  label,
  icon,
  isSelected,
  variant,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  variant: 'pass' | 'fail' | 'block';
  onClick: () => void;
}) {
  const styles = {
    pass: isSelected
      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200'
      : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 border-border',
    fail: isSelected
      ? 'bg-red-100 text-red-700 border-red-300 ring-1 ring-red-200'
      : 'text-muted-foreground hover:bg-red-50 hover:text-red-600 border-border',
    block: isSelected
      ? 'bg-amber-100 text-amber-700 border-amber-300 ring-1 ring-amber-200'
      : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-600 border-border',
  };

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={onClick}
      className={cn('gap-1 transition-all', styles[variant])}
    >
      {icon}
      {label}
    </Button>
  );
}
