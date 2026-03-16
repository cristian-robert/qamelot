'use client';

export function CaseListSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              <div className="h-5 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
