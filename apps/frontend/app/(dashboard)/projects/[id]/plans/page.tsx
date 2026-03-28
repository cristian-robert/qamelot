'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import { TestPlanStatus } from '@app/shared';
import type { TestPlanWithRunCountDto } from '@app/shared';
import { useTestPlans, useCreateTestPlan } from '@/lib/test-plans/useTestPlans';
import { formatDate } from '@/lib/format';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useProject } from '@/lib/projects/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { planStatusBadgeStyles } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';

export default function PlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const filters = { ...(statusFilter ? { status: statusFilter } : {}), page, pageSize: 20 };
  const { data: response, isLoading, isError, refetch } = useTestPlans(projectId, filters);
  const plans = response?.data;
  const totalPages = response?.totalPages ?? 1;
  const createPlan = useCreateTestPlan(projectId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleCreate() {
    if (!name.trim()) return;
    createPlan.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
        },
      },
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? '...', href: `/projects/${projectId}` },
          { label: 'Plans' },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader
          title="Test Plans"
          action={
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Plan
            </DialogTrigger>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Test Plan</DialogTitle>
            <DialogDescription>
              Group related test runs under a plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                placeholder="Plan name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-desc">Description</Label>
              <Textarea
                id="plan-desc"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createPlan.isPending}
            >
              {createPlan.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <Select
          value={statusFilter ?? ''}
          onValueChange={(val) => { setStatusFilter(val || undefined); setPage(1); }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.values(TestPlanStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : plans?.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan: TestPlanWithRunCountDto) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${projectId}/plans/${plan.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {plan.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={plan.status}
                      className={planStatusBadgeStyles[plan.status]}
                    />
                  </TableCell>
                  <TableCell>{plan._count.testRuns}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(plan.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(plan.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No test plans yet"
          description="Create a plan to organize your test runs."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New Plan
            </Button>
          }
        />
      )}
    </div>
  );
}
