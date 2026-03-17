'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InviteUserInput, UpdateRoleInput } from '@app/shared';
import { usersApi } from '@/lib/api/users';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteUserInput) => usersApi.invite(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      usersApi.updateRole(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
