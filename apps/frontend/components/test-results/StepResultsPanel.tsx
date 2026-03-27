'use client';

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { TestCaseStepDto } from '@app/shared';
import { TestResultStatus } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { statusBorderStyles, statusCircleStyles, statusActionButtonStyles } from '@/lib/constants';

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
              statusBorderStyles[status],
              isActive && 'ring-2 ring-primary/50 shadow-sm',
            )}
          >
            <div className="p-4">
              {/* Step header */}
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : statusCircleStyles[status],
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
  const actionStyle = statusActionButtonStyles[variant];
  const styles = actionStyle[isSelected ? 'selected' : 'unselected'];

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={onClick}
      className={cn('gap-1 transition-all', styles)}
    >
      {icon}
      {label}
    </Button>
  );
}
