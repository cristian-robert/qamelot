'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMilestones } from '@/lib/milestones/useMilestones';
import { MilestoneCard } from '@/components/milestones/MilestoneCard';
import { MilestoneFormDialog } from '@/components/milestones/MilestoneFormDialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import type { CreateMilestoneInput } from '@app/shared';

export default function MilestonesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const {
    milestones,
    isLoading,
    error,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestones(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (data: CreateMilestoneInput) => {
    createMilestone.mutate(data, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleClose = (milestoneId: string) => {
    updateMilestone.mutate({ id: milestoneId, data: { status: 'CLOSED' } });
  };

  const handleDelete = (milestoneId: string) => {
    if (window.confirm('Delete this milestone?')) {
      deleteMilestone.mutate(milestoneId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: 'Milestones' },
      ]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Milestones</h1>
        <Button onClick={() => setDialogOpen(true)}>New Milestone</Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load milestones'}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No milestones yet. Create one to track deadlines for this project.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onClose={handleClose}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <MilestoneFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isPending={createMilestone.isPending}
        title="Create Milestone"
      />
    </div>
  );
}
