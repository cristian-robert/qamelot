'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { UserDto, LoginInput, RegisterInput } from '@app/shared';
import { authApi } from '@/lib/api/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading, error } = useQuery<UserDto>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      router.push('/dashboard');
    },
  });

  const register = useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data);
      router.push('/dashboard');
    },
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });

  return { user: user ?? null, isLoading, error, login, register, logout };
}
