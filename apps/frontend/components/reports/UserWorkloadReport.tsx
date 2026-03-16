'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { UserWorkloadReportDto } from '@app/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { downloadCsv } from '@/lib/reports/csv-export';

interface UserWorkloadReportProps {
  data: UserWorkloadReportDto;
}

function CompletionBar({ percent }: { percent: number }) {
  const color =
    percent >= 80
      ? 'bg-green-500'
      : percent >= 50
        ? 'bg-yellow-500'
        : percent > 0
          ? 'bg-orange-500'
          : 'bg-gray-300';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}

export function UserWorkloadReport({ data }: UserWorkloadReportProps) {
  const handleExport = () => {
    downloadCsv(
      'user-workload.csv',
      ['User', 'Total', 'Passed', 'Failed', 'Blocked', 'Retest', 'Untested', 'Completion %'],
      data.users.map((u) => [
        u.userName,
        String(u.totalAssigned),
        String(u.passed),
        String(u.failed),
        String(u.blocked),
        String(u.retest),
        String(u.untested),
        String(u.completionPercent),
      ]),
    );
  };

  const chartData = data.users.map((u) => ({
    name: u.userName,
    Passed: u.passed,
    Failed: u.failed,
    Blocked: u.blocked,
    Retest: u.retest,
    Untested: u.untested,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Workload</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Cases assigned per user with completion rates
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.users.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No test results found for this project.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Passed" stackId="a" fill="#22c55e" />
                <Bar dataKey="Failed" stackId="a" fill="#ef4444" />
                <Bar dataKey="Blocked" stackId="a" fill="#eab308" />
                <Bar dataKey="Retest" stackId="a" fill="#f97316" />
                <Bar dataKey="Untested" stackId="a" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Passed</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Blocked</TableHead>
                  <TableHead>Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell className="text-right">{user.totalAssigned}</TableCell>
                    <TableCell className="text-right">{user.passed}</TableCell>
                    <TableCell className="text-right">{user.failed}</TableCell>
                    <TableCell className="text-right">{user.blocked}</TableCell>
                    <TableCell>
                      <CompletionBar percent={user.completionPercent} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
