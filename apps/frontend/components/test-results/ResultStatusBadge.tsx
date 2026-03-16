import { Badge } from '@/components/ui/badge';
import { TestResultStatus } from '@app/shared';

const statusConfig: Record<TestResultStatus, { label: string; className: string }> = {
  [TestResultStatus.PASSED]: {
    label: 'Passed',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  [TestResultStatus.FAILED]: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  [TestResultStatus.BLOCKED]: {
    label: 'Blocked',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  [TestResultStatus.RETEST]: {
    label: 'Retest',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  [TestResultStatus.UNTESTED]: {
    label: 'Untested',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
};

interface ResultStatusBadgeProps {
  status: TestResultStatus;
}

export function ResultStatusBadge({ status }: ResultStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
