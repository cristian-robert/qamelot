'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { SuiteTree } from '@/components/test-suites/SuiteTree';
import { SuiteFormDialog } from '@/components/test-suites/SuiteFormDialog';
import { CaseList } from '@/components/test-cases/CaseList';
import { CaseEditor } from '@/components/test-cases/CaseEditor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TreeNode } from '@/lib/test-suites/tree-utils';
import type { CreateTestSuiteInput, CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  const { tree, isLoading: suitesLoading, createSuite, updateSuite, deleteSuite } =
    useTestSuites(id);

  // Suite dialog state
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    parentId?: string;
    node?: TreeNode;
  }>({ open: false, mode: 'create' });

  // Test case state
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'idle' | 'create' | 'edit'>('idle');

  const { cases, isLoading: casesLoading, createCase, updateCase, deleteCase } =
    useTestCases(id, selectedSuiteId);

  const selectedCase = selectedCaseId
    ? cases.find((c) => c.id === selectedCaseId) ?? null
    : null;

  // Suite tree handlers
  const handleSuiteSelect = (suiteId: string) => {
    setSelectedSuiteId(suiteId);
    setSelectedCaseId(null);
    setEditorMode('idle');
  };

  const handleCreateRoot = () => {
    setDialogState({ open: true, mode: 'create' });
  };

  const handleCreateChild = (parentId: string) => {
    setDialogState({ open: true, mode: 'create', parentId });
  };

  const handleRename = (node: TreeNode) => {
    setDialogState({ open: true, mode: 'rename', node });
  };

  const handleDeleteSuite = (node: TreeNode) => {
    if (window.confirm(`Delete "${node.name}" and all its children?`)) {
      deleteSuite.mutate(node.id, {
        onSuccess: () => {
          if (selectedSuiteId === node.id) {
            setSelectedSuiteId(null);
            setSelectedCaseId(null);
            setEditorMode('idle');
          }
        },
      });
    }
  };

  const handleDialogSubmit = (data: CreateTestSuiteInput) => {
    if (dialogState.mode === 'create') {
      createSuite.mutate(
        { ...data, ...(dialogState.parentId && { parentId: dialogState.parentId }) },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    } else if (dialogState.node) {
      updateSuite.mutate(
        { id: dialogState.node.id, data: { name: data.name, description: data.description } },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    }
  };

  // Test case handlers
  const handleCaseSave = (data: CreateTestCaseInput) => {
    if (editorMode === 'create' && selectedSuiteId) {
      createCase.mutate(data, {
        onSuccess: () => setEditorMode('idle'),
      });
    } else if (editorMode === 'edit' && selectedCaseId) {
      const updateData: UpdateTestCaseInput = {
        ...data,
        preconditions: data.preconditions ?? null,
      };
      updateCase.mutate(
        { id: selectedCaseId, data: updateData },
        { onSuccess: () => setEditorMode('idle') },
      );
    }
  };

  const handleCaseDelete = (caseId: string) => {
    if (window.confirm('Delete this test case?')) {
      deleteCase.mutate(caseId, {
        onSuccess: () => {
          if (selectedCaseId === caseId) {
            setSelectedCaseId(null);
            setEditorMode('idle');
          }
        },
      });
    }
  };

  if (projectLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (projectError || !project) {
    return <div className="p-6">Project not found.</div>;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — Suite Tree */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Suites</h2>
          <Button size="sm" variant="ghost" onClick={handleCreateRoot}>
            + New Suite
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {suitesLoading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <SuiteTree
              tree={tree}
              selectedId={selectedSuiteId}
              onSelect={handleSuiteSelect}
              onCreateChild={handleCreateChild}
              onRename={handleRename}
              onDelete={handleDeleteSuite}
            />
          )}
        </ScrollArea>
      </aside>

      {/* Main content — split between case list and editor */}
      <main className="flex flex-1">
        {/* Case list panel */}
        {selectedSuiteId ? (
          <div className="flex w-72 shrink-0 flex-col border-r">
            {casesLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <CaseList
                cases={cases}
                selectedId={selectedCaseId}
                onSelect={(caseId) => {
                  setSelectedCaseId(caseId);
                  setEditorMode('edit');
                }}
                onCreate={() => {
                  setSelectedCaseId(null);
                  setEditorMode('create');
                }}
                onDelete={handleCaseDelete}
              />
            )}
          </div>
        ) : null}

        {/* Editor pane */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedSuiteId && (
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="mt-2 text-muted-foreground">{project.description}</p>
              )}
              <p className="mt-8 text-muted-foreground">
                Select a suite from the sidebar to view its test cases.
              </p>
            </div>
          )}

          {selectedSuiteId && editorMode === 'idle' && (
            <p className="text-muted-foreground">
              Select a test case or click &quot;+ New Case&quot; to create one.
            </p>
          )}

          {editorMode === 'create' && (
            <CaseEditor
              onSave={handleCaseSave}
              onCancel={() => setEditorMode('idle')}
              isPending={createCase.isPending}
            />
          )}

          {editorMode === 'edit' && selectedCase && (
            <CaseEditor
              key={selectedCase.id}
              testCase={selectedCase}
              onSave={handleCaseSave}
              onCancel={() => setEditorMode('idle')}
              isPending={updateCase.isPending}
            />
          )}
        </div>
      </main>

      {/* Create / Rename suite dialog */}
      <SuiteFormDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) setDialogState({ open: false, mode: 'create' });
        }}
        onSubmit={handleDialogSubmit}
        isPending={createSuite.isPending || updateSuite.isPending}
        title={dialogState.mode === 'create' ? 'Create Suite' : 'Rename Suite'}
        defaultValues={
          dialogState.mode === 'rename' && dialogState.node
            ? { name: dialogState.node.name, description: dialogState.node.description ?? '' }
            : undefined
        }
      />
    </div>
  );
}
