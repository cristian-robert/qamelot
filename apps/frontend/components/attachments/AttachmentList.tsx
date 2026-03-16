'use client';

import { FileText, Download, Trash2, Loader2 } from 'lucide-react';
import type { AttachmentDto } from '@app/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { attachmentsApi } from '@/lib/api/attachments';

interface AttachmentListProps {
  attachments: AttachmentDto[];
  onDelete?: (id: string) => void;
  isDeleting?: string | null;
  className?: string;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ attachments, onDelete, isDeleting, className }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-muted-foreground">
        Attachments ({attachments.length})
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
          >
            {isImage(att.mimeType) ? (
              <a
                href={attachmentsApi.getDownloadUrl(att.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="block shrink-0 overflow-hidden rounded-md"
              >
                <img
                  src={attachmentsApi.getDownloadUrl(att.id)}
                  alt={att.filename}
                  className="size-12 object-cover"
                />
              </a>
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={att.filename}>
                {att.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatSize(att.size)} &middot; {att.uploadedBy.name}
              </p>
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <a
                href={attachmentsApi.getDownloadUrl(att.id)}
                download={att.filename}
                title="Download"
                className="inline-flex size-6 items-center justify-center rounded-md hover:bg-muted"
              >
                <Download className="size-3.5" />
              </a>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(att.id)}
                  disabled={isDeleting === att.id}
                  title="Delete"
                >
                  {isDeleting === att.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
