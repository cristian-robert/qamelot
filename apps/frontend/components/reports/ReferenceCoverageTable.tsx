'use client';

import type { ReferenceCoverageDto } from '@app/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/lib/reports/csv-export';
import { isUrl } from '@/components/test-cases/ReferenceLinks';

interface ReferenceCoverageTableProps {
  data: ReferenceCoverageDto;
}

function CoverageBar({ percent }: { percent: number }) {
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
      <div className="h-2 w-24 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}

function StatusBadge({ label, count, variant }: { label: string; count: number; variant: 'default' | 'destructive' | 'outline' | 'secondary' }) {
  if (count === 0) return null;
  return (
    <Badge variant={variant} className="text-xs">
      {label}: {count}
    </Badge>
  );
}

export function ReferenceCoverageTable({ data }: ReferenceCoverageTableProps) {
  const handleExport = () => {
    downloadCsv(
      'reference-coverage.csv',
      ['Reference', 'Total Cases', 'Passed', 'Failed', 'Blocked', 'Retest', 'Untested', 'Coverage %'],
      data.references.map((r) => [
        r.reference,
        String(r.totalCases),
        String(r.passed),
        String(r.failed),
        String(r.blocked),
        String(r.retest),
        String(r.untested),
        String(r.coveragePercent),
      ]),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reference Coverage</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Test status for each referenced requirement or ticket
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.references.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No test cases with references found in this project.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Reference</th>
                  <th className="pb-2 pr-4 font-medium">Cases</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {data.references.map((entry) => (
                  <tr key={entry.reference} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {isUrl(entry.reference) ? (
                        <a
                          href={entry.reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          {entry.reference}
                        </a>
                      ) : (
                        <span className="font-mono text-xs">{entry.reference}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">{entry.totalCases}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge label="Pass" count={entry.passed} variant="default" />
                        <StatusBadge label="Fail" count={entry.failed} variant="destructive" />
                        <StatusBadge label="Blocked" count={entry.blocked} variant="secondary" />
                        <StatusBadge label="Retest" count={entry.retest} variant="outline" />
                        <StatusBadge label="Untested" count={entry.untested} variant="outline" />
                      </div>
                    </td>
                    <td className="py-2">
                      <CoverageBar percent={entry.coveragePercent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
