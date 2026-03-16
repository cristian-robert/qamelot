'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InviteUserSchema, type InviteUserInput, Role } from '@app/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: InviteUserInput) => void;
  isPending: boolean;
  error: Error | null;
  temporaryPassword: string | null;
}

const ROLE_OPTIONS = [Role.ADMIN, Role.LEAD, Role.TESTER, Role.VIEWER] as const;

export function InviteUserDialog({
  open,
  onOpenChange,
  onInvite,
  isPending,
  error,
  temporaryPassword,
}: InviteUserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues: { role: 'TESTER' },
  });

  function onSubmit(data: InviteUserInput) {
    onInvite(data);
  }

  function handleClose() {
    onOpenChange(false);
    reset();
  }

  if (temporaryPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Invited</DialogTitle>
            <DialogDescription>
              Share this temporary password with the new user. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted p-3 font-mono text-sm select-all">
            {temporaryPassword}
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Create a new user account with a temporary password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              {...register('email')}
              placeholder="user@example.com"
              autoFocus
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="invite-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="invite-name"
              type="text"
              {...register('name')}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="invite-role"
              {...register('role')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Inviting...' : 'Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
