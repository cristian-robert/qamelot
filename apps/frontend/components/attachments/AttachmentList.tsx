'use client';

import { Download, Trash2, FileIcon } from 'lucide-react';
import type { AttachmentDto } from '@app/shared';
import { attachmentsApi } from '@/lib/api/attachments';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';

interface AttachmentListProps {
  attachments: AttachmentDto[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ attachments, onDelete, isDeleting }: AttachmentListProps) {
  if (!attachments.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No attachments yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-3 rounded-md border px-3 py-2"
        >
          <FileIcon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
              {' \u00B7 '}
              {attachment.uploadedBy.name}
              {' \u00B7 '}
              {formatDate(attachment.createdAt)}
            </p>
          </div>
          <a
            href={attachmentsApi.getDownloadUrl(attachment.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon-xs">
              <Download className="size-3.5" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(attachment.id)}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
