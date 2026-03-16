'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card, CardContent } from '@/components/ui/card';

function ReportsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? 'Project', href: `/projects/${id}` },
          { label: 'Reports' },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <BarChart3 className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">No report data available</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Once test runs are executed, you will see coverage reports,
            pass/fail trends, and execution metrics here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
