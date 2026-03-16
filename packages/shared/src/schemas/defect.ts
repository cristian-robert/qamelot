import { z } from 'zod';

export const CreateDefectSchema = z.object({
  reference: z
    .string()
    .min(1, 'Reference is required')
    .max(500, 'Reference must be 500 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  testResultId: z
    .string()
    .min(1)
    .optional(),
});

export const UpdateDefectSchema = z.object({
  reference: z
    .string()
    .min(1, 'Reference is required')
    .max(500, 'Reference must be 500 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .nullable()
    .optional(),
});

export type CreateDefectInput = z.infer<typeof CreateDefectSchema>;
export type UpdateDefectInput = z.infer<typeof UpdateDefectSchema>;
