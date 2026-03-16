import { z } from 'zod';

export const SharedStepItemInputSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or less'),
  expectedResult: z
    .string()
    .min(1, 'Expected result is required')
    .max(5000, 'Expected result must be 5000 characters or less'),
});

export const CreateSharedStepSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be 300 characters or less'),
  items: z
    .array(SharedStepItemInputSchema)
    .min(1, 'At least one step item is required')
    .max(100, 'Maximum 100 step items allowed'),
});

export const UpdateSharedStepSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be 300 characters or less')
    .optional(),
  items: z
    .array(SharedStepItemInputSchema)
    .min(1, 'At least one step item is required')
    .max(100, 'Maximum 100 step items allowed')
    .optional(),
});

export type SharedStepItemInput = z.infer<typeof SharedStepItemInputSchema>;
export type CreateSharedStepInput = z.infer<typeof CreateSharedStepSchema>;
export type UpdateSharedStepInput = z.infer<typeof UpdateSharedStepSchema>;
