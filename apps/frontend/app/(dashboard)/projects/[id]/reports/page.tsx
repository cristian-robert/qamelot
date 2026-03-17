'use client';

import { use } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { StatusCount, ActivityEntry, ReferenceCoverageEntry } from '@app/shared';
import { TestResultStatus } from '@app/shared';
import { useProject } from '@/lib/projects/useProjects';
import {
  useCoverageReport,
  useProgressReport,
  useActivityReport,
  useReferenceCoverage,
} from '@/lib/reports/useReports';
import { formatDate } from '@/lib/format';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const STATUS_COLORS: Record<string, string> = {
  [TestResultStatus.PASSED]: '#10b981',
  [TestResultStatus.FAILED]: '#ef4444',
  [TestResultStatus.BLOCKED]: '#f59e0b',
  [TestResultStatus.RETEST]: '#3b82f6',
  [TestResultStatus.UNTESTED]: '#9ca3af',
};

export default function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: coverage, isLoading: coverageLoading } = useCoverageReport(projectId);
  const { data: progress, isLoading: progressLoading } = useProgressReport(projectId);
  const { data: activity, isLoading: activityLoading } = useActivityReport(projectId);
  const { data: refCoverage, isLoading: refLoading } = useReferenceCoverage(projectId);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? '...', href: `/projects/${projectId}` },
          { label: 'Reports' },
        ]}
      />

      <h1 className="text-2xl font-bold tracking-tight">Reports</h1>

      <Tabs defaultValue="coverage">
        <TabsList variant="line">
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        <TabsContent value="coverage" className="mt-6">
          {coverageLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : coverage ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Coverage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={coverage.byStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          label={({ status, count }) => `${status}: ${count}`}
                        >
                          {coverage.byStatus.map((entry: StatusCount) => (
                            <Cell
                              key={entry.status}
                              fill={STATUS_COLORS[entry.status] ?? '#9ca3af'}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cases</p>
                      <p className="text-2xl font-bold">{coverage.totalCases}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Covered</p>
                      <p className="text-2xl font-bold">{coverage.covered}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coverage</p>
                      <p className="text-2xl font-bold">
                        {Math.round(coverage.coveragePercent)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {coverage.byStatus.map((s: StatusCount) => (
                      <div key={s.status} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[s.status] }}
                          />
                          {s.status.toLowerCase().replace('_', ' ')}
                        </span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyReport />
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          {progressLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : progress?.runs?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress by Run</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={progress.runs}>
                    <XAxis
                      dataKey="runName"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="passed" stackId="a" fill="#10b981" name="Passed" />
                    <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
                    <Bar dataKey="blocked" stackId="a" fill="#f59e0b" name="Blocked" />
                    <Bar dataKey="retest" stackId="a" fill="#3b82f6" name="Retest" />
                    <Bar dataKey="untested" stackId="a" fill="#9ca3af" name="Untested" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <EmptyReport />
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {activityLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : activity?.entries?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Results Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activity.entries.map((entry: ActivityEntry, i: number) => (
                      <TableRow key={`${entry.date}-${entry.userId}-${i}`}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>{entry.userName}</TableCell>
                        <TableCell className="font-medium">{entry.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyReport />
          )}
        </TabsContent>

        <TabsContent value="references" className="mt-6">
          {refLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : refCoverage?.references?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reference Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Passed</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Blocked</TableHead>
                      <TableHead>Coverage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refCoverage.references.map((ref: ReferenceCoverageEntry) => (
                      <TableRow key={ref.reference}>
                        <TableCell className="font-medium">{ref.reference}</TableCell>
                        <TableCell>{ref.totalCases}</TableCell>
                        <TableCell className="text-emerald-600">{ref.passed}</TableCell>
                        <TableCell className="text-red-600">{ref.failed}</TableCell>
                        <TableCell className="text-amber-600">{ref.blocked}</TableCell>
                        <TableCell className="font-medium">
                          {Math.round(ref.coveragePercent)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyReport />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <BarChart3 className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        No data available yet. Run some tests to generate reports.
      </p>
    </div>
  );
}
