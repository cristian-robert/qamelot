'use client';

import { useState } from 'react';
import type { ComparisonReportDto, ProgressReportDto } from '@app/shared';
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
import { useComparisonReport } from '@/lib/reports/useReports';

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  PASSED: 'default',
  FAILED: 'destructive',
  BLOCKED: 'secondary',
  RETEST: 'outline',
  UNTESTED: 'outline',
};

interface ComparisonReportProps {
  projectId: string;
  progressData?: ProgressReportDto;
}

export function ComparisonReport({ projectId, progressData }: ComparisonReportProps) {
  const [runIdA, setRunIdA] = useState('');
  const [runIdB, setRunIdB] = useState('');

  const runs = progressData?.runs ?? [];
  const enabled = !!runIdA && !!runIdB && runIdA !== runIdB;

  const { data, isLoading, error } = useComparisonReport(
    projectId,
    enabled ? runIdA : '',
    enabled ? runIdB : '',
  );

  const handleExport = (report: ComparisonReportDto) => {
    const allEntries = [
      ...report.fixed.map((e) => ({ ...e, change: 'Fixed' })),
      ...report.regressions.map((e) => ({ ...e, change: 'Regression' })),
      ...report.newPasses.map((e) => ({ ...e, change: 'New Pass' })),
      ...report.newFailures.map((e) => ({ ...e, change: 'New Failure' })),
    ];

    downloadCsv(
      'comparison-report.csv',
      ['Change', 'Test Case', 'Status in Run A', 'Status in Run B'],
      allEntries.map((e) => [e.change, e.testCaseTitle, e.statusInA, e.statusInB]),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Comparison</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare two test runs to see what changed
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="run-a-select" className="mb-1 block text-sm font-medium">
              Baseline Run (A)
            </label>
            <select
              id="run-a-select"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={runIdA}
              onChange={(e) => setRunIdA(e.target.value)}
            >
              <option value="">Select a run...</option>
              {runs.map((r) => (
                <option key={r.runId} value={r.runId}>
                  {r.runName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="run-b-select" className="mb-1 block text-sm font-medium">
              Comparison Run (B)
            </label>
            <select
              id="run-b-select"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={runIdB}
              onChange={(e) => setRunIdB(e.target.value)}
            >
              <option value="">Select a run...</option>
              {runs.map((r) => (
                <option key={r.runId} value={r.runId}>
                  {r.runName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!enabled && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Select two different runs to compare.
          </p>
        )}

        {isLoading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Loading comparison...
          </p>
        )}

        {error && (
          <p className="py-4 text-center text-sm text-destructive">
            Failed to load comparison report.
          </p>
        )}

        {data && <ComparisonResults data={data} onExport={() => handleExport(data)} />}
      </CardContent>
    </Card>
  );
}

function ComparisonResults({
  data,
  onExport,
}: {
  data: ComparisonReportDto;
  onExport: () => void;
}) {
  const sections = [
    { title: 'Regressions', entries: data.regressions, color: 'text-red-600' },
    { title: 'Fixed', entries: data.fixed, color: 'text-green-600' },
    { title: 'New Failures', entries: data.newFailures, color: 'text-orange-600' },
    { title: 'New Passes', entries: data.newPasses, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span>
            <strong>{data.runA.name}</strong>: {data.runA.passed}P / {data.runA.failed}F
          </span>
          <span className="text-muted-foreground">vs</span>
          <span>
            <strong>{data.runB.name}</strong>: {data.runB.passed}P / {data.runB.failed}F
          </span>
          <span className="text-muted-foreground">({data.unchanged} unchanged)</span>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          Export CSV
        </Button>
      </div>

      {sections.map((section) =>
        section.entries.length > 0 ? (
          <div key={section.title}>
            <h4 className={`mb-2 text-sm font-semibold ${section.color}`}>
              {section.title} ({section.entries.length})
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Case</TableHead>
                  <TableHead>Run A</TableHead>
                  <TableHead>Run B</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.entries.map((entry) => (
                  <TableRow key={entry.testCaseId}>
                    <TableCell>{entry.testCaseTitle}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[entry.statusInA] ?? 'outline'}>
                        {entry.statusInA}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[entry.statusInB] ?? 'outline'}>
                        {entry.statusInB}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null,
      )}

      {sections.every((s) => s.entries.length === 0) && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No differences found between the two runs.
        </p>
      )}
    </div>
  );
}
