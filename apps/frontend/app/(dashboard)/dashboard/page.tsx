'use client';

import Link from 'next/link';
import {
  FolderKanban,
  Play,
  CheckCircle2,
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
import { TestResultStatus } from '@app/shared';
import { formatRelativeTime } from '@/lib/format';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const statusColors: Record<string, string> = {
  [TestResultStatus.PASSED]: 'bg-emerald-500',
  [TestResultStatus.FAILED]: 'bg-red-500',
  [TestResultStatus.BLOCKED]: 'bg-amber-500',
  [TestResultStatus.RETEST]: 'bg-blue-500',
  [TestResultStatus.UNTESTED]: 'bg-gray-400',
};

const statusBadgeVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  [TestResultStatus.PASSED]: 'default',
  [TestResultStatus.FAILED]: 'destructive',
  [TestResultStatus.BLOCKED]: 'secondary',
  [TestResultStatus.RETEST]: 'outline',
  [TestResultStatus.UNTESTED]: 'secondary',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: projects, isLoading: projectsLoading } = useProjects();

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
            <Link href="/projects">
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
            value={projectsLoading ? null : (projects?.length ?? 0)}
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
                {projectsLoading ? (
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
                      <Link href="/projects">
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
                {isLoading ? (
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
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${statusColors[result.status] ?? 'bg-gray-400'}`}
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

        {/* Quick links row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickLink
            href="/projects"
            icon={TestTube2}
            title="Test Cases"
            description="Write and organize test cases"
          />
          <QuickLink
            href="/projects"
            icon={Play}
            title="Test Runs"
            description="Select a project to view and execute test runs"
          />
          <QuickLink
            href="/projects"
            icon={BarChart3}
            title="Reports"
            description="Select a project to view test reports and analytics"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="animate-in">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PassRateCard({ rate }: { rate: number | null }) {
  const circumference = 2 * Math.PI * 18;
  const offset = rate !== null ? circumference - (rate / 100) * circumference : circumference;
  const rateColor =
    rate === null ? 'text-muted'
    : rate >= 80 ? 'text-emerald-500'
    : rate >= 50 ? 'text-amber-500'
    : 'text-red-500';
  const strokeColor =
    rate === null ? 'stroke-muted'
    : rate >= 80 ? 'stroke-emerald-500'
    : rate >= 50 ? 'stroke-amber-500'
    : 'stroke-red-500';

  return (
    <Card className="animate-in">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="relative flex size-10 shrink-0 items-center justify-center">
          <svg className="size-10 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20" cy="20" r="18"
              fill="none"
              strokeWidth="3"
              className="stroke-muted"
            />
            <circle
              cx="20" cy="20" r="18"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${strokeColor} transition-all duration-700`}
            />
          </svg>
          <CheckCircle2 className={`absolute size-4 ${rateColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pass Rate</p>
          {rate === null ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className={`text-2xl font-bold tracking-tight ${rateColor}`}>
              {rate}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-all hover:border-primary/30 hover:shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10">
            <Icon className="size-4.5 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium group-hover:text-primary">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="max-w-48 text-xs text-muted-foreground/70">{description}</p>
      {action}
    </div>
  );
}
