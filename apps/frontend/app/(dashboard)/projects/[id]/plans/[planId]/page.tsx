'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateTestRunSchema,
  type CreateTestRunInput,
  type TestRunStatus,
  type TestPlanStatus,
} from '@app/shared';
import { testPlansApi } from '@/lib/api/test-plans';
import { testPlansQueryKey } from '@/lib/test-plans/useTestPlans';
import { useTestRuns } from '@/lib/test-runs/useTestRuns';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { Button } from '@/components/ui/button';

const RUN_STATUS_LABELS: Record<TestRunStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const RUN_STATUS_COLORS: Record<TestRunStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const PLAN_STATUS_LABELS: Record<TestPlanStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export default function PlanDetailPage() {
  const { id: projectId, planId } = useParams<{ id: string; planId: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: plan, isLoading: planLoading, error: planError } = useQuery({
    queryKey: [...testPlansQueryKey(projectId), planId],
    queryFn: () => testPlansApi.getById(projectId, planId),
    enabled: !!projectId && !!planId,
  });

  const { runs, isLoading: runsLoading, createRun } = useTestRuns(planId);
  const { suites } = useTestSuites(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTestRunInput>({
    resolver: zodResolver(CreateTestRunSchema),
  });

  useEffect(() => {
    if (!dialogOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDialogOpen(false);
        reset();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dialogOpen, reset]);

  function openDialog() {
    reset();
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    reset();
  }

  function onSubmit(data: CreateTestRunInput) {
    createRun.mutate(data, {
      onSuccess: () => closeDialog(),
    });
  }

  if (planLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (planError || !plan) {
    return <div className="p-6">Test plan not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {PLAN_STATUS_LABELS[plan.status]}
          </span>
        </div>
        {plan.description && (
          <p className="mt-1 text-muted-foreground">{plan.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Test Runs</h2>
        <Button onClick={openDialog}>New Run</Button>
      </div>

      {runsLoading ? (
        <p className="text-sm text-muted-foreground">Loading runs...</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No test runs yet. Create your first run to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div>
                <h3 className="font-medium">{run.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {run._count.testRunCases} suite{run._count.testRunCases !== 1 ? 's' : ''}
                  {run.assignedTo && ` · Assigned to ${run.assignedTo.name}`}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_COLORS[run.status]}`}
              >
                {RUN_STATUS_LABELS[run.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create test run"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">New Test Run</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="run-name" className="text-sm font-medium">
                  Run name
                </label>
                <input
                  id="run-name"
                  type="text"
                  {...register('name')}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Smoke Test Run"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Select suites
                </label>
                {suites.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No suites available. Create suites first.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                    {suites.map((suite) => (
                      <label
                        key={suite.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          value={suite.id}
                          {...register('suiteIds')}
                          className="rounded border-gray-300"
                        />
                        {suite.name}
                      </label>
                    ))}
                  </div>
                )}
                {errors.suiteIds && (
                  <p className="text-xs text-destructive">{errors.suiteIds.message}</p>
                )}
              </div>

              {createRun.error && (
                <p className="text-sm text-destructive">
                  {createRun.error instanceof Error
                    ? createRun.error.message
                    : 'Failed to create run'}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRun.isPending}>
                  {createRun.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
