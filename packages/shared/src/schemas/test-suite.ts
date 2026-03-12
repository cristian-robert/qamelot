import { z } from 'zod';

export const CreateTestSuiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  parentId: z.string().optional(),
});

export const UpdateTestSuiteSchema = z.object({
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
  parentId: z.string().nullable().optional(),
});

export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteSchema>;
export type UpdateTestSuiteInput = z.infer<typeof UpdateTestSuiteSchema>;
