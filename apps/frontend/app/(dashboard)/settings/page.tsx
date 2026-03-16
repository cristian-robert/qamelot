'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileSchema, type UpdateProfileInput } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { useProfile } from '@/lib/users/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoleBadge } from '@/components/users/role-badge';

export default function SettingsPage() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  function onSubmit(data: UpdateProfileInput) {
    const payload: UpdateProfileInput = {};
    if (data.name && data.name !== user?.name) payload.name = data.name;
    if (data.newPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
    }

    if (Object.keys(payload).length === 0) return;

    updateProfile.mutate(payload, {
      onSuccess: () => reset({ name: payload.name ?? user?.name ?? '' }),
    });
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Profile Settings</h1>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="text-sm font-medium">{user.email}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Role</p>
        <RoleBadge role={user.role} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="settings-name" className="text-sm font-medium">
            Display Name
          </label>
          <Input
            id="settings-name"
            type="text"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <hr className="border-border" />

        <p className="text-sm font-medium">Change Password</p>

        <div className="space-y-1">
          <label htmlFor="settings-current-pw" className="text-sm font-medium">
            Current Password
          </label>
          <Input
            id="settings-current-pw"
            type="password"
            {...register('currentPassword')}
            placeholder="Enter current password"
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="settings-new-pw" className="text-sm font-medium">
            New Password
          </label>
          <Input
            id="settings-new-pw"
            type="password"
            {...register('newPassword')}
            placeholder="At least 8 characters"
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        {updateProfile.error && (
          <p className="text-sm text-destructive">
            {updateProfile.error instanceof Error
              ? updateProfile.error.message
              : 'Failed to update profile'}
          </p>
        )}

        {updateProfile.isSuccess && (
          <p className="text-sm text-green-600">Profile updated successfully.</p>
        )}

        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
