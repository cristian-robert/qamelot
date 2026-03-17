'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterInput } from '@app/shared';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const { register: registerMutation } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: RegisterInput) => registerMutation.mutate(data);

  return (
    <div className="animate-in rounded-xl border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Create account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your Qamelot account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {registerMutation.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {registerMutation.error.message}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
