import { z } from 'zod';

export const MilestoneStatusEnum = z.enum(['OPEN', 'CLOSED']);

/** Accepts YYYY-MM-DD or full ISO-8601 and normalises to ISO string; empty → undefined */
const dateField = z
  .string()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().optional());

export const CreateMilestoneSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  parentId: z.string().nullable().optional(),
  startDate: dateField.optional(),
  dueDate: dateField.optional(),
});

export const UpdateMilestoneSchema = z.object({
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
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: MilestoneStatusEnum.optional(),
});

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
