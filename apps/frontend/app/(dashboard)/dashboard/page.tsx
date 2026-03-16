'use client';

import Link from 'next/link';
import {
  FolderKanban,
  Play,
  CheckCircle2,
  Activity,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { useProjects } from '@/lib/projects/useProjects';
import { useDashboardSummary } from '@/lib/reports/useReports';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { TestResultStatus } from '@app/shared';

const STATUS_COLORS: Record<TestResultStatus, string> = {
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  BLOCKED: 'bg-yellow-100 text-yellow-800',
  RETEST: 'bg-orange-100 text-orange-800',
  UNTESTED: 'bg-gray-100 text-gray-800',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface KpiCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  loading?: boolean;
}

function KpiCard({ icon, value, label, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          {icon}
        </div>
        <div className="min-w-0">
          {loading ? (
            <div className="h-7 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
          <FolderKanban className="size-7" />
        </div>
        <h3 className="text-lg font-semibold">Welcome to Qamelot</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Get started by creating your first project. Organize test suites,
          write test cases, and track your testing progress.
        </p>
        <Link href="/projects" className={buttonVariants({ className: 'mt-6' })}>
          <Plus className="size-4" />
          Create Your First Project
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();

  const isLoading = authLoading || projectsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const projectCount = projects.length;
  const hasData = projectCount > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<FolderKanban className="size-5" />}
          value={summary?.totalProjects ?? projectCount}
          label="Projects"
          loading={summaryLoading}
        />
        <KpiCard
          icon={<Play className="size-5" />}
          value={summary?.activeRuns ?? 0}
          label="Active Runs"
          loading={summaryLoading}
        />
        <KpiCard
          icon={<CheckCircle2 className="size-5" />}
          value={summary ? `${summary.overallPassRate}%` : '--'}
          label="Pass Rate"
          loading={summaryLoading}
        />
        <KpiCard
          icon={<Activity className="size-5" />}
          value={summary?.recentActivityCount ?? 0}
          label="Recent Activity"
          loading={summaryLoading}
        />
      </div>

      {hasData ? (
        <>
          {/* Recent Results */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Recent Results</h2>
            {summary?.recentResults && summary.recentResults.length > 0 ? (
              <Card>
                <CardContent className="divide-y p-0">
                  {summary.recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {result.runName} / {result.suiteName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {result.userName} &middot; {timeAgo(result.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[result.status]}`}>
                        {result.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <Activity className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No test results yet. Create a test plan and execute runs to see activity here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/projects" className={buttonVariants()}>
              <Plus className="size-4" />
              New Project
            </Link>
            <Link href="/projects" className={buttonVariants({ variant: 'outline' })}>
              View All Projects
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
