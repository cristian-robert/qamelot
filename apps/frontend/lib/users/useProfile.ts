'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileInput } from '@app/shared';
import { usersApi } from '@/lib/api/users';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
