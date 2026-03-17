'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check, UserPlus } from 'lucide-react';
import { InviteUserSchema, type InviteUserInput, Role } from '@app/shared';
import { useInviteUser } from '@/lib/users/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const inviteUser = useInviteUser();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues: { role: Role.TESTER },
  });

  const selectedRole = watch('role');

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setTemporaryPassword(null);
      setCopied(false);
      reset();
      inviteUser.reset();
    }
    onOpenChange(nextOpen);
  }

  function onSubmit(data: InviteUserInput) {
    inviteUser.mutate(data, {
      onSuccess: (result) => {
        setTemporaryPassword(result.temporaryPassword);
      },
    });
  }

  async function copyPassword() {
    if (!temporaryPassword) return;
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            {temporaryPassword
              ? 'User created successfully. Share the temporary password below.'
              : 'Send an invitation to a new team member.'}
          </DialogDescription>
        </DialogHeader>

        {temporaryPassword ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono">
                  {temporaryPassword}
                </code>
                <Button variant="outline" size="icon" onClick={copyPassword}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The user must change this password on first login.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                placeholder="Full name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@company.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setValue('role', val as InviteUserInput['role'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            {inviteUser.error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {inviteUser.error.message}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={inviteUser.isPending}>
                <UserPlus className="size-4" />
                {inviteUser.isPending ? 'Inviting...' : 'Invite'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
