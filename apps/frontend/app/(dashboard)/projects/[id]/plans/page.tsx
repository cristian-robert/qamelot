'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTestPlanSchema, type CreateTestPlanInput, type TestPlanStatus } from '@app/shared';
import { useTestPlans } from '@/lib/test-plans/useTestPlans';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';

const STATUS_LABELS: Record<TestPlanStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const STATUS_COLORS: Record<TestPlanStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

export default function TestPlansPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { plans, isLoading, error, createPlan } = useTestPlans(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTestPlanInput>({
    resolver: zodResolver(CreateTestPlanSchema),
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

  function onSubmit(data: CreateTestPlanInput) {
    createPlan.mutate(data, {
      onSuccess: () => closeDialog(),
    });
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: 'Test Plans' },
      ]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Test Plans</h1>
        <Button onClick={openDialog}>New Plan</Button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load test plans'}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No test plans yet. Create your first plan to get started.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/projects/${projectId}/plans/${plan.id}`}
              className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-medium">{plan.name}</h2>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[plan.status]}`}
                >
                  {STATUS_LABELS[plan.status]}
                </span>
              </div>
              {plan.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {plan.description}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {plan._count.testRuns} run{plan._count.testRuns !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create test plan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">New Test Plan</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">
                  Plan name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Sprint 1 Plan"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="description" className="text-sm font-medium">
                  Description{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="A short description..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              {createPlan.error && (
                <p className="text-sm text-destructive">
                  {createPlan.error instanceof Error
                    ? createPlan.error.message
                    : 'Failed to create plan'}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPlan.isPending}>
                  {createPlan.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
