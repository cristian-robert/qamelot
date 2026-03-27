'use client';

import { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTestSuites, useDeleteTestSuite } from '@/lib/test-suites/useTestSuites';
import { buildSuiteTree, type SuiteTreeNode } from '@/lib/test-suites/tree-utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { SuiteFormDialog } from './SuiteFormDialog';
import { ConfirmDialog } from '@/components/test-cases/ConfirmDialog';
import type { TestSuiteDto } from '@app/shared';

interface SuiteTreeProps {
  projectId: string;
  selectedSuiteId: string | null;
  onSelectSuite: (suiteId: string) => void;
}

interface TreeNodeProps {
  node: SuiteTreeNode;
  depth: number;
  selectedSuiteId: string | null;
  onSelectSuite: (suiteId: string) => void;
  onEdit: (suite: TestSuiteDto) => void;
  onDelete: (suite: TestSuiteDto) => void;
}

function TreeNode({
  node,
  depth,
  selectedSuiteId,
  onSelectSuite,
  onEdit,
  onDelete,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isSelected = node.id === selectedSuiteId;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <DropdownMenu>
        <div
          className={cn(
            'group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
            isSelected
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectSuite(node.id)}
        >
          <button
            className="flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-black/5"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {hasChildren ? (
              expanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )
            ) : (
              <span className="size-3.5" />
            )}
          </button>

          {isSelected || expanded ? (
            <FolderOpen className="size-4 shrink-0 text-primary" />
          ) : (
            <Folder className="size-4 shrink-0" />
          )}

          <span className="truncate">{node.name}</span>

          <DropdownMenuTrigger
            className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Suite actions</span>
            <span className="flex size-5 items-center justify-center rounded hover:bg-black/10">
              <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </span>
          </DropdownMenuTrigger>
        </div>

        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem onClick={() => onEdit(node)}>
            <Pencil className="mr-1.5 size-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
            <Trash2 className="mr-1.5 size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedSuiteId={selectedSuiteId}
            onSelectSuite={onSelectSuite}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

export function SuiteTree({
  projectId,
  selectedSuiteId,
  onSelectSuite,
}: SuiteTreeProps) {
  const { data: suites, isLoading } = useTestSuites(projectId);
  const deleteMutation = useDeleteTestSuite(projectId);

  const [formOpen, setFormOpen] = useState(false);
  const [editSuite, setEditSuite] = useState<TestSuiteDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestSuiteDto | null>(null);

  const tree = suites ? buildSuiteTree(suites) : [];

  const handleEdit = useCallback((suite: TestSuiteDto) => {
    setEditSuite(suite);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((suite: TestSuiteDto) => {
    setDeleteTarget(suite);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const handleNewSuite = useCallback(() => {
    setEditSuite(null);
    setFormOpen(true);
  }, []);

  return (
    <div className="flex w-60 min-h-0 shrink-0 flex-col border-r overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Suites
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleNewSuite}
          aria-label="New suite"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-1.5">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3.5 flex-1" />
                </div>
              ))}
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Folder className="size-8 text-muted-foreground/40" />
              <p className="px-4 text-xs text-muted-foreground">
                No suites yet. Create one to organize your test cases.
              </p>
            </div>
          ) : (
            tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedSuiteId={selectedSuiteId}
                onSelectSuite={onSelectSuite}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <SuiteFormDialog
        projectId={projectId}
        open={formOpen}
        onOpenChange={setFormOpen}
        editSuite={editSuite}
        parentId={selectedSuiteId}
        allSuites={suites ?? []}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Suite"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All test cases inside will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
