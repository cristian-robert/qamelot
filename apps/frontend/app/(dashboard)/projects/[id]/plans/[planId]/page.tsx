'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Plus, ListChecks } from 'lucide-react';
import { TestPlanStatus, TestRunStatus } from '@app/shared';
import type { TestRunListItem } from '@/lib/api/test-runs';
import { useProject } from '@/lib/projects/useProjects';
import { useTestPlan } from '@/lib/test-plans/useTestPlans';
import { useTestRuns } from '@/lib/test-runs/useTestRuns';
import { formatDate } from '@/lib/format';
import { CreateRunDialog } from './CreateRunDialog';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';

const planStatusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [TestPlanStatus.DRAFT]: 'secondary',
  [TestPlanStatus.ACTIVE]: 'default',
  [TestPlanStatus.COMPLETED]: 'outline',
  [TestPlanStatus.ARCHIVED]: 'secondary',
};

const runStatusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [TestRunStatus.PENDING]: 'secondary',
  [TestRunStatus.IN_PROGRESS]: 'default',
  [TestRunStatus.COMPLETED]: 'outline',
};

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id: projectId, planId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: plan, isLoading: planLoading, isError: planError, refetch: refetchPlan } = useTestPlan(projectId, planId);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: runs, isLoading: runsLoading, isError: runsError, refetch: refetchRuns } = useTestRuns(
    planId,
    statusFilter ? { status: statusFilter } : undefined,
  );

  const [open, setOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? '...', href: `/projects/${projectId}` },
          { label: 'Plans', href: `/projects/${projectId}/plans` },
          { label: plan?.name ?? '...' },
        ]}
      />

      {planError ? (
        <ErrorState onRetry={refetchPlan} />
      ) : planLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      ) : plan ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <Badge variant={planStatusVariant[plan.status] ?? 'secondary'}>
              {plan.status}
            </Badge>
          </div>
          {plan.description && (
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Test Runs</h2>
          <Select
            value={statusFilter ?? ''}
            onValueChange={(val) => setStatusFilter(val || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {Object.values(TestRunStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Create Run
        </Button>
      </div>

      <CreateRunDialog
        planId={planId}
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
      />

      {runsError ? (
        <ErrorState onRetry={refetchRuns} />
      ) : runsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : runs?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Cases</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run: TestRunListItem) => (
              <TableRow
                key={run.id}
                className="cursor-pointer"
              >
                <TableCell>
                  <Link
                    href={`/projects/${projectId}/runs/${run.id}/execute`}
                    className="font-medium text-primary hover:underline"
                  >
                    {run.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={runStatusVariant[run.status] ?? 'secondary'}>
                    {run.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {run.assignedTo?.name ?? '\u2014'}
                </TableCell>
                <TableCell>{run._count.testRunCases}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(run.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="No test runs yet"
          description="Create a run to start testing."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create Run
            </Button>
          }
        />
      )}
    </div>
  );
}
