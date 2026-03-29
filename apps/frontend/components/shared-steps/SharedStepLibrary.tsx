'use client';

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { Pencil, Trash2, ListOrdered, ChevronDown, ChevronRight } from 'lucide-react';
import type { SharedStepWithItemsDto, CreateSharedStepInput } from '@app/shared';
import {
  useSharedSteps,
  useCreateSharedStep,
  useUpdateSharedStep,
  useDeleteSharedStep,
} from '@/lib/shared-steps/useSharedSteps';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SharedStepFormDialog } from './SharedStepFormDialog';

interface SharedStepLibraryProps {
  projectId: string;
  onCreateClick?: () => void;
}

export function SharedStepLibrary({ projectId, onCreateClick }: SharedStepLibraryProps) {
  const [page, setPage] = useState(1);
  const { data: response, isLoading, isError, refetch } = useSharedSteps(projectId, { page, pageSize: 20 });
  const steps = response?.data;
  const totalPages = response?.totalPages ?? 1;
  const createStep = useCreateSharedStep(projectId);
  const updateStep = useUpdateSharedStep(projectId);
  const deleteStep = useDeleteSharedStep(projectId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SharedStepWithItemsDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SharedStepWithItemsDto | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate(data: CreateSharedStepInput) {
    createStep.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  }

  function handleEdit(step: SharedStepWithItemsDto) {
    setEditing(step);
    setFormOpen(true);
  }

  function handleUpdate(data: CreateSharedStepInput) {
    if (!editing) return;
    updateStep.mutate(
      { id: editing.id, data },
      { onSuccess: () => { setFormOpen(false); setEditing(null); } },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteStep.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {steps?.length ? (
        <div className="space-y-3">
          {steps.map((step: SharedStepWithItemsDto) => {
            const isExpanded = expandedIds.has(step.id);
            return (
              <Card key={step.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggleExpanded(step.id)}
                    >
                      {isExpanded
                        ? <ChevronDown className="size-4" />
                        : <ChevronRight className="size-4" />}
                    </Button>
                    <CardTitle className="flex-1 text-sm">{step.title}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {step.items.length} step{step.items.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleEdit(step)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteTarget(step)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2">
                      {step.items
                        .sort((a, b) => a.stepNumber - b.stepNumber)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 rounded-md border px-3 py-2 text-sm"
                          >
                            <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                              {item.stepNumber}.
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p>{item.description}</p>
                              {item.expectedResult && (
                                <p className="text-xs text-muted-foreground">
                                  Expected: {item.expectedResult}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : (
        <EmptyState
          icon={ListOrdered}
          title="No shared steps yet"
          description="Create reusable step groups for your test cases."
          action={
            onCreateClick ? (
              <Button variant="outline" onClick={onCreateClick}>
                New Shared Step
              </Button>
            ) : undefined
          }
        />
      )}

      <SharedStepFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
        isPending={editing ? updateStep.isPending : createStep.isPending}
        error={editing ? updateStep.error : createStep.error}
        editingStep={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shared Step</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteStep.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStep.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
