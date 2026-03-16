'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CoverageReportDto } from '@app/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/reports/csv-export';

const STATUS_COLORS: Record<string, string> = {
  PASSED: '#22c55e',
  FAILED: '#ef4444',
  BLOCKED: '#eab308',
  RETEST: '#f97316',
  UNTESTED: '#9ca3af',
};

interface CoverageChartProps {
  data: CoverageReportDto;
}

export function CoverageChart({ data }: CoverageChartProps) {
  const chartData = data.byStatus.map((entry) => ({
    name: entry.status,
    value: entry.count,
  }));

  const handleExport = () => {
    downloadCsv(
      'coverage-report.csv',
      ['Status', 'Count'],
      data.byStatus.map((entry) => [entry.status, String(entry.count)]),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Test Coverage</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.coveragePercent}% covered ({data.covered}/{data.totalCases} cases)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No test run cases found for this project.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
