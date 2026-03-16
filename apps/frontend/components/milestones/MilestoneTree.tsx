'use client';

import { useState } from 'react';
import type { MilestoneTreeNode } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MilestoneTreeProps {
  tree: MilestoneTreeNode[];
  onAddChild: (parentId: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MilestoneTree({ tree, onAddChild, onClose, onDelete }: MilestoneTreeProps) {
  if (tree.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No milestones yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul role="tree" className="space-y-1">
      {tree.map((node) => (
        <MilestoneTreeItem
          key={node.id}
          node={node}
          depth={0}
          onAddChild={onAddChild}
          onClose={onClose}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface MilestoneTreeItemProps {
  node: MilestoneTreeNode;
  depth: number;
  onAddChild: (parentId: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
}

function daysUntilDue(dueDate: string | null): string {
  if (!dueDate) return '';
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  return `${diffDays}d left`;
}

function progressBarColor(percent: number): string {
  if (percent === 100) return 'bg-green-500';
  if (percent >= 50) return 'bg-blue-500';
  return 'bg-yellow-500';
}

function MilestoneTreeItem({
  node,
  depth,
  onAddChild,
  onClose,
  onDelete,
}: MilestoneTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const countdown = daysUntilDue(node.dueDate);

  return (
    <li role="treeitem">
      <div
        className="group flex items-center gap-2 rounded-md border bg-card px-3 py-2 hover:bg-accent/50 transition-colors"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {/* Expand / collapse toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
            aria-label={`Toggle ${node.name}`}
          >
            <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        {/* Milestone info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.name}</span>
            <Badge variant={node.status === 'CLOSED' ? 'secondary' : 'default'}>
              {node.status}
            </Badge>
            {countdown && (
              <span className="text-xs text-muted-foreground">{countdown}</span>
            )}
          </div>

          {/* Progress bar — only show when there are children */}
          {node.progress.total > 1 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressBarColor(node.progress.percent)}`}
                  style={{ width: `${node.progress.percent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {node.progress.closed}/{node.progress.total} ({node.progress.percent}%)
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddChild(node.id)}
            title="Add sub-milestone"
          >
            + Sub
          </Button>
          {node.status === 'OPEN' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onClose(node.id)}
            >
              Close
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(node.id)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul role="group" className="mt-1 space-y-1">
          {node.children.map((child) => (
            <MilestoneTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onClose={onClose}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
