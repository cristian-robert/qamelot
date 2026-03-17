import { Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DefectBadgeProps {
  reference: string;
  className?: string;
}

export function DefectBadge({ reference, className }: DefectBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold',
        className,
      )}
    >
      <Bug className="size-3" />
      {reference}
    </Badge>
  );
}
