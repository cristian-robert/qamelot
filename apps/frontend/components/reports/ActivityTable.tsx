'use client';

import type { ActivityReportDto } from '@app/shared';
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

interface ActivityTableProps {
  data: ActivityReportDto;
}

export function ActivityTable({ data }: ActivityTableProps) {
  const handleExport = () => {
    downloadCsv(
      'activity-report.csv',
      ['Date', 'User', 'Results Submitted'],
      data.entries.map((entry) => [entry.date, entry.userName, String(entry.count)]),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Activity (Last 30 Days)</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No test activity in the last 30 days.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Results</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.map((entry) => (
                <TableRow key={`${entry.date}-${entry.userId}`}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.userName}</TableCell>
                  <TableCell className="text-right">{entry.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
