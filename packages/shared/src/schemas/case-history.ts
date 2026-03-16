import { z } from 'zod';

export const CaseHistorySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  userId: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  field: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  createdAt: z.string(),
});

export type CaseHistoryOutput = z.infer<typeof CaseHistorySchema>;
