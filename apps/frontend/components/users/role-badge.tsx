import { Role } from '@app/shared';
import { Badge } from '@/components/ui/badge';

const ROLE_VARIANT: Record<Role, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [Role.ADMIN]: 'default',
  [Role.LEAD]: 'secondary',
  [Role.TESTER]: 'outline',
  [Role.VIEWER]: 'outline',
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={ROLE_VARIANT[role]}>{role}</Badge>;
}
