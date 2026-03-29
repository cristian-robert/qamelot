'use client';

import { useQuery } from '@tanstack/react-query';
import type { Permission } from '@app/shared';
import { authApi } from '@/lib/api/auth';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ['auth', 'permissions'],
    queryFn: authApi.permissions,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  function hasPermission(...required: Permission[]): boolean {
    return required.every((p) => permissions.includes(p));
  }

  function hasAnyPermission(...required: Permission[]): boolean {
    return required.some((p) => permissions.includes(p));
  }

  return { permissions, isLoading, hasPermission, hasAnyPermission };
}
