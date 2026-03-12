'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { RegisterSchema, type RegisterInput } from '@app/shared';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  return (
    <div className="w-full max-w-sm space-y-6 p-8 rounded-lg border bg-card shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">Fill in your details to get started</p>
      </div>

      <form onSubmit={handleSubmit((data) => registerUser.mutate(data))} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Alice Smith"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Min. 8 characters"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {registerUser.error && (
          <p className="text-sm text-destructive">{(registerUser.error as Error).message}</p>
        )}

        <Button type="submit" className="w-full" disabled={registerUser.isPending}>
          {registerUser.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
