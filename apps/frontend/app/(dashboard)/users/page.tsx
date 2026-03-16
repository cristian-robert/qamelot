'use client';

import { useState } from 'react';
import { Role, type InviteUserInput } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { useUsers } from '@/lib/users/useUsers';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';
import { UserRow } from '@/components/users/user-row';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, error, inviteUser, updateRole, deactivateUser } = useUsers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const isAdmin = currentUser?.role === Role.ADMIN;

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  function handleInvite(data: InviteUserInput) {
    inviteUser.mutate(data, {
      onSuccess: (result) => {
        setTempPassword(
          (result as unknown as { temporaryPassword: string }).temporaryPassword,
        );
      },
    });
  }

  function handleRoleChange(userId: string, role: Role) {
    updateRole.mutate({ id: userId, data: { role } });
  }

  function handleDeactivate(userId: string) {
    deactivateUser.mutate(userId);
  }

  function handleDialogClose(open: boolean) {
    setInviteOpen(open);
    if (!open) {
      setTempPassword(null);
      inviteUser.reset();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load users'}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                onRoleChange={handleRoleChange}
                onDeactivate={handleDeactivate}
                isUpdating={updateRole.isPending || deactivateUser.isPending}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={handleDialogClose}
        onInvite={handleInvite}
        isPending={inviteUser.isPending}
        error={inviteUser.error instanceof Error ? inviteUser.error : null}
        temporaryPassword={tempPassword}
      />
    </div>
  );
}
