'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDefects } from '@/lib/defects/useDefects';
import { DefectFormDialog } from '@/components/defects/DefectFormDialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import type { CreateDefectInput, DefectDto } from '@app/shared';

function DefectRow({
  defect,
  onDelete,
}: {
  defect: DefectDto;
  onDelete: (id: string) => void;
}) {
  const isUrl = defect.reference.startsWith('http://') || defect.reference.startsWith('https://');

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        {isUrl ? (
          <a
            href={defect.reference}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            {defect.reference}
          </a>
        ) : (
          <span className="font-medium">{defect.reference}</span>
        )}
        {defect.description && (
          <p className="mt-0.5 text-sm text-muted-foreground truncate">
            {defect.description}
          </p>
        )}
      </div>
      <Button size="sm" variant="destructive" onClick={() => onDelete(defect.id)}>
        Delete
      </Button>
    </div>
  );
}

export default function DefectsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { defects, isLoading, error, createDefect, deleteDefect } =
    useDefects(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (data: CreateDefectInput) => {
    createDefect.mutate(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleDelete = (defectId: string) => {
    if (window.confirm('Delete this defect reference?')) {
      deleteDefect.mutate(defectId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: 'Defects' },
      ]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Defects</h1>
        <Button onClick={() => setDialogOpen(true)}>New Defect</Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load defects'}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : defects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No defect references yet. Link external tickets to track issues.
        </p>
      ) : (
        <div className="space-y-2">
          {defects.map((defect) => (
            <DefectRow
              key={defect.id}
              defect={defect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <DefectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isPending={createDefect.isPending}
        title="Add Defect Reference"
      />
    </div>
  );
}
