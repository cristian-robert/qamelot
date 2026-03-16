'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import {
  useCoverageReport,
  useProgressReport,
  useActivityReport,
  useReferenceCoverageReport,
} from '@/lib/reports/useReports';
import { CoverageChart } from '@/components/reports/CoverageChart';
import { ProgressChart } from '@/components/reports/ProgressChart';
import { ActivityTable } from '@/components/reports/ActivityTable';
import { ReferenceCoverageTable } from '@/components/reports/ReferenceCoverageTable';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ProjectReportsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  const { data: coverage, isLoading: coverageLoading } = useCoverageReport(id);
  const { data: progress, isLoading: progressLoading } = useProgressReport(id);
  const { data: activity, isLoading: activityLoading } = useActivityReport(id);
  const { data: refCoverage, isLoading: refCoverageLoading } = useReferenceCoverageReport(id);

  if (projectLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!project) {
    return <div className="p-6 text-destructive">Project not found.</div>;
  }

  const isLoading = coverageLoading || progressLoading || activityLoading || refCoverageLoading;

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: project.name, href: `/projects/${id}` },
        { label: 'Reports' },
      ]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Test coverage, progress, and team activity
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading reports...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {coverage && <CoverageChart data={coverage} />}
            {progress && <ProgressChart data={progress} />}
          </div>
          {refCoverage && <ReferenceCoverageTable data={refCoverage} />}
          {activity && <ActivityTable data={activity} />}
        </div>
      )}
    </div>
  );
}
