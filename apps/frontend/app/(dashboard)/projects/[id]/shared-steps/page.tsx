'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useCreateSharedStep } from '@/lib/shared-steps/useSharedSteps';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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
      <PageHeader
        title="Shared Steps"
        subtitle="Manage reusable test step groups for this project"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Shared Step
          </Button>
        }
      />

      <SharedStepLibrary projectId={projectId} onCreateClick={() => setCreateOpen(true)} />

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
