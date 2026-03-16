'use client';

import { useCallback, useMemo } from 'react';
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { useSelection } from '@/lib/test-cases/useSelection';
import { CaseList } from './CaseList';
import { CaseListSkeleton } from './CaseListSkeleton';
import { BulkToolbar } from './BulkToolbar';
import type {
  CreateTestCaseInput,
  TestCaseDto,
  TestSuiteDto,
  CasePriority,
  CaseType,
} from '@app/shared';

interface CaseListPanelProps {
  projectId: string;
  suiteId: string;
  suites: TestSuiteDto[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  onCaseCreated: (tc: TestCaseDto) => void;
}

export function CaseListPanel({
  projectId,
  suiteId,
  suites,
  selectedCaseId,
  onSelectCase,
  onCaseCreated,
}: CaseListPanelProps) {
  const {
    cases,
    isLoading,
    createCase,
    deleteCase,
    bulkUpdateCases,
    bulkMoveCases,
    bulkDeleteCases,
  } = useTestCases(projectId, suiteId);

  const caseIds = useMemo(() => cases.map((c) => c.id), [cases]);
  const {
    selectedIds,
    toggle,
    toggleAll,
    deselectAll,
    isAllSelected,
    isSomeSelected,
    selectedCount,
  } = useSelection(caseIds);

  const handleCreate = useCallback(() => {
    const defaultInput: CreateTestCaseInput = { title: 'Untitled Test Case' };
    createCase.mutate(defaultInput, {
      onSuccess: (created) => {
        onCaseCreated(created);
      },
    });
  }, [createCase, onCaseCreated]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this test case? This action cannot be undone.')) return;
      deleteCase.mutate(id);
    },
    [deleteCase],
  );

  const handleBulkUpdate = useCallback(
    (fields: { priority?: CasePriority; type?: CaseType }) => {
      bulkUpdateCases.mutate(
        { caseIds: Array.from(selectedIds), fields },
        { onSuccess: () => deselectAll() },
      );
    },
    [bulkUpdateCases, selectedIds, deselectAll],
  );

  const handleBulkMove = useCallback(
    (targetSuiteId: string) => {
      bulkMoveCases.mutate(
        { caseIds: Array.from(selectedIds), targetSuiteId },
        { onSuccess: () => deselectAll() },
      );
    },
    [bulkMoveCases, selectedIds, deselectAll],
  );

  const handleBulkDelete = useCallback(() => {
    bulkDeleteCases.mutate(
      { caseIds: Array.from(selectedIds) },
      { onSuccess: () => deselectAll() },
    );
  }, [bulkDeleteCases, selectedIds, deselectAll]);

  const isBulkPending =
    bulkUpdateCases.isPending ||
    bulkMoveCases.isPending ||
    bulkDeleteCases.isPending;

  if (isLoading) {
    return <CaseListSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      {selectedCount > 0 && (
        <BulkToolbar
          selectedCount={selectedCount}
          suites={suites}
          currentSuiteId={suiteId}
          onDeselectAll={deselectAll}
          onBulkUpdate={handleBulkUpdate}
          onBulkMove={handleBulkMove}
          onBulkDelete={handleBulkDelete}
          isPending={isBulkPending}
        />
      )}
      <CaseList
        cases={cases}
        selectedId={selectedCaseId}
        onSelect={onSelectCase}
        onCreate={handleCreate}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onToggleSelect={toggle}
        onToggleAll={toggleAll}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
      />
    </div>
  );
}
