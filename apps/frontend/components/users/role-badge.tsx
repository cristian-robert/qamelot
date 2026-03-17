import { Role } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const roleStyles: Record<Role, string> = {
  [Role.ADMIN]: 'bg-purple-50 text-purple-700 border-purple-200',
  [Role.LEAD]: 'bg-blue-50 text-blue-700 border-blue-200',
  [Role.TESTER]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [Role.VIEWER]: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-semibold uppercase', roleStyles[role])}>
      {role}
    </Badge>
  );
}
