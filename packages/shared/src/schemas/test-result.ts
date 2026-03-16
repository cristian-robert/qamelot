import { z } from 'zod';

const StepResultSchema = z.object({
  testCaseStepId: z.string().min(1, 'Test case step ID is required'),
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'UNTESTED']),
  actualResult: z
    .string()
    .max(5000, 'Actual result must be 5000 characters or less')
    .optional(),
});

export const SubmitTestResultSchema = z.object({
  testRunCaseId: z.string().min(1, 'Test run case ID is required'),
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'RETEST']),
  statusOverride: z.boolean().optional(),
  comment: z
    .string()
    .max(2000, 'Comment must be 2000 characters or less')
    .optional(),
  elapsed: z
    .number()
    .int()
    .min(0, 'Elapsed time cannot be negative')
    .optional(),
  stepResults: z.array(StepResultSchema).optional(),
});

export const UpdateTestResultSchema = z.object({
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'UNTESTED']).optional(),
  statusOverride: z.boolean().optional(),
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
  stepResults: z.array(StepResultSchema).optional(),
});

export type StepResultInput = z.infer<typeof StepResultSchema>;

export const BulkSubmitTestResultsSchema = z.object({
  testRunCaseIds: z
    .array(z.string().min(1))
    .min(1, 'At least one test run case ID is required')
    .max(200, 'Cannot submit more than 200 results at once'),
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED', 'RETEST']),
  comment: z
    .string()
    .max(2000, 'Comment must be 2000 characters or less')
    .optional(),
});


export type SubmitTestResultInput = z.infer<typeof SubmitTestResultSchema>;
export type UpdateTestResultInput = z.infer<typeof UpdateTestResultSchema>;
export type BulkSubmitTestResultsInput = z.infer<typeof BulkSubmitTestResultsSchema>;
