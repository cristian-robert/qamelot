'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FilterBar, type FilterConfig } from '@/components/FilterBar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateTestRunSchema,
  type CreateTestRunInput,
  type TestRunStatus,
  type TestPlanStatus,
  type ConfigGroupWithItemsDto,
} from '@app/shared';
import { testPlansApi } from '@/lib/api/test-plans';
import { testPlansQueryKey } from '@/lib/test-plans/useTestPlans';
import { useTestRuns } from '@/lib/test-runs/useTestRuns';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { useConfigs } from '@/lib/configs/useConfigs';
import { cartesian } from '@/lib/configs/cartesian';
import { useFilterParams } from '@/lib/useFilterParams';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

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

const FILTER_KEYS = ['status', 'assigneeId'] as const;

const RUN_FILTERS: FilterConfig[] = [
  {
    type: 'select',
    key: 'status',
    label: 'All statuses',
    options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED', label: 'Completed' },
    ],
  },
];

export default function PlanDetailPage() {
  const { id: projectId, planId } = useParams<{ id: string; planId: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [activeSuiteId, setActiveSuiteId] = useState<string | null>(null);
  const [useMatrix, setUseMatrix] = useState(false);
  const [selectedConfigItems, setSelectedConfigItems] = useState<Record<string, string[]>>({});

  const { filters, activeCount, setFilter, clearAll } = useFilterParams(FILTER_KEYS);

  const { data: plan, isLoading: planLoading, error: planError } = useQuery({
    queryKey: [...testPlansQueryKey(projectId), planId],
    queryFn: () => testPlansApi.getById(projectId, planId),
    enabled: !!projectId && !!planId,
  });

  const { runs, isLoading: runsLoading, createRun, createMatrixRuns } = useTestRuns(planId, filters);
  const { suites } = useTestSuites(projectId);
  const { cases } = useTestCases(projectId, activeSuiteId);
  const { groups: configGroups } = useConfigs(projectId);

  const hasConfigGroups = configGroups.length > 0;

  // Build the matrix combinations from selected config items
  const matrixCombinations = useMemo(() => {
    if (!useMatrix) return [];
    const groupsWithSelection = configGroups.filter(
      (g) => (selectedConfigItems[g.id] ?? []).length > 0,
    );
    if (groupsWithSelection.length === 0) return [];

    const itemArrays = groupsWithSelection.map((g) => selectedConfigItems[g.id]);
    return cartesian(itemArrays);
  }, [useMatrix, configGroups, selectedConfigItems]);

  // Build label previews for the combinations
  const comboLabels = useMemo(() => {
    if (matrixCombinations.length === 0) return [];
    const itemMap = new Map<string, string>();
    for (const g of configGroups) {
      for (const item of g.items) {
        itemMap.set(item.id, item.name);
      }
    }
    return matrixCombinations.map((combo) =>
      combo.map((id) => itemMap.get(id) ?? 'Unknown').join(' / '),
    );
  }, [matrixCombinations, configGroups]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTestRunInput>({
    resolver: zodResolver(CreateTestRunSchema),
    defaultValues: { caseIds: [] },
  });

  useEffect(() => {
    setValue('caseIds', selectedCaseIds);
  }, [selectedCaseIds, setValue]);

  useEffect(() => {
    if (!dialogOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeDialog();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dialogOpen]);

  function openDialog() {
    reset();
    setSelectedCaseIds([]);
    setActiveSuiteId(null);
    setUseMatrix(false);
    setSelectedConfigItems({});
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    reset();
    setSelectedCaseIds([]);
    setActiveSuiteId(null);
    setUseMatrix(false);
    setSelectedConfigItems({});
  }

  function toggleCase(caseId: string) {
    setSelectedCaseIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId],
    );
  }

  function selectAllInSuite() {
    const caseIdsInSuite = cases.map((c) => c.id);
    setSelectedCaseIds((prev) => {
      const withoutSuite = prev.filter((id) => !caseIdsInSuite.includes(id));
      return [...withoutSuite, ...caseIdsInSuite];
    });
  }

  function toggleConfigItem(groupId: string, itemId: string) {
    setSelectedConfigItems((prev) => {
      const groupItems = prev[groupId] ?? [];
      const updated = groupItems.includes(itemId)
        ? groupItems.filter((id) => id !== itemId)
        : [...groupItems, itemId];
      return { ...prev, [groupId]: updated };
    });
  }

  function onSubmit(data: CreateTestRunInput) {
    if (useMatrix && matrixCombinations.length > 0) {
      createMatrixRuns.mutate(
        {
          name: data.name,
          caseIds: data.caseIds,
          assignedToId: data.assignedToId,
          configItemIds: matrixCombinations,
        },
        { onSuccess: () => closeDialog() },
      );
    } else {
      createRun.mutate(data, {
        onSuccess: () => closeDialog(),
      });
    }
  }

  const isPending = createRun.isPending || createMatrixRuns.isPending;
  const mutationError = createRun.error ?? createMatrixRuns.error;

  if (planLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (planError || !plan) {
    return <div className="p-6">Test plan not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[
        { label: 'Projects', href: '/projects' },
        { label: plan.name },
      ]} />
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

      <FilterBar
        filters={RUN_FILTERS}
        values={filters}
        activeCount={activeCount}
        onChange={setFilter}
        onClearAll={clearAll}
      />

      {runsLoading ? (
        <p className="text-sm text-muted-foreground">Loading runs...</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {activeCount > 0
            ? 'No test runs match the current filters.'
            : 'No test runs yet. Create your first run to get started.'}
        </p>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/projects/${projectId}/runs/${run.id}/execute`}
              className="group flex cursor-pointer items-center justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div>
                <h3 className="text-[13px] font-semibold group-hover:text-primary transition-colors">{run.name}</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {run._count.testRunCases} case{run._count.testRunCases !== 1 ? 's' : ''}
                  {run.assignedTo && ` · ${run.assignedTo.name}`}
                  {run.configLabel && (
                    <span className="ml-2 inline-flex items-center rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                      {run.configLabel}
                    </span>
                  )}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${RUN_STATUS_COLORS[run.status]}`}
              >
                {RUN_STATUS_LABELS[run.status]}
              </span>
            </Link>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create test run"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-base font-semibold">New Test Run</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Select test cases to include in this run.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="run-name" className="text-[13px] font-semibold">
                  Run name
                </label>
                <input
                  id="run-name"
                  type="text"
                  {...register('name')}
                  className="w-full rounded-lg border px-3 py-2 text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Smoke Test Run"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <CaseSelector
                suites={suites}
                cases={cases}
                activeSuiteId={activeSuiteId}
                selectedCaseIds={selectedCaseIds}
                onSetActiveSuiteId={setActiveSuiteId}
                onToggleCase={toggleCase}
                onSelectAllInSuite={selectAllInSuite}
                register={register}
                errors={errors}
              />

              {/* Config Matrix Section */}
              {hasConfigGroups && (
                <div className="space-y-2 border-t pt-3">
                  <label className="flex items-center gap-2 text-[13px] font-semibold">
                    <Checkbox
                      checked={useMatrix}
                      onCheckedChange={(checked) => {
                        setUseMatrix(!!checked);
                        if (!checked) setSelectedConfigItems({});
                      }}
                    />
                    Use configuration matrix
                  </label>

                  {useMatrix && (
                    <ConfigMatrixSelector
                      groups={configGroups}
                      selectedConfigItems={selectedConfigItems}
                      onToggleItem={toggleConfigItem}
                      comboLabels={comboLabels}
                    />
                  )}
                </div>
              )}

              {mutationError && (
                <p className="text-[13px] text-destructive">
                  {mutationError instanceof Error
                    ? mutationError.message
                    : 'Failed to create run'}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="cursor-pointer">
                  {isPending
                    ? 'Creating...'
                    : useMatrix && matrixCombinations.length > 0
                      ? `Create ${matrixCombinations.length} Run${matrixCombinations.length !== 1 ? 's' : ''}`
                      : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Extracted Sub-Components ──

interface CaseSelectorProps {
  suites: { id: string; name: string }[];
  cases: { id: string; title: string; priority: string }[];
  activeSuiteId: string | null;
  selectedCaseIds: string[];
  onSetActiveSuiteId: (id: string) => void;
  onToggleCase: (id: string) => void;
  onSelectAllInSuite: () => void;
  register: ReturnType<typeof useForm<CreateTestRunInput>>['register'];
  errors: ReturnType<typeof useForm<CreateTestRunInput>>['formState']['errors'];
}

const PRIORITY_SHORTCODE: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'C', className: 'bg-red-100 text-red-800 border-red-200' },
  HIGH: { label: 'H', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  MEDIUM: { label: 'M', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  LOW: { label: 'L', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function CaseSelector({
  suites,
  cases,
  activeSuiteId,
  selectedCaseIds,
  onSetActiveSuiteId,
  onToggleCase,
  onSelectAllInSuite,
  register,
  errors,
}: CaseSelectorProps) {
  const deselectAllInSuite = () => {
    const caseIdsInSuite = cases.map((c) => c.id);
    /* no-op if nothing to deselect — the parent handles state */
    caseIdsInSuite.forEach((id) => {
      if (selectedCaseIds.includes(id)) {
        onToggleCase(id);
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold">Select test cases</label>
        {selectedCaseIds.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {selectedCaseIds.length} selected
          </span>
        )}
      </div>

      {suites.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No suites available. Create suites and cases first.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {suites.map((suite) => (
              <Button
                key={suite.id}
                type="button"
                size="sm"
                className="h-7 cursor-pointer text-xs"
                variant={activeSuiteId === suite.id ? 'default' : 'outline'}
                onClick={() => onSetActiveSuiteId(suite.id)}
              >
                {suite.name}
              </Button>
            ))}
          </div>

          {activeSuiteId && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Cases in selected suite
                </span>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" className="h-6 cursor-pointer text-[11px]" onClick={onSelectAllInSuite}>
                    Select All
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-6 cursor-pointer text-[11px]" onClick={deselectAllInSuite}>
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-1.5 space-y-0.5">
                {cases.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    No cases in this suite.
                  </p>
                ) : (
                  cases.map((tc) => {
                    const shortcode = PRIORITY_SHORTCODE[tc.priority];
                    return (
                      <label
                        key={tc.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedCaseIds.includes(tc.id)}
                          onCheckedChange={() => onToggleCase(tc.id)}
                        />
                        <span className="flex-1 truncate">{tc.title}</span>
                        {shortcode && (
                          <span className={`inline-flex size-5 items-center justify-center rounded border text-[10px] font-bold ${shortcode.className}`}>
                            {shortcode.label}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <input type="hidden" {...register('caseIds')} />
      {errors.caseIds && (
        <p className="text-xs text-destructive">{errors.caseIds.message}</p>
      )}
    </div>
  );
}

interface ConfigMatrixSelectorProps {
  groups: ConfigGroupWithItemsDto[];
  selectedConfigItems: Record<string, string[]>;
  onToggleItem: (groupId: string, itemId: string) => void;
  comboLabels: string[];
}

function ConfigMatrixSelector({
  groups,
  selectedConfigItems,
  onToggleItem,
  comboLabels,
}: ConfigMatrixSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select values from each config group. A run will be created for every
        combination.
      </p>
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          <span className="text-xs font-medium">{group.name}</span>
          <div className="flex gap-2 flex-wrap">
            {group.items.map((item) => {
              const isSelected = (selectedConfigItems[group.id] ?? []).includes(item.id);
              return (
                <label key={item.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleItem(group.id, item.id)}
                  />
                  {item.name}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {comboLabels.length > 0 && (
        <div className="rounded-md bg-muted/50 p-2 space-y-1">
          <p className="text-xs font-medium">
            {comboLabels.length} run{comboLabels.length !== 1 ? 's' : ''} will be created:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
            {comboLabels.map((label, i) => (
              <li key={i}>{label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
