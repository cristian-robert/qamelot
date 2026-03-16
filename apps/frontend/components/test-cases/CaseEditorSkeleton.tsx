'use client';

export function CaseEditorSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-10 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
