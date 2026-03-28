'use client';

import Link from 'next/link';
import {
  FolderKanban,
  Play,
  Activity,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
  ChevronRight,
  TestTube2,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/lib/reports/useReports';
import { useProjects } from '@/lib/projects/useProjects';
import { useAuth } from '@/lib/auth/useAuth';
import { formatRelativeTime } from '@/lib/format';
import { statusDotStyles, statusBadgeVariant } from '@/lib/constants';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { StatCard, PassRateCard, QuickLink } from './DashboardCards';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading, isError, refetch } = useDashboardSummary();
  const { data: projectsResponse, isLoading: projectsLoading, isError: projectsError, refetch: refetchProjects } = useProjects();
  const projects = projectsResponse?.data;

  const passRate = Math.round(summary?.overallPassRate ?? 0);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Welcome header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening across your projects today.
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <FolderKanban className="mr-1.5 size-3.5" />
                Projects
              </Button>
            </Link>
            <Link href="/projects?create=true">
              <Button size="sm">
                <Plus className="mr-1.5 size-3.5" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            label="Projects"
            value={projectsLoading ? null : (projectsResponse?.total ?? 0)}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            icon={Play}
            label="Active Runs"
            value={isLoading ? null : (summary?.activeRuns ?? 0)}
            color="text-blue-600"
            bgColor="bg-blue-100/60"
          />
          <PassRateCard
            rate={isLoading ? null : passRate}
          />
          <StatCard
            icon={Activity}
            label="Results (30d)"
            value={isLoading ? null : (summary?.recentActivityCount ?? 0)}
            color="text-amber-600"
            bgColor="bg-amber-100/60"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Projects overview - wider column */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="size-4 text-muted-foreground" />
                  Projects
                </CardTitle>
                <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {projectsError ? (
                  <ErrorState onRetry={refetchProjects} />
                ) : projectsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                        <Skeleton className="size-9 rounded-md" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : projects?.length ? (
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}/cases`}
                        className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-primary/30 hover:bg-muted/40"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium group-hover:text-primary">
                            {project.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {project.description || 'No description'}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FolderKanban}
                    title="No projects yet"
                    description="Create your first project to start managing test cases."
                    action={
                      <Link href="/projects?create=true">
                        <Button size="sm">
                          <Plus className="mr-1.5 size-3.5" />
                          New Project
                        </Button>
                      </Link>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent activity - narrower column */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="size-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isError ? (
                  <ErrorState onRetry={refetch} />
                ) : isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Skeleton className="size-6 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : summary?.recentResults?.length ? (
                  <div className="space-y-1">
                    {summary.recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${statusDotStyles[result.status] ?? 'bg-gray-400'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">
                            <span className="font-medium">{result.userName}</span>
                            <span className="text-muted-foreground"> ran </span>
                            <span className="font-medium">{result.caseName}</span>
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Badge
                              variant={statusBadgeVariant[result.status] ?? 'secondary'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {result.status}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeTime(result.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="No recent activity"
                    description="Start a test run to see results here."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick links row — only shown when projects exist */}
        {projects && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickLink
              href={`/projects/${projects[0].id}/cases`}
              icon={TestTube2}
              title="Test Cases"
              description="Write and organize test cases"
            />
            <QuickLink
              href={`/projects/${projects[0].id}/plans`}
              icon={Play}
              title="Test Plans"
              description="Create and execute test plans"
            />
            <QuickLink
              href={`/projects/${projects[0].id}/reports`}
              icon={BarChart3}
              title="Reports"
              description="View test reports and analytics"
            />
          </div>
        )}
      </div>
    </div>
  );
}
