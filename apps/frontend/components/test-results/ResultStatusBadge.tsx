import { Badge } from '@/components/ui/badge';
import { TestResultStatus } from '@app/shared';

const statusConfig: Record<TestResultStatus, { label: string; className: string; dotClass: string }> = {
  [TestResultStatus.PASSED]: {
    label: 'Passed',
    className: 'bg-green-50 text-green-800 border-green-200 hover:bg-green-50',
    dotClass: 'bg-green-500',
  },
  [TestResultStatus.FAILED]: {
    label: 'Failed',
    className: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-50',
    dotClass: 'bg-red-500',
  },
  [TestResultStatus.BLOCKED]: {
    label: 'Blocked',
    className: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-50',
    dotClass: 'bg-yellow-500',
  },
  [TestResultStatus.RETEST]: {
    label: 'Retest',
    className: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-50',
    dotClass: 'bg-blue-500',
  },
  [TestResultStatus.UNTESTED]: {
    label: 'Untested',
    className: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50',
    dotClass: 'bg-gray-400',
  },
};

interface ResultStatusBadgeProps {
  status: TestResultStatus;
}

export function ResultStatusBadge({ status }: ResultStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`gap-1.5 font-semibold ${config.className}`}>
      <span className={`inline-block size-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </Badge>
  );
}
