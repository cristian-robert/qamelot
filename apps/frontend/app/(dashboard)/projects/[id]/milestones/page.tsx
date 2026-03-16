'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMilestoneTree } from '@/lib/milestones/useMilestones';
import { MilestoneTree } from '@/components/milestones/MilestoneTree';
import { MilestoneFormDialog } from '@/components/milestones/MilestoneFormDialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import type { CreateMilestoneInput, MilestoneTreeNode } from '@app/shared';

/** Find a node by id anywhere in the tree */
function findNode(tree: MilestoneTreeNode[], id: string): MilestoneTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export default function MilestonesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const {
    tree,
    isLoading,
    error,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestoneTree(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  const parentNode = parentId ? findNode(tree, parentId) : null;

  const openCreateDialog = useCallback((pId: string | null = null) => {
    setParentId(pId);
    setDialogOpen(true);
  }, []);

  const handleCreate = (data: CreateMilestoneInput) => {
    createMilestone.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false);
        setParentId(null);
      },
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
        <Button onClick={() => openCreateDialog(null)}>New Milestone</Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load milestones'}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <MilestoneTree
          tree={tree}
          onAddChild={(id) => openCreateDialog(id)}
          onClose={handleClose}
          onDelete={handleDelete}
        />
      )}

      <MilestoneFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setParentId(null);
        }}
        onSubmit={handleCreate}
        isPending={createMilestone.isPending}
        parentId={parentId}
        parentName={parentNode?.name}
        title={parentId ? 'Create Sub-Milestone' : 'Create Milestone'}
      />
    </div>
  );
}
