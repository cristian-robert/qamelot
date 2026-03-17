'use client';

import {
  FolderKanban,
  Play,
  CheckCircle2,
  Activity,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardSummary } from '@/lib/reports/useReports';
import { TestResultStatus } from '@app/shared';
import { formatRelativeTime } from '@/lib/format';

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
  const { data: summary, isLoading } = useDashboardSummary();

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your test management activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Total Projects"
          value={isLoading ? '—' : String(summary?.totalProjects ?? 0)}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Play}
          label="Active Runs"
          value={isLoading ? '—' : String(summary?.activeRuns ?? 0)}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={CheckCircle2}
          label="Pass Rate"
          value={isLoading ? '—' : `${Math.round(summary?.overallPassRate ?? 0)}%`}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={Activity}
          label="Recent Activity"
          value={isLoading ? '—' : String(summary?.recentActivityCount ?? 0)}
          subtitle="last 7 days"
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Recent Results */}
      <Card>
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
                <div key={i} className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : summary?.recentResults?.length ? (
            <div className="space-y-3">
              {summary.recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`size-2 rounded-full ${statusColors[result.status] ?? 'bg-gray-400'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{result.caseName}</span>
                    <span className="mx-2 text-muted-foreground">in</span>
                    <span className="text-sm text-muted-foreground">
                      {result.runName}
                    </span>
                  </div>
                  <Badge variant={statusBadgeVariant[result.status] ?? 'secondary'} className="text-[10px]">
                    {result.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(result.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <TrendingUp className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No recent activity. Start a test run to see results here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="animate-in">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
