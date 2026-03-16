'use client';

import { Role, type UserDto } from '@app/shared';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RoleBadge } from './role-badge';

const ROLE_OPTIONS = [Role.ADMIN, Role.LEAD, Role.TESTER, Role.VIEWER] as const;

interface UserRowProps {
  user: UserDto;
  currentUserId: string | undefined;
  onRoleChange: (userId: string, role: Role) => void;
  onDeactivate: (userId: string) => void;
  isUpdating: boolean;
}

export function UserRow({
  user,
  currentUserId,
  onRoleChange,
  onDeactivate,
  isUpdating,
}: UserRowProps) {
  const isSelf = user.id === currentUserId;

  return (
    <TableRow>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        {isSelf ? (
          <RoleBadge role={user.role} />
        ) : (
          <select
            aria-label={`Change role for ${user.name}`}
            value={user.role}
            onChange={(e) => onRoleChange(user.id, e.target.value as Role)}
            disabled={isUpdating}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      </TableCell>
      <TableCell>
        {!isSelf && (
          <Button
            variant="destructive"
            size="sm"
            disabled={isUpdating}
            onClick={() => onDeactivate(user.id)}
          >
            Deactivate
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
