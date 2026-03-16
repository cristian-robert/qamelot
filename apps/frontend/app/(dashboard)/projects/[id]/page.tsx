'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { SuiteTree } from '@/components/test-suites/SuiteTree';
import { SuiteFormDialog } from '@/components/test-suites/SuiteFormDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TreeNode } from '@/lib/test-suites/tree-utils';
import type { CreateTestSuiteInput } from '@app/shared';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  const { tree, isLoading: suitesLoading, createSuite, updateSuite, deleteSuite } =
    useTestSuites(id);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    parentId?: string;
    node?: TreeNode;
  }>({ open: false, mode: 'create' });

  const handleCreateRoot = () => {
    setDialogState({ open: true, mode: 'create' });
  };

  const handleCreateChild = (parentId: string) => {
    setDialogState({ open: true, mode: 'create', parentId });
  };

  const handleRename = (node: TreeNode) => {
    setDialogState({
      open: true,
      mode: 'rename',
      node,
    });
  };

  const handleDelete = (node: TreeNode) => {
    if (window.confirm(`Delete "${node.name}" and all its children?`)) {
      deleteSuite.mutate(node.id);
    }
  };

  const handleDialogSubmit = (data: CreateTestSuiteInput) => {
    if (dialogState.mode === 'create') {
      createSuite.mutate(
        { ...data, ...(dialogState.parentId && { parentId: dialogState.parentId }) },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    } else if (dialogState.node) {
      updateSuite.mutate(
        { id: dialogState.node.id, data: { name: data.name, description: data.description } },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    }
  };

  if (projectLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (projectError || !project) {
    return <div className="p-6">Project not found.</div>;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — Suite Tree */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Suites</h2>
          <Button size="sm" variant="ghost" onClick={handleCreateRoot}>
            + New Suite
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {suitesLoading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <SuiteTree
              tree={tree}
              onCreateChild={handleCreateChild}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )}
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
        <div className="mt-8 space-y-4">
          <Link
            href={`/projects/${id}/plans`}
            className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-medium">Test Plans</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage test plans and runs for this project.
            </p>
          </Link>
          <Link
            href={`/projects/${id}/reports`}
            className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-medium">Reports</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Coverage, progress, and team activity charts.
            </p>
          </Link>
          <p className="text-muted-foreground">
            Select a suite from the sidebar to view its test cases.
          </p>
        </div>
      </main>

      {/* Create / Rename dialog */}
      <SuiteFormDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) setDialogState({ open: false, mode: 'create' });
        }}
        onSubmit={handleDialogSubmit}
        isPending={createSuite.isPending || updateSuite.isPending}
        title={dialogState.mode === 'create' ? 'Create Suite' : 'Rename Suite'}
        defaultValues={
          dialogState.mode === 'rename' && dialogState.node
            ? { name: dialogState.node.name, description: dialogState.node.description ?? '' }
            : undefined
        }
      />
    </div>
  );
}
