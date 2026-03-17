import { z } from 'zod';

export const CreateAutomationRunSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  name: z.string().min(1).max(200, 'Run name must be under 200 characters'),
  automationIds: z
    .array(z.string().min(1))
    .min(1, 'At least one automation ID required')
    .max(5000, 'Cannot exceed 5000 tests per run'),
  ciJobUrl: z.string().url().max(2000).optional(),
});

export type CreateAutomationRunInput = z.infer<typeof CreateAutomationRunSchema>;

export const SubmitAutomationResultSchema = z.object({
  automationId: z.string().min(1, 'Automation ID is required'),
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED']),
  duration: z.number().int().min(0).optional(),
  error: z.string().max(10000).optional(),
  log: z.string().max(50000).optional(),
  retryCount: z.number().int().min(0).default(0),
});

export type SubmitAutomationResultInput = z.infer<typeof SubmitAutomationResultSchema>;

export const BulkSubmitAutomationResultsSchema = z.object({
  results: z
    .array(SubmitAutomationResultSchema)
    .min(1)
    .max(1000, 'Cannot submit more than 1000 results at once'),
});

export type BulkSubmitAutomationResultsInput = z.infer<typeof BulkSubmitAutomationResultsSchema>;

export const SyncAutomationTestsSchema = z.object({
  projectId: z.string().min(1),
  tests: z
    .array(
      z.object({
        automationId: z.string().min(1).max(500),
        title: z.string().min(1).max(300),
        filePath: z.string().min(1).max(500),
      }),
    )
    .min(1)
    .max(10000),
});

export type SyncAutomationTestsInput = z.infer<typeof SyncAutomationTestsSchema>;
