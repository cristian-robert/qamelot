'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Timer, Bug, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResultStatusBadge } from './ResultStatusBadge';
import { DefectBadge } from './DefectBadge';
import { CreateDefectDialog } from './CreateDefectDialog';
import { StepResultsPanel } from './StepResultsPanel';
import { TestResultStatus, TemplateType } from '@app/shared';
import { cn } from '@/lib/utils';
import type {
  TestRunCaseWithResultDto,
  CreateDefectInput,
  DefectDto,
  StepResultInput,
} from '@app/shared';

const statusButtons: Array<{
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'RETEST';
  label: string;
  activeClass: string;
}> = [
  { status: 'PASSED', label: 'Pass', activeClass: 'bg-green-600 hover:bg-green-700 text-white' },
  { status: 'FAILED', label: 'Fail', activeClass: 'bg-red-600 hover:bg-red-700 text-white' },
  { status: 'BLOCKED', label: 'Block', activeClass: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  { status: 'RETEST', label: 'Retest', activeClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface CaseResultRowProps {
  testRunCase: TestRunCaseWithResultDto;
  runName: string;
  onSubmit: (
    testRunCaseId: string,
    status: string,
    comment?: string,
    elapsed?: number,
    stepResults?: StepResultInput[],
    statusOverride?: boolean,
  ) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  onCreateDefect: (data: CreateDefectInput) => void;
  defects: DefectDto[];
  isPending: boolean;
  isDefectPending: boolean;
  disabled?: boolean;
  checkboxCell?: React.ReactNode;
}

export function CaseResultRow({
  testRunCase,
  runName,
  onSubmit,
  onUpdateComment,
  onCreateDefect,
  defects,
  isPending,
  isDefectPending,
  disabled = false,
  checkboxCell,
}: CaseResultRowProps) {
  const latestResult = testRunCase.latestResult;
  const currentStatus = latestResult?.status ?? TestResultStatus.UNTESTED;
  const isFailed = currentStatus === TestResultStatus.FAILED;
  const [comment, setComment] = useState(latestResult?.comment ?? '');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(latestResult?.elapsed ?? 0);
  const [defectDialogOpen, setDefectDialogOpen] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tc = testRunCase.testCase;
  const isStepsTemplate = tc.templateType === TemplateType.STEPS;
  const hasSteps = isStepsTemplate && tc.steps && tc.steps.length > 0;

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = useCallback(() => {
    setIsTimerRunning((prev) => !prev);
  }, []);

  const handleStatusClick = useCallback(
    (status: string) => {
      if (isTimerRunning) setIsTimerRunning(false);
      onSubmit(testRunCase.id, status, comment || undefined, elapsed || undefined);
    },
    [testRunCase.id, comment, elapsed, isTimerRunning, onSubmit],
  );

  const handleStepSubmit = useCallback(
    (stepResults: StepResultInput[], overallStatus: string, isOverride: boolean) => {
      if (isTimerRunning) setIsTimerRunning(false);
      onSubmit(
        testRunCase.id,
        overallStatus,
        comment || undefined,
        elapsed || undefined,
        stepResults,
        isOverride,
      );
    },
    [testRunCase.id, comment, elapsed, isTimerRunning, onSubmit],
  );

  const handleCommentBlur = useCallback(() => {
    if (latestResult && comment !== (latestResult.comment ?? '')) {
      onUpdateComment(latestResult.id, comment);
    }
  }, [latestResult, comment, onUpdateComment]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <tr className="border-b transition-colors hover:bg-muted/30">
        {checkboxCell}
        <td className="px-4 py-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {hasSteps && (
                <button
                  type="button"
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors hover:bg-muted"
                  onClick={() => setStepsExpanded(!stepsExpanded)}
                  aria-label={stepsExpanded ? 'Collapse steps' : 'Expand steps'}
                >
                  {stepsExpanded
                    ? <ChevronDown className="size-3.5" />
                    : <ChevronRight className="size-3.5" />
                  }
                </button>
              )}
              <span className="text-[13px] font-medium">{tc.title}</span>
              {hasSteps && (
                <Badge variant="outline" className="h-[18px] px-1.5 text-[10px]">
                  {tc.steps!.length} step{tc.steps!.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn('h-[18px] px-1.5 text-[10px] font-semibold', PRIORITY_COLORS[tc.priority] ?? '')}>
                {tc.priority}
              </Badge>
              {tc.suite && (
                <span className="text-[11px] text-muted-foreground">{tc.suite.name}</span>
              )}
              <DefectBadge defects={defects} />
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <ResultStatusBadge status={currentStatus} />
            {latestResult?.statusOverride && (
              <span className="text-[10px] text-muted-foreground">(override)</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {statusButtons.map((btn) => (
              <Button
                key={btn.status}
                size="sm"
                className={cn(
                  'h-7 cursor-pointer px-2.5 text-xs font-medium',
                  btn.activeClass,
                )}
                disabled={isPending || disabled}
                onClick={() => handleStatusClick(btn.status)}
              >
                {btn.label}
              </Button>
            ))}
            {isFailed && latestResult && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 cursor-pointer gap-1 border-red-300 px-2 text-xs text-red-700 hover:bg-red-50"
                disabled={disabled}
                onClick={() => setDefectDialogOpen(true)}
              >
                <Bug className="size-3" />
                Bug
              </Button>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={handleCommentBlur}
            rows={1}
            className="min-h-[32px] resize-none text-[13px]"
            disabled={disabled}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Timer className="size-3.5 text-muted-foreground" />
            <span className="min-w-[40px] font-mono text-[13px]">{formatTime(elapsed)}</span>
            <Button
              size="sm"
              variant={isTimerRunning ? 'destructive' : 'outline'}
              className="h-6 cursor-pointer px-2 text-[10px]"
              onClick={toggleTimer}
              disabled={disabled}
            >
              {isTimerRunning ? 'Stop' : 'Start'}
            </Button>
          </div>
        </td>
      </tr>

      {hasSteps && stepsExpanded && (
        <tr>
          <td colSpan={checkboxCell ? 7 : 6} className="border-b bg-muted/20 px-6 py-4">
            <StepResultsPanel
              steps={tc.steps!}
              existingStepResults={latestResult?.stepResults}
              onSubmitSteps={handleStepSubmit}
              isPending={isPending}
              disabled={disabled}
            />
          </td>
        </tr>
      )}

      {defectDialogOpen && (
        <CreateDefectDialog
          open={defectDialogOpen}
          onOpenChange={setDefectDialogOpen}
          testRunCase={testRunCase}
          runName={runName}
          onSubmit={onCreateDefect}
          isPending={isDefectPending}
        />
      )}
    </>
  );
}
