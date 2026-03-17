'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useCreateSharedStep } from '@/lib/shared-steps/useSharedSteps';
import { Button } from '@/components/ui/button';
import { SharedStepLibrary } from '@/components/shared-steps/SharedStepLibrary';
import { SharedStepFormDialog } from '@/components/shared-steps/SharedStepFormDialog';
import type { CreateSharedStepInput } from '@app/shared';

export default function SharedStepsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const createStep = useCreateSharedStep(projectId);
  const [createOpen, setCreateOpen] = useState(false);

  function handleCreate(data: CreateSharedStepInput) {
    createStep.mutate(data, {
      onSuccess: () => setCreateOpen(false),
    });
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared Steps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage reusable test step groups for this project
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New Shared Step
        </Button>
      </div>

      <SharedStepLibrary projectId={projectId} />

      <SharedStepFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createStep.isPending}
        error={createStep.error}
      />
    </div>
  );
}
