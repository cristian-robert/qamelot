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
import type { ProgressReportDto } from '@app/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/reports/csv-export';

interface ProgressChartProps {
  data: ProgressReportDto;
}

export function ProgressChart({ data }: ProgressChartProps) {
  const chartData = data.runs.map((run) => ({
    name: run.runName,
    Passed: run.passed,
    Failed: run.failed,
    Blocked: run.blocked,
    Retest: run.retest,
    Untested: run.untested,
  }));

  const handleExport = () => {
    downloadCsv(
      'progress-report.csv',
      ['Run', 'Date', 'Total', 'Passed', 'Failed', 'Blocked', 'Retest', 'Untested'],
      data.runs.map((run) => [
        run.runName,
        run.createdAt.slice(0, 10),
        String(run.total),
        String(run.passed),
        String(run.failed),
        String(run.blocked),
        String(run.retest),
        String(run.untested),
      ]),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Progress by Run</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No test runs found for this project.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
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
        )}
      </CardContent>
    </Card>
  );
}
