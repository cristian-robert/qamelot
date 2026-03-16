import { z } from 'zod';

const RoleEnum = z.enum(['ADMIN', 'LEAD', 'TESTER', 'VIEWER']);

export const UpdateRoleSchema = z.object({
  role: RoleEnum,
});

export const InviteUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: RoleEnum,
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  },
  { message: 'Current password is required when setting a new password', path: ['currentPassword'] },
);

export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
