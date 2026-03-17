import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  projectId: z.string().min(1, 'Project ID is required'),
  expiresAt: z.string().datetime().optional(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
