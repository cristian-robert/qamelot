'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InviteUserInput, UpdateRoleInput } from '@app/shared';
import { usersApi } from '../api/users';

export const USERS_QUERY_KEY = ['users'] as const;

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: usersApi.list,
  });

  const inviteUser = useMutation({
    mutationFn: (data: InviteUserInput) => usersApi.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      usersApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const deactivateUser = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  return {
    users: users ?? [],
    isLoading,
    error,
    inviteUser,
    updateRole,
    deactivateUser,
  };
}
