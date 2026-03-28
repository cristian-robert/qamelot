'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Check, Key, Loader2 } from 'lucide-react';
import { UpdateProfileSchema } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { useUpdateProfile } from '@/lib/users/useProfile';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RoleBadge } from '@/components/users/role-badge';

export default function SettingsPage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [nameSuccess, setNameSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const nameForm = useForm<{ name: string }>({
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>({
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  function onNameSubmit(data: { name: string }) {
    if (!data.name.trim()) return;
    updateProfile.mutate(
      { name: data.name.trim() },
      {
        onSuccess: () => {
          setNameSuccess(true);
          setTimeout(() => setNameSuccess(false), 3000);
        },
      },
    );
  }

  function onPasswordSubmit(data: { currentPassword: string; newPassword: string }) {
    const parsed = UpdateProfileSchema.safeParse({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      if (firstError) {
        passwordForm.setError(
          firstError.path[0] as 'currentPassword' | 'newPassword',
          { message: firstError.message },
        );
      }
      return;
    }
    updateProfile.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          passwordForm.reset();
          setPasswordSuccess(true);
          setTimeout(() => setPasswordSuccess(false), 3000);
        },
        onError: (error) => {
          passwordForm.setError('currentPassword', { message: error.message });
        },
      },
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and account preferences"
      />

      <div className="grid gap-6 lg:max-w-2xl">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Role</Label>
                <div>
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Name */}
        <Card>
          <CardHeader>
            <CardTitle>Display Name</CardTitle>
            <CardDescription>Update your display name visible to team members</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="settings-name">Name</Label>
                <Input
                  id="settings-name"
                  placeholder="Your name"
                  {...nameForm.register('name')}
                />
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : nameSuccess ? (
                  <Check className="size-4" />
                ) : null}
                {nameSuccess ? 'Saved' : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min. 8 characters)"
                  {...passwordForm.register('newPassword')}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : passwordSuccess ? (
                    <Check className="size-4" />
                  ) : null}
                  {passwordSuccess ? 'Updated' : 'Update Password'}
                </Button>
                {passwordSuccess && (
                  <p className="text-sm text-status-passed">Password changed successfully.</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-4" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for Playwright automation integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/api-keys">
              <Button variant="outline">Manage API Keys</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
