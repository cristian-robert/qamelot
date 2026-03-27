import { TestResultStatus } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusBadgeStyles } from '@/lib/constants';

export function ResultStatusBadge({ status }: { status: TestResultStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', statusBadgeStyles[status])}>
      {status}
    </Badge>
  );
}
