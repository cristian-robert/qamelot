'use client';

import { use, useState } from 'react';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Target,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { MilestoneStatus } from '@app/shared';
import type { MilestoneTreeNode } from '@app/shared';
import { useProject } from '@/lib/projects/useProjects';
import { useMilestoneTree, useCreateMilestone } from '@/lib/milestones/useMilestones';
import { formatDate } from '@/lib/format';
import { daysUntil, isOverdue } from '@/lib/date-utils';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function MilestonesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: tree, isLoading, isError, refetch } = useMilestoneTree(projectId);
  const createMilestone = useCreateMilestone(projectId);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');

  function handleCreate() {
    if (!name.trim()) return;
    createMilestone.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
          setDueDate('');
          setStartDate('');
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
          { label: 'Milestones' },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader
          title="Milestones"
          action={
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Milestone
            </DialogTrigger>
          }
        />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Milestone</DialogTitle>
              <DialogDescription>
                Add a milestone to track progress toward a goal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ms-name">Name</Label>
                <Input
                  id="ms-name"
                  placeholder="Milestone name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-desc">Description</Label>
                <Textarea
                  id="ms-desc"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ms-start">Start Date</Label>
                  <Input
                    id="ms-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ms-due">Due Date</Label>
                  <Input
                    id="ms-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createMilestone.isPending}
              >
                {createMilestone.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : tree?.length ? (
        <div className="space-y-2">
          {tree.map((node) => (
            <MilestoneNode key={node.id} node={node} depth={0} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No milestones yet"
          description="Create one to track project progress."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New Milestone
            </Button>
          }
        />
      )}
    </div>
  );
}

function MilestoneNode({
  node,
  depth,
}: {
  node: MilestoneTreeNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const days = daysUntil(node.dueDate);
  const overdue = isOverdue(node.dueDate);

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        ) : (
          <div className="size-4 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{node.name}</span>
            <Badge
              variant={node.status === MilestoneStatus.OPEN ? 'default' : 'secondary'}
            >
              {node.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
            {node.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Due {formatDate(node.dueDate)}
              </span>
            )}
            {days !== null && node.status === MilestoneStatus.OPEN && (
              <span
                className={`flex items-center gap-1 ${
                  overdue ? 'text-red-600' : days <= 7 ? 'text-amber-600' : ''
                }`}
              >
                {overdue ? (
                  <>
                    <AlertTriangle className="size-3" />
                    Overdue by {Math.abs(days)}d
                  </>
                ) : (
                  `${days}d remaining`
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-40 items-center gap-2">
          <Progress value={node.progress.percent} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {Math.round(node.progress.percent)}%
          </span>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <MilestoneNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
