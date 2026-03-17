'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import type { UserDto } from '@app/shared';
import { Role } from '@app/shared';
import { useUpdateUserRole, useDeleteUser } from '@/lib/users/useUsers';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RoleBadge } from './role-badge';

interface UserRowProps {
  user: UserDto;
  currentUserId: string | undefined;
}

export function UserRow({ user, currentUserId }: UserRowProps) {
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSelf = user.id === currentUserId;

  function handleRoleChange(role: Role) {
    updateRole.mutate({ id: user.id, data: { role } });
  }

  function handleDelete() {
    deleteUser.mutate(user.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell className="text-muted-foreground">{user.email}</TableCell>
        <TableCell>
          <RoleBadge role={user.role} />
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatDate(user.createdAt)}
        </TableCell>
        <TableCell className="text-right">
          {!isSelf && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                {Object.values(Role).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    disabled={role === user.role}
                    onClick={() => handleRoleChange(role)}
                  >
                    {role}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
