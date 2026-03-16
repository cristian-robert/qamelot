import { z } from 'zod';

export const SubmitTestResultSchema = z.object({
  testRunCaseId: z.string().min(1, 'Test run case ID is required'),
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'RETEST']),
  comment: z
    .string()
    .max(2000, 'Comment must be 2000 characters or less')
    .optional(),
  elapsed: z
    .number()
    .int()
    .min(0, 'Elapsed time cannot be negative')
    .optional(),
});

export const UpdateTestResultSchema = z.object({
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'UNTESTED']).optional(),
  comment: z
    .string()
    .max(2000, 'Comment must be 2000 characters or less')
    .nullable()
    .optional(),
  elapsed: z
    .number()
    .int()
    .min(0, 'Elapsed time cannot be negative')
    .nullable()
    .optional(),
});

export type SubmitTestResultInput = z.infer<typeof SubmitTestResultSchema>;
export type UpdateTestResultInput = z.infer<typeof UpdateTestResultSchema>;
