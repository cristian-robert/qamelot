'use client';

import { TestResultStatus } from '@app/shared';
import type { TestRunResultSummary } from '@app/shared';
import { cn } from '@/lib/utils';
import { statusDotStyles } from '@/lib/constants';

interface ExecutionProgressProps {
  summary: TestRunResultSummary;
}

export function ExecutionProgress({ summary }: ExecutionProgressProps) {
  const { total, passed, failed, blocked, untested } = summary;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const executed = total - untested;
  const executedPercent = total > 0 ? Math.round((executed / total) * 100) : 0;

  return (
    <div className="space-y-3 px-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">{executedPercent}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              passRate >= 80
                ? statusDotStyles[TestResultStatus.PASSED]
                : passRate >= 50
                  ? statusDotStyles[TestResultStatus.BLOCKED]
                  : passRate > 0
                    ? statusDotStyles[TestResultStatus.FAILED]
                    : 'bg-gray-300',
            )}
            style={{ width: `${executedPercent}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <StatItem label="Passed" count={passed} dotColor={statusDotStyles[TestResultStatus.PASSED]} />
        <StatItem label="Failed" count={failed} dotColor={statusDotStyles[TestResultStatus.FAILED]} />
        <StatItem label="Blocked" count={blocked} dotColor={statusDotStyles[TestResultStatus.BLOCKED]} />
        <StatItem label="Untested" count={untested} dotColor={statusDotStyles[TestResultStatus.UNTESTED]} />
      </div>
    </div>
  );
}

function StatItem({
  label,
  count,
  dotColor,
}: {
  label: string;
  count: number;
  dotColor: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', dotColor)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs font-semibold tabular-nums">{count}</span>
    </div>
  );
}
