'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileInput } from '@app/shared';
import { usersApi } from '../api/users';
import { AUTH_QUERY_KEY } from '../auth/useAuth';

export function useProfile() {
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileInput) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });

  return { updateProfile };
}
