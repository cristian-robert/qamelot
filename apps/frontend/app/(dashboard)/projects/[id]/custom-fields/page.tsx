'use client';

import { use, useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { CustomFieldType } from '@app/shared';
import type { CustomFieldDefinitionDto } from '@app/shared';
import { useProject } from '@/lib/projects/useProjects';
import {
  useCustomFieldDefinitions,
  useDeleteCustomFieldDefinition,
} from '@/lib/custom-fields/useCustomFields';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CustomFieldFormDialog } from './CustomFieldFormDialog';

const fieldTypeLabels: Record<string, string> = {
  [CustomFieldType.STRING]: 'Text',
  [CustomFieldType.NUMBER]: 'Number',
  [CustomFieldType.DROPDOWN]: 'Dropdown',
  [CustomFieldType.CHECKBOX]: 'Checkbox',
  [CustomFieldType.DATE]: 'Date',
};

export default function CustomFieldsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: definitions, isLoading, isError, refetch } = useCustomFieldDefinitions(projectId);
  const deleteDefinition = useDeleteCustomFieldDefinition(projectId);

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomFieldDefinitionDto | null>(null);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? '...', href: `/projects/${projectId}` },
          { label: 'Custom Fields' },
        ]}
      />

      <PageHeader
        title="Custom Fields"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New Field
          </Button>
        }
      />

      <CustomFieldFormDialog
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : definitions?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Options</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {definitions.map((def: CustomFieldDefinitionDto) => (
              <TableRow key={def.id}>
                <TableCell className="font-medium">{def.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{fieldTypeLabels[def.fieldType] ?? def.fieldType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {def.entityType.replace('_', ' ')}
                </TableCell>
                <TableCell>{def.required ? 'Yes' : 'No'}</TableCell>
                <TableCell className="max-w-xs">
                  {def.options?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {def.options.map((opt) => (
                        <Badge key={opt} variant="secondary" className="text-xs">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{'\u2014'}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(def)}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={SlidersHorizontal}
          title="No custom fields defined"
          description="Add fields to extend your test data."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New Field
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Custom Field"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteDefinition.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        loading={deleteDefinition.isPending}
      />
    </div>
  );
}
