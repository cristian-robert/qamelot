'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth';
import type { LoginInput, RegisterInput } from '@app/shared';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: () => router.push('/login'),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      router.push('/login');
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
