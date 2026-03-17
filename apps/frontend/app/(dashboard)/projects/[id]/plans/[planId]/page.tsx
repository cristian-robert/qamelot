'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Plus, ListChecks, Folder } from 'lucide-react';
import { TestPlanStatus, TestRunStatus } from '@app/shared';
import type { TestSuiteDto, TestCaseDto } from '@app/shared';
import type { TestRunListItem } from '@/lib/api/test-runs';
import { useProject } from '@/lib/projects/useProjects';
import { useTestPlan } from '@/lib/test-plans/useTestPlans';
import { useTestRuns, useCreateTestRun } from '@/lib/test-runs/useTestRuns';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { formatDate } from '@/lib/format';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const { data: plan, isLoading: planLoading } = useTestPlan(projectId, planId);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: runs, isLoading: runsLoading } = useTestRuns(
    planId,
    statusFilter ? { status: statusFilter } : undefined,
  );
  const createRun = useCreateTestRun(planId);

  const { data: suites } = useTestSuites(projectId);

  const [open, setOpen] = useState(false);
  const [runName, setRunName] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [pickerSuiteId, setPickerSuiteId] = useState<string | null>(null);

  function resetCreateForm() {
    setRunName('');
    setAssigneeId('');
    setSelectedCaseIds(new Set());
    setPickerSuiteId(null);
  }

  function toggleCase(id: string) {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllCases(ids: string[]) {
    setSelectedCaseIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleCreateRun() {
    if (!runName.trim() || selectedCaseIds.size === 0) return;
    createRun.mutate(
      {
        name: runName.trim(),
        assignedToId: assigneeId.trim() || undefined,
        caseIds: Array.from(selectedCaseIds),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetCreateForm();
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
          { label: 'Plans', href: `/projects/${projectId}/plans` },
          { label: plan?.name ?? '...' },
        ]}
      />

      {planLoading ? (
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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetCreateForm(); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" />
            Create Run
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Test Run</DialogTitle>
              <DialogDescription>
                Name your run, select test cases, and optionally assign it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="run-name">Name</Label>
                  <Input
                    id="run-name"
                    placeholder="Run name"
                    value={runName}
                    onChange={(e) => setRunName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="run-assignee">Assignee ID (optional)</Label>
                  <Input
                    id="run-assignee"
                    placeholder="User ID"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  />
                </div>
              </div>

              {/* Case Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Test Cases</Label>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCaseIds.size} selected
                  </Badge>
                </div>

                {/* Suite selector */}
                <Select
                  value={pickerSuiteId ?? ''}
                  onValueChange={(v) => setPickerSuiteId(v || null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a suite..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(suites ?? []).map((s: TestSuiteDto) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Case list for selected suite */}
                <CasePickerList
                  projectId={projectId}
                  suiteId={pickerSuiteId}
                  selectedCaseIds={selectedCaseIds}
                  onToggleCase={toggleCase}
                  onToggleAll={toggleAllCases}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetCreateForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRun}
                disabled={!runName.trim() || selectedCaseIds.size === 0 || createRun.isPending}
              >
                {createRun.isPending ? 'Creating...' : `Create Run (${selectedCaseIds.size} cases)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {runsLoading ? (
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
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ListChecks className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No test runs yet. Create a run to start testing.
          </p>
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Create Run
          </Button>
        </div>
      )}
    </div>
  );
}

/** Inline case picker list that loads cases for a given suite */
function CasePickerList({
  projectId,
  suiteId,
  selectedCaseIds,
  onToggleCase,
  onToggleAll,
}: {
  projectId: string;
  suiteId: string | null;
  selectedCaseIds: Set<string>;
  onToggleCase: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}) {
  const { data: cases, isLoading } = useTestCases(projectId, suiteId);

  if (!suiteId) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed py-6 text-sm text-muted-foreground">
        <Folder className="mr-2 size-4" />
        Select a suite above to browse cases
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-1 rounded-md border p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  }

  if (!cases?.length) {
    return (
      <div className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
        No cases in this suite.
      </div>
    );
  }

  const allIds = cases.map((c: TestCaseDto) => c.id);
  const allSelected = allIds.every((id: string) => selectedCaseIds.has(id));

  return (
    <div className="max-h-48 overflow-y-auto rounded-md border">
      <button
        type="button"
        className="flex w-full items-center gap-2 border-b bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50"
        onClick={() => onToggleAll(allIds)}
      >
        <Checkbox checked={allSelected} onCheckedChange={() => onToggleAll(allIds)} />
        Select all ({cases.length})
      </button>
      {cases.map((c: TestCaseDto) => (
        <button
          key={c.id}
          type="button"
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/40"
          onClick={() => onToggleCase(c.id)}
        >
          <Checkbox
            checked={selectedCaseIds.has(c.id)}
            onCheckedChange={() => onToggleCase(c.id)}
          />
          <span className="truncate">{c.title}</span>
        </button>
      ))}
    </div>
  );
}
