import type { AttachmentDto, AttachmentEntityType } from '@app/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5002';

export const attachmentsApi = {
  upload: async (file: File, entityType: AttachmentEntityType, entityId: string): Promise<AttachmentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    const res = await fetch(`${BASE}/attachments`, { method: 'POST', credentials: 'include', body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<AttachmentDto>;
  },
  listByEntity: (entityType: AttachmentEntityType, entityId: string) =>
    fetch(`${BASE}/attachments/entity/${entityType}/${entityId}`, { credentials: 'include' }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<AttachmentDto[]>;
    }),
  getDownloadUrl: (id: string) => `${BASE}/attachments/${id}/download`,
  remove: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/attachments/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
    }
  },
};
