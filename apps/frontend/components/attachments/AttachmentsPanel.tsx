'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Paperclip } from 'lucide-react';
import type { AttachmentEntityType } from '@app/shared';
import { attachmentsApi } from '@/lib/api/attachments';
import { FileUploadZone } from './FileUploadZone';
import { AttachmentList } from './AttachmentList';
import { cn } from '@/lib/utils';

interface AttachmentsPanelProps {
  entityType: AttachmentEntityType;
  entityId: string;
  className?: string;
}

export function AttachmentsPanel({ entityType, entityId, className }: AttachmentsPanelProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryKey = ['attachments', entityType, entityId];

  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => attachmentsApi.listByEntity(entityType, entityId),
    enabled: !!entityId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(file, entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      for (const file of files) {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation],
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Paperclip className="size-4" />
        Attachments
        {isLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      <FileUploadZone
        onFilesSelected={handleFilesSelected}
        disabled={uploadMutation.isPending}
      />

      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Uploading...
        </div>
      )}

      {uploadMutation.isError && (
        <p className="text-sm text-destructive">
          Upload failed: {uploadMutation.error.message}
        </p>
      )}

      <AttachmentList
        attachments={attachments}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeleting={deletingId}
      />
    </div>
  );
}
