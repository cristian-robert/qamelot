import { z } from 'zod';

export const TestCaseStepSchema = z.object({
  action: z.string().min(1, 'Action is required').max(5000, 'Action must be 5000 characters or less'),
  expected: z
    .string()
    .min(1, 'Expected result is required')
    .max(5000, 'Expected result must be 5000 characters or less'),
});

export const CreateTestCaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be 300 characters or less'),
  preconditions: z
    .string()
    .max(2000, 'Preconditions must be 2000 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  steps: z.array(TestCaseStepSchema).max(100, 'Maximum 100 steps allowed').optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY']).optional(),
  automationFlag: z.boolean().optional(),
});

export const UpdateTestCaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be 300 characters or less')
    .optional(),
  preconditions: z
    .string()
    .max(2000, 'Preconditions must be 2000 characters or less')
    .nullable()
    .optional(),
  steps: z.array(TestCaseStepSchema).max(100, 'Maximum 100 steps allowed').optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY']).optional(),
  automationFlag: z.boolean().optional(),
});

export type CreateTestCaseInput = z.infer<typeof CreateTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof UpdateTestCaseSchema>;
