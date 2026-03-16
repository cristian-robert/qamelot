'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ResultStatusBadge } from './ResultStatusBadge';
import { DefectBadge } from './DefectBadge';
import { CreateDefectDialog } from './CreateDefectDialog';
import { TestResultStatus } from '@app/shared';
import type { TestRunCaseWithResultDto, CreateDefectInput, DefectDto } from '@app/shared';

const statusButtons: Array<{
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'RETEST';
  label: string;
  className: string;
}> = [
  { status: 'PASSED', label: 'Pass', className: 'bg-green-600 hover:bg-green-700 text-white' },
  { status: 'FAILED', label: 'Fail', className: 'bg-red-600 hover:bg-red-700 text-white' },
  { status: 'BLOCKED', label: 'Blocked', className: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
  { status: 'RETEST', label: 'Retest', className: 'bg-blue-600 hover:bg-blue-700 text-white' },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  LOW: 'bg-gray-100 text-gray-600',
};

interface CaseResultRowProps {
  testRunCase: TestRunCaseWithResultDto;
  runName: string;
  onSubmit: (testRunCaseId: string, status: string, comment?: string, elapsed?: number) => void;
  onUpdateComment: (resultId: string, comment: string) => void;
  onCreateDefect: (data: CreateDefectInput) => void;
  defects: DefectDto[];
  isPending: boolean;
  isDefectPending: boolean;
  disabled?: boolean;
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
}: CaseResultRowProps) {
  const latestResult = testRunCase.latestResult;
  const currentStatus = latestResult?.status ?? TestResultStatus.UNTESTED;
  const isFailed = currentStatus === TestResultStatus.FAILED;
  const [comment, setComment] = useState(latestResult?.comment ?? '');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(latestResult?.elapsed ?? 0);
  const [defectDialogOpen, setDefectDialogOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const tc = testRunCase.testCase;

  return (
    <>
      <tr className="border-b">
        <td className="px-4 py-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{tc.title}</span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={PRIORITY_COLORS[tc.priority] ?? ''}>
                {tc.priority}
              </Badge>
              {tc.suite && (
                <span className="text-xs text-muted-foreground">{tc.suite.name}</span>
              )}
              <DefectBadge defects={defects} />
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <ResultStatusBadge status={currentStatus} />
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {statusButtons.map((btn) => (
              <Button
                key={btn.status}
                size="sm"
                className={btn.className}
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
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={disabled}
                onClick={() => setDefectDialogOpen(true)}
              >
                Create Bug
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
            className="min-h-[36px] resize-none text-sm"
            disabled={disabled}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{formatTime(elapsed)}</span>
            <Button
              size="sm"
              variant={isTimerRunning ? 'destructive' : 'outline'}
              onClick={toggleTimer}
              disabled={disabled}
            >
              {isTimerRunning ? 'Stop' : 'Start'}
            </Button>
          </div>
        </td>
      </tr>

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
