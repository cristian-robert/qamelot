import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/log',
  'application/json',
  'application/xml',
  'text/xml',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const AttachmentEntityTypeSchema = z.enum(['TEST_CASE', 'TEST_RESULT']);

export const UploadAttachmentSchema = z.object({
  entityType: AttachmentEntityTypeSchema,
  entityId: z.string().min(1, 'Entity ID is required'),
});

export type UploadAttachmentInput = z.infer<typeof UploadAttachmentSchema>;
