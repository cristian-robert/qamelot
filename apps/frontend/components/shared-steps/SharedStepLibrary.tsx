'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type {
  SharedStepWithItemsDto,
  CreateSharedStepInput,
  TestCaseStep,
} from '@app/shared';
import { useSharedSteps } from '@/lib/shared-steps/useSharedSteps';
import { SharedStepFormDialog } from './SharedStepFormDialog';

interface SharedStepLibraryProps {
  projectId: string;
  onInsert: (steps: TestCaseStep[]) => void;
}

export function SharedStepLibrary({ projectId, onInsert }: SharedStepLibraryProps) {
  const {
    sharedSteps,
    isLoading,
    createSharedStep,
    updateSharedStep,
    deleteSharedStep,
  } = useSharedSteps(projectId);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    sharedStep?: SharedStepWithItemsDto;
  }>({ open: false, mode: 'create' });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = () => {
    setDialogState({ open: true, mode: 'create' });
  };

  const handleEdit = (sharedStep: SharedStepWithItemsDto) => {
    setDialogState({ open: true, mode: 'edit', sharedStep });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete shared step "${title}"?`)) {
      deleteSharedStep.mutate(id);
    }
  };

  const handleInsert = (sharedStep: SharedStepWithItemsDto) => {
    const steps: TestCaseStep[] = sharedStep.items.map((item) => ({
      action: `[Shared: ${sharedStep.title}] ${item.description}`,
      expected: item.expectedResult,
    }));
    onInsert(steps);
  };

  const handleDialogSubmit = (data: CreateSharedStepInput) => {
    if (dialogState.mode === 'create') {
      createSharedStep.mutate(data, {
        onSuccess: () => setDialogState({ open: false, mode: 'create' }),
      });
    } else if (dialogState.sharedStep) {
      updateSharedStep.mutate(
        { id: dialogState.sharedStep.id, data },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    }
  };

  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Shared Steps</h3>
        <Button size="sm" variant="ghost" onClick={handleCreate}>
          + New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="px-3 py-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : sharedSteps.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No shared steps yet.
          </p>
        ) : (
          <div className="divide-y">
            {sharedSteps.map((ss) => (
              <div key={ss.id} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex-1 text-left text-sm font-medium hover:text-emerald-700 transition-colors"
                    onClick={() => setExpandedId(expandedId === ss.id ? null : ss.id)}
                  >
                    {ss.title}
                  </button>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {ss.items.length} step{ss.items.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {expandedId === ss.id && (
                  <div className="mt-2 space-y-1">
                    {ss.items.map((item) => (
                      <div key={item.id} className="rounded bg-muted/50 px-2 py-1 text-xs">
                        <span className="font-medium">{item.stepNumber}.</span>{' '}
                        {item.description}
                        <span className="text-muted-foreground"> → {item.expectedResult}</span>
                      </div>
                    ))}
                    <div className="flex gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleInsert(ss)}
                      >
                        Insert into case
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleEdit(ss)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ss.id, ss.title)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <SharedStepFormDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) setDialogState({ open: false, mode: 'create' });
        }}
        onSubmit={handleDialogSubmit}
        isPending={createSharedStep.isPending || updateSharedStep.isPending}
        title={dialogState.mode === 'create' ? 'Create Shared Step' : 'Edit Shared Step'}
        defaultValues={
          dialogState.mode === 'edit' && dialogState.sharedStep
            ? {
                title: dialogState.sharedStep.title,
                items: dialogState.sharedStep.items.map((item) => ({
                  description: item.description,
                  expectedResult: item.expectedResult,
                })),
              }
            : undefined
        }
      />
    </div>
  );
}
