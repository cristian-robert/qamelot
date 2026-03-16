'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DefectSummaryReportDto } from '@app/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  PASSED: 'default',
  FAILED: 'destructive',
  BLOCKED: 'secondary',
  RETEST: 'outline',
  UNTESTED: 'outline',
};

interface DefectSummaryReportProps {
  data: DefectSummaryReportDto;
}

export function DefectSummaryReport({ data }: DefectSummaryReportProps) {
  const handleExport = () => {
    downloadCsv(
      'defect-summary.csv',
      ['Reference', 'Description', 'Test Case', 'Run', 'Result Status', 'Age (days)', 'Created'],
      data.defects.map((d) => [
        d.reference,
        d.description ?? '',
        d.testCaseTitle ?? '',
        d.testRunName ?? '',
        d.resultStatus ?? '',
        String(d.ageInDays),
        d.createdAt.slice(0, 10),
      ]),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Defect Summary</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.totalDefects} defect{data.totalDefects !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.byAge.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Defects by Age</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byAge}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.defects.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No defects found for this project.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Test Case</TableHead>
                <TableHead>Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.defects.map((defect) => (
                <TableRow key={defect.id}>
                  <TableCell className="font-mono text-xs">{defect.reference}</TableCell>
                  <TableCell>{defect.testCaseTitle ?? '—'}</TableCell>
                  <TableCell>{defect.testRunName ?? '—'}</TableCell>
                  <TableCell>
                    {defect.resultStatus ? (
                      <Badge variant={STATUS_VARIANT[defect.resultStatus] ?? 'outline'}>
                        {defect.resultStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{defect.ageInDays}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
