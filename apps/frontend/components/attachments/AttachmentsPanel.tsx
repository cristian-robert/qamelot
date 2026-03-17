'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip } from 'lucide-react';
import type { AttachmentEntityType } from '@app/shared';
import { attachmentsApi } from '@/lib/api/attachments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileUploadZone } from './FileUploadZone';
import { AttachmentList } from './AttachmentList';

interface AttachmentsPanelProps {
  entityType: AttachmentEntityType;
  entityId: string;
}

export function AttachmentsPanel({ entityType, entityId }: AttachmentsPanelProps) {
  const queryClient = useQueryClient();
  const queryKey = ['attachments', entityType, entityId];

  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => attachmentsApi.listByEntity(entityType, entityId),
    enabled: !!entityId,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(file, entityType, entityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  async function handleUpload(file: File) {
    await uploadMutation.mutateAsync(file);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Paperclip className="size-4 text-muted-foreground" />
          Attachments
          {attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">({attachments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <FileUploadZone onUpload={handleUpload} disabled={uploadMutation.isPending} />

        {uploadMutation.error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {uploadMutation.error.message}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {attachments.length > 0 && <Separator />}
            <AttachmentList
              attachments={attachments}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
