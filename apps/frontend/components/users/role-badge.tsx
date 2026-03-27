import { Role } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { roleBadgeStyles } from '@/lib/constants';

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', roleBadgeStyles[role])}>
      {role}
    </Badge>
  );
}
