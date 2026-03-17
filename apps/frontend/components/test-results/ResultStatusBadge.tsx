import { TestResultStatus } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [TestResultStatus.FAILED]: 'bg-red-50 text-red-700 border-red-200',
  [TestResultStatus.BLOCKED]: 'bg-amber-50 text-amber-700 border-amber-200',
  [TestResultStatus.RETEST]: 'bg-blue-50 text-blue-700 border-blue-200',
  [TestResultStatus.UNTESTED]: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function ResultStatusBadge({ status }: { status: TestResultStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', statusStyles[status])}>
      {status}
    </Badge>
  );
}
