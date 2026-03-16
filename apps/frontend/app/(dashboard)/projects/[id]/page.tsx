'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Flag,
  Bug,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { SuiteTree } from '@/components/test-suites/SuiteTree';
import { SuiteFormDialog } from '@/components/test-suites/SuiteFormDialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TreeNode } from '@/lib/test-suites/tree-utils';
import type { CreateTestSuiteInput } from '@app/shared';

interface NavCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function NavCard({ href, icon, title, description }: NavCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="flex items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold group-hover:text-emerald-700 transition-colors">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="p-6 space-y-4">
      <Breadcrumb items={[{ label: 'Projects', href: '/projects' }, { label: 'Not Found' }]} />
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <h3 className="text-lg font-semibold">Project not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The project you are looking for does not exist or has been removed.
          </p>
          <Link href="/projects" className={buttonVariants({ variant: 'outline', className: 'mt-4' })}>
            Back to Projects
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

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
    setDialogState({ open: true, mode: 'rename', node });
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
    return <DetailSkeleton />;
  }

  if (projectError || !project) {
    return <ErrorState />;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar -- Suite Tree */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Suites</h2>
          <Button size="sm" variant="ghost" onClick={handleCreateRoot}>
            + New Suite
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {suitesLoading ? (
            <div className="px-3 py-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-muted" />
              ))}
            </div>
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
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Breadcrumb
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project.name },
          ]}
        />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Navigation cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <NavCard
            href={`/projects/${id}/plans`}
            icon={<ClipboardList className="size-5" />}
            title="Test Plans"
            description="Create and manage test plans for organized execution"
          />
          <NavCard
            href={`/projects/${id}/milestones`}
            icon={<Flag className="size-5" />}
            title="Milestones"
            description="Track progress toward release milestones"
          />
          <NavCard
            href={`/projects/${id}/defects`}
            icon={<Bug className="size-5" />}
            title="Defects"
            description="Log and track bugs found during testing"
          />
          <NavCard
            href={`/projects/${id}/reports`}
            icon={<BarChart3 className="size-5" />}
            title="Reports"
            description="View testing metrics and coverage reports"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Select a suite from the sidebar to view its test cases.
        </p>
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
