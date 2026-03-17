'use client';

import { TestResultStatus } from '@app/shared';
import { cn } from '@/lib/utils';

const statusDotColor: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'bg-emerald-500',
  [TestResultStatus.FAILED]: 'bg-red-500',
  [TestResultStatus.BLOCKED]: 'bg-amber-500',
  [TestResultStatus.RETEST]: 'bg-blue-500',
  [TestResultStatus.UNTESTED]: 'bg-gray-400',
};

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
          statusDotColor[status],
        )}
      />
      <span className="truncate">{title}</span>
    </button>
  );
}
