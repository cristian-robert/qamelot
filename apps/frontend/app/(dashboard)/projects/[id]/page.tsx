'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { useProject, useDeleteProject } from '@/lib/projects/useProjects';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectOverview } from './ProjectOverview';

const tabs = [
  { label: 'Overview', segment: '' },
  { label: 'Test Cases', segment: 'cases' },
  { label: 'Plans & Runs', segment: 'plans' },
  { label: 'Milestones', segment: 'milestones' },
  { label: 'Defects', segment: 'defects' },
  { label: 'Reports', segment: 'reports' },
  { label: 'Configs', segment: 'configs' },
  { label: 'Shared Steps', segment: 'shared-steps' },
  { label: 'Custom Fields', segment: 'custom-fields' },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const router = useRouter();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const deleteProject = useDeleteProject();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const basePath = `/projects/${id}`;

  function handleDelete() {
    deleteProject.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.push('/projects');
      },
    });
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: isLoading ? '...' : project?.name ?? 'Project' },
        ]}
      />

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <Skeleton className="h-8 w-48" />
      ) : (
        <PageHeader
          title={project?.name ?? 'Project'}
          action={
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={deleteProject.isPending}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          }
        />
      )}

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
          const isActive = tab.segment
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === basePath;

          return (
            <Link
              key={tab.segment}
              href={href}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <ProjectOverview projectId={id} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        loading={deleteProject.isPending}
      />
    </div>
  );
}
