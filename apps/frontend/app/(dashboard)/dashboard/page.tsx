'use client';

import Link from 'next/link';
import { useDashboardSummary } from '@/lib/reports/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import type { TestResultStatus } from '@app/shared';

const STATUS_COLORS: Record<TestResultStatus, string> = {
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  BLOCKED: 'bg-yellow-100 text-yellow-800',
  RETEST: 'bg-orange-100 text-orange-800',
  UNTESTED: 'bg-gray-100 text-gray-800',
};

export default function DashboardPage() {
  const { data: summary, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-destructive">
        {error instanceof Error ? error.message : 'Failed to load dashboard'}
      </div>
    );
  }

  if (!summary) {
    return <div className="p-8 text-muted-foreground">No data available.</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/projects" className={buttonVariants({ variant: 'outline' })}>
          View all projects
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Projects" value={summary.totalProjects} />
        <SummaryCard title="Active Runs" value={summary.activeRuns} />
        <SummaryCard
          title="Overall Pass Rate"
          value={`${summary.overallPassRate}%`}
        />
        <SummaryCard
          title="Recent Activity (30d)"
          value={summary.recentActivityCount}
        />
      </div>

      {/* Recent results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recentResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No test results yet. Create a test run and submit results to see
              activity here.
            </p>
          ) : (
            <ul className="space-y-3">
              {summary.recentResults.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {result.runName} / {result.suiteName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {result.userName} &middot;{' '}
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[result.status]}`}
                  >
                    {result.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
