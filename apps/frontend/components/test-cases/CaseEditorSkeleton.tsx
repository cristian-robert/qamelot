'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CaseEditorSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
