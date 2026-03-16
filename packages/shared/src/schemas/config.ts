import { z } from 'zod';

export const CreateConfigGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
});

export const UpdateConfigGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
});

export const CreateConfigItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
});

export const UpdateConfigItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
});

export const CreateMatrixRunsSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  assignedToId: z.string().min(1).optional(),
  caseIds: z
    .array(z.string().min(1))
    .min(1, 'At least one case must be selected'),
  configItemIds: z
    .array(z.array(z.string().min(1)).min(1))
    .min(1, 'At least one configuration combination is required'),
});

export type CreateConfigGroupInput = z.infer<typeof CreateConfigGroupSchema>;
export type UpdateConfigGroupInput = z.infer<typeof UpdateConfigGroupSchema>;
export type CreateConfigItemInput = z.infer<typeof CreateConfigItemSchema>;
export type UpdateConfigItemInput = z.infer<typeof UpdateConfigItemSchema>;
export type CreateMatrixRunsInput = z.infer<typeof CreateMatrixRunsSchema>;
