'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bug, Plus } from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function DefectsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function DefectsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <DefectsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? 'Project', href: `/projects/${id}` },
          { label: 'Defects' },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Defects</h1>
        <Button disabled>
          <Plus className="size-4" />
          New Defect
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <Bug className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">No defects logged</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Track bugs and issues found during testing. Defects can be linked
            to test runs and milestones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
