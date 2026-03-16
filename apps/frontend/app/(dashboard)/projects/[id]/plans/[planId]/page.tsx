'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { Breadcrumb } from '@/components/Breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function PlanDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function PlanDetailPage() {
  const { id, planId } = useParams<{ id: string; planId: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <PlanDetailSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? 'Project', href: `/projects/${id}` },
          { label: 'Test Plans', href: `/projects/${id}/plans` },
          { label: `Plan ${planId}` },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View test runs for this plan and execute them.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <ClipboardList className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">No test runs yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create a test run within this plan to start executing test cases.
          </p>
          {/* Example clickable run row -- placeholder for when runs exist */}
          <div className="mt-6 w-full max-w-md space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
              Example run link
            </p>
            <Link
              href={`/projects/${id}/runs/example/execute`}
              className="group flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium group-hover:text-emerald-700 transition-colors">
                Run execution page
              </span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Link href={`/projects/${id}/plans`} className={buttonVariants({ variant: 'outline' })}>
        Back to Plans
      </Link>
    </div>
  );
}
