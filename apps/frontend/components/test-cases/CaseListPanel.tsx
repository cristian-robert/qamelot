'use client';

import { useCallback } from 'react';
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { CaseList } from './CaseList';
import { CaseListSkeleton } from './CaseListSkeleton';
import type { CreateTestCaseInput, TestCaseDto } from '@app/shared';

interface CaseListPanelProps {
  projectId: string;
  suiteId: string;
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  onCaseCreated: (tc: TestCaseDto) => void;
}

export function CaseListPanel({
  projectId,
  suiteId,
  selectedCaseId,
  onSelectCase,
  onCaseCreated,
}: CaseListPanelProps) {
  const { cases, isLoading, createCase, deleteCase } = useTestCases(projectId, suiteId);

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

  if (isLoading) {
    return <CaseListSkeleton />;
  }

  return (
    <CaseList
      cases={cases}
      selectedId={selectedCaseId}
      onSelect={onSelectCase}
      onCreate={handleCreate}
      onDelete={handleDelete}
    />
  );
}
