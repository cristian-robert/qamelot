import { Progress } from '@/components/ui/progress';
import type { TestRunResultSummary } from '@app/shared';

interface ExecutionProgressProps {
  summary: TestRunResultSummary;
}

export function ExecutionProgress({ summary }: ExecutionProgressProps) {
  const completed = summary.total - summary.untested;
  const percent = summary.total > 0 ? Math.round((completed / summary.total) * 100) : 0;
  const passRate = completed > 0 ? Math.round((summary.passed / completed) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Progress: {completed}/{summary.total} ({percent}%)
        </span>
        {completed > 0 && (
          <span className="text-muted-foreground">Pass rate: {passRate}%</span>
        )}
      </div>
      <Progress value={percent} className="h-2" />
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="text-green-700">{summary.passed} passed</span>
        <span className="text-red-700">{summary.failed} failed</span>
        <span className="text-yellow-700">{summary.blocked} blocked</span>
        <span className="text-blue-700">{summary.retest} retest</span>
        <span className="text-gray-500">{summary.untested} untested</span>
      </div>
    </div>
  );
}
