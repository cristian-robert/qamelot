'use client';

import type { MilestoneDto } from '@app/shared';

interface MilestoneCountdownProps {
  milestones: MilestoneDto[];
}

function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const diffMs = due.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatCountdown(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days}d left`;
}

function urgencyClass(days: number): string {
  if (days < 0) return 'text-destructive';
  if (days <= 7) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

export function MilestoneCountdown({ milestones }: MilestoneCountdownProps) {
  const upcoming = milestones
    .filter((m) => m.status === 'OPEN' && m.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {upcoming.map((m) => {
        const days = daysUntilDue(m.dueDate!);
        return (
          <li key={m.id} className="flex items-center justify-between text-sm">
            <span className="truncate font-medium">{m.name}</span>
            <span className={`shrink-0 font-mono text-xs ${urgencyClass(days)}`}>
              {formatCountdown(days)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
