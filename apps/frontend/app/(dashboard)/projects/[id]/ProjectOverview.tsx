'use client';

import Link from 'next/link';
import {
  ClipboardList,
  Flag,
  Bug,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/* ── Nav Cards ── */

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

/* ── Skeleton and Error States ── */

export function DetailSkeleton() {
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

export function ErrorState() {
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

/* ── Project Overview (shown when no suite is selected) ── */

interface ProjectOverviewProps {
  id: string;
  name: string;
  description: string | null;
}

export function ProjectOverview({ id, name, description }: ProjectOverviewProps) {
  return (
    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: name },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
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
  );
}
