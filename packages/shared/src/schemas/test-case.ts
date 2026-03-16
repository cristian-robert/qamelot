import { z } from 'zod';
import { CasePriority, CaseType, TemplateType } from '../types/index';

// ── Step schemas ──

export const CreateTestCaseStepSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or less'),
  expectedResult: z
    .string()
    .min(1, 'Expected result is required')
    .max(5000, 'Expected result must be 5000 characters or less'),
});

export const UpdateTestCaseStepSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or less')
    .optional(),
  expectedResult: z
    .string()
    .min(1, 'Expected result is required')
    .max(5000, 'Expected result must be 5000 characters or less')
    .optional(),
});

export const ReorderStepsSchema = z.object({
  stepIds: z
    .array(z.string().min(1))
    .min(1, 'At least one step ID is required'),
});

// ── Case schemas ──

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
  templateType: z.nativeEnum(TemplateType).optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  type: z.nativeEnum(CaseType).optional(),
  estimate: z.number().int().min(0).nullable().optional(),
  references: z
    .string()
    .max(1000, 'References must be 1000 characters or less')
    .nullable()
    .optional(),
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
  templateType: z.nativeEnum(TemplateType).optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  type: z.nativeEnum(CaseType).optional(),
  estimate: z.number().int().min(0).nullable().optional(),
  references: z
    .string()
    .max(1000, 'References must be 1000 characters or less')
    .nullable()
    .optional(),
});

export const CopyMoveTestCaseSchema = z.object({
  targetSuiteId: z.string().min(1, 'Target suite ID is required'),
});

export type CreateTestCaseInput = z.infer<typeof CreateTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof UpdateTestCaseSchema>;
export type CreateTestCaseStepInput = z.infer<typeof CreateTestCaseStepSchema>;
export type UpdateTestCaseStepInput = z.infer<typeof UpdateTestCaseStepSchema>;
export type ReorderStepsInput = z.infer<typeof ReorderStepsSchema>;
export type CopyMoveTestCaseInput = z.infer<typeof CopyMoveTestCaseSchema>;
