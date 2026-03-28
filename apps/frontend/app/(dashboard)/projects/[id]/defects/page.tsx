'use client';

import { use, useState } from 'react';
import { Plus, Bug, Search } from 'lucide-react';
import type { DefectDto } from '@app/shared';
import { useProject } from '@/lib/projects/useProjects';
import { useDefects, useCreateDefect } from '@/lib/defects/useDefects';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { formatDate } from '@/lib/format';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
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

export default function DefectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const { data: defects, isLoading, isError, refetch } = useDefects(
    projectId,
    debouncedSearch ? { search: debouncedSearch } : undefined,
  );
  const createDefect = useCreateDefect(projectId);

  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');

  function handleCreate() {
    if (!reference.trim()) return;
    createDefect.mutate(
      {
        reference: reference.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setReference('');
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
          { label: 'Defects' },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <PageHeader
          title="Defects"
          action={
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Defect
            </DialogTrigger>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Defect</DialogTitle>
            <DialogDescription>
              Log a defect reference to track bugs linked to test results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defect-ref">Reference</Label>
              <Input
                id="defect-ref"
                placeholder="e.g. JIRA-1234 or bug tracker URL"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defect-desc">Description</Label>
              <Textarea
                id="defect-desc"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={!reference.trim() || createDefect.isPending}
            >
              {createDefect.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search defects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : defects?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Linked Result</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defects.map((defect: DefectDto) => (
              <TableRow key={defect.id}>
                <TableCell className="font-medium">{defect.reference}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {defect.description ?? '\u2014'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {defect.testResultId ? (
                    <span className="text-xs font-mono">
                      {defect.testResultId.slice(0, 8)}...
                    </span>
                  ) : (
                    '\u2014'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(defect.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={Bug}
          title={debouncedSearch ? 'No matching defects' : 'No defects yet'}
          description={
            debouncedSearch
              ? 'No defects match your search criteria.'
              : 'Create one to start tracking bugs.'
          }
          action={
            !debouncedSearch ? (
              <Button variant="outline" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                New Defect
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
