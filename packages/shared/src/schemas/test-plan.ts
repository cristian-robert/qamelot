import { z } from 'zod';

export const CreateTestPlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
});

export const UpdateTestPlanSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

export type CreateTestPlanInput = z.infer<typeof CreateTestPlanSchema>;
export type UpdateTestPlanInput = z.infer<typeof UpdateTestPlanSchema>;
