'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user) router.replace('/dashboard');
    else router.replace('/login');
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
