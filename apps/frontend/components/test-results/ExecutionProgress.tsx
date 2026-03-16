import { Progress } from '@/components/ui/progress';
import type { TestRunResultSummary } from '@app/shared';

interface ExecutionProgressProps {
  summary: TestRunResultSummary;
}

const statusSegments = [
  { key: 'passed', label: 'Passed', dotClass: 'bg-green-500', textClass: 'text-green-700' },
  { key: 'failed', label: 'Failed', dotClass: 'bg-red-500', textClass: 'text-red-700' },
  { key: 'blocked', label: 'Blocked', dotClass: 'bg-yellow-500', textClass: 'text-yellow-700' },
  { key: 'retest', label: 'Retest', dotClass: 'bg-blue-500', textClass: 'text-blue-700' },
  { key: 'untested', label: 'Untested', dotClass: 'bg-gray-300', textClass: 'text-gray-500' },
] as const;

export function ExecutionProgress({ summary }: ExecutionProgressProps) {
  const completed = summary.total - summary.untested;
  const percent = summary.total > 0 ? Math.round((completed / summary.total) * 100) : 0;
  const passRate = completed > 0 ? Math.round((summary.passed / completed) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">
          Progress: {completed}/{summary.total} ({percent}%)
        </span>
        {completed > 0 && (
          <span className="text-[13px] text-muted-foreground">Pass rate: {passRate}%</span>
        )}
      </div>

      <Progress value={percent} className="h-2.5" />

      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {statusSegments.map((seg) => {
          const count = summary[seg.key];
          return (
            <div key={seg.key} className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${seg.dotClass}`} />
              <span className={`text-xs font-medium ${seg.textClass}`}>
                {count} {seg.label.toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
