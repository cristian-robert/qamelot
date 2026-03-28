import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', className)}>
      {label}
    </Badge>
  );
}
