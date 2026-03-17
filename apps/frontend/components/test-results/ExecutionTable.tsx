'use client';

import { MoreHorizontal } from 'lucide-react';
import type { TestRunCaseWithResultDto } from '@app/shared';
import { TestResultStatus } from '@app/shared';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ResultStatusBadge } from './ResultStatusBadge';
import { formatRelativeTime } from '@/lib/format';

interface ExecutionTableProps {
  cases: TestRunCaseWithResultDto[];
  onViewResult?: (testRunCaseId: string) => void;
}

export function ExecutionTable({ cases, onViewResult }: ExecutionTableProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">No test cases in this run.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Case</TableHead>
          <TableHead>Suite</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Executed By</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="w-[60px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((trc) => {
          const result = trc.latestResult;
          const status = result?.status ?? TestResultStatus.UNTESTED;

          return (
            <TableRow key={trc.id}>
              <TableCell>
                <span className="font-medium">{trc.testCase.title}</span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {trc.testCase.suite?.name ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <ResultStatusBadge status={status} />
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {result?.executedBy?.name ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {result?.createdAt ? formatRelativeTime(result.createdAt) : '—'}
                </span>
              </TableCell>
              <TableCell>
                {onViewResult && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onViewResult(trc.id)}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
