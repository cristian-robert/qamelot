'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CaseListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <Skeleton className="size-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
