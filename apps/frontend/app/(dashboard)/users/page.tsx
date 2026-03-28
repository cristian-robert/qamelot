'use client';

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { UserPlus, Users as UsersIcon } from 'lucide-react';
import type { UserDto } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { useUsers } from '@/lib/users/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
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
  const [page, setPage] = useState(1);
  const { data: response, isLoading, isError, refetch } = useUsers({ page, pageSize: 20 });
  const users = response?.data;
  const totalPages = response?.totalPages ?? 1;
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <PageHeader
        title="Users"
        subtitle="Manage team members and their roles"
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invite User
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
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
        <>
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={UsersIcon}
          title="No users yet"
          description="Invite your first team member to get started."
          action={
            <Button variant="outline" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite User
            </Button>
          }
        />
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
