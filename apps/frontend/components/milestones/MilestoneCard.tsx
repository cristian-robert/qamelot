'use client';

import type { MilestoneDto } from '@app/shared';
import { Button } from '@/components/ui/button';

interface MilestoneCardProps {
  milestone: MilestoneDto;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
}

function daysUntilDue(dueDate: string | null): string {
  if (!dueDate) return 'No due date';
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  return `${diffDays}d remaining`;
}

function statusBadgeClass(status: string, dueDate: string | null): string {
  if (status === 'CLOSED') return 'bg-muted text-muted-foreground';
  if (dueDate) {
    const diffMs = new Date(dueDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'bg-destructive/10 text-destructive';
    if (diffDays <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
}

export function MilestoneCard({ milestone, onClose, onDelete }: MilestoneCardProps) {
  const countdown = daysUntilDue(milestone.dueDate);
  const badgeClass = statusBadgeClass(milestone.status, milestone.dueDate);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{milestone.name}</h3>
          {milestone.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {milestone.description}
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {milestone.status}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{countdown}</span>
        <div className="flex gap-1">
          {milestone.status === 'OPEN' && (
            <Button size="sm" variant="outline" onClick={() => onClose(milestone.id)}>
              Close
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => onDelete(milestone.id)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
