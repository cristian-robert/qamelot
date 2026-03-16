import { z } from 'zod';

export const CreateTestRunSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  assignedToId: z.string().min(1).optional(),
  caseIds: z
    .array(z.string().min(1))
    .min(1, 'At least one case must be selected'),
});

export const UpdateTestRunSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  assignedToId: z.string().min(1).nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

export type CreateTestRunInput = z.infer<typeof CreateTestRunSchema>;
export type UpdateTestRunInput = z.infer<typeof UpdateTestRunSchema>;
