'use client';

import { TestResultStatus } from '@app/shared';
import { cn } from '@/lib/utils';
import { statusDotStyles } from '@/lib/constants';

interface CaseResultRowProps {
  title: string;
  status: TestResultStatus;
  isActive: boolean;
  onClick: () => void;
}

export function CaseResultRow({ title, status, isActive, onClick }: CaseResultRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-muted/60',
      )}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          statusDotStyles[status],
        )}
      />
      <span className="truncate">{title}</span>
    </button>
  );
}
