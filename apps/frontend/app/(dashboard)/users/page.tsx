'use client';

import { useState } from 'react';
import { UserPlus, Users as UsersIcon } from 'lucide-react';
import type { UserDto } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { useUsers } from '@/lib/users/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InviteUserDialog } from '@/components/users/invite-user-dialog';
import { UserRow } from '@/components/users/user-row';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage team members and their roles
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" />
          Invite User
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : users?.length ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: UserDto) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUser?.id}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <UsersIcon className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No users yet. Invite your first team member to get started.
          </p>
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invite User
          </Button>
        </div>
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
