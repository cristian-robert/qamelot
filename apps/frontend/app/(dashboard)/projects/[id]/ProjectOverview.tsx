'use client';

import type React from 'react';
import {
  CheckCircle2,
  FileText,
  FolderOpen,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useProject } from '@/lib/projects/useProjects';
import { useCoverageReport } from '@/lib/reports/useReports';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  PASSED: 'text-emerald-600',
  FAILED: 'text-red-600',
  BLOCKED: 'text-amber-600',
  RETEST: 'text-blue-600',
  UNTESTED: 'text-gray-500',
};

export function ProjectOverview({ projectId }: { projectId: string }) {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: coverage, isLoading: coverageLoading } = useCoverageReport(projectId);

  const isLoading = projectLoading || coverageLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {project?.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Cases"
          value={String(coverage?.totalCases ?? 0)}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={CheckCircle2}
          label="Covered"
          value={String(coverage?.covered ?? 0)}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={ShieldCheck}
          label="Coverage"
          value={`${Math.round(coverage?.coveragePercent ?? 0)}%`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={FolderOpen}
          label="Untested"
          value={String((coverage?.totalCases ?? 0) - (coverage?.covered ?? 0))}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {coverage && coverage.coveragePercent > 0 && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Coverage Breakdown</span>
            </div>
            <Progress value={coverage.coveragePercent} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {coverage.byStatus.map((s) => (
                <div key={s.status} className="text-center">
                  <p className={`text-lg font-bold ${statusColors[s.status] ?? 'text-gray-500'}`}>
                    {s.count}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.status.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
