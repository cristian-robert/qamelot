'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { SuiteTree } from '@/components/test-suites/SuiteTree';
import { SuiteFormDialog } from '@/components/test-suites/SuiteFormDialog';
import { CaseListPanel } from '@/components/test-cases/CaseListPanel';
import { CaseEditorPanel } from '@/components/test-cases/CaseEditorPanel';
import { CsvExportButton } from '@/components/test-cases/CsvExportButton';
import { CsvImportWizard } from '@/components/test-cases/CsvImportWizard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectOverview, DetailSkeleton, ErrorState } from './ProjectOverview';
import type { TreeNode } from '@/lib/test-suites/tree-utils';
import type { CreateTestSuiteInput, TestCaseDto } from '@app/shared';

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

  const { suites, tree, isLoading: suitesLoading, createSuite, updateSuite, deleteSuite } =
    useTestSuites(id);

  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    parentId?: string;
    node?: TreeNode;
  }>({ open: false, mode: 'create' });

  const [importOpen, setImportOpen] = useState(false);

  const handleSelectSuite = useCallback((suiteId: string) => {
    setSelectedSuiteId(suiteId);
    setSelectedCaseId(null);
  }, []);

  const handleSelectCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedCaseId(null);
  }, []);

  const handleCaseCreated = useCallback((tc: TestCaseDto) => {
    setSelectedCaseId(tc.id);
  }, []);

  const handleCreateRoot = () => {
    setDialogState({ open: true, mode: 'create' });
  };

  const handleCreateChild = (parentId: string) => {
    setDialogState({ open: true, mode: 'create', parentId });
  };

  const handleRename = (node: TreeNode) => {
    setDialogState({ open: true, mode: 'rename', node });
  };

  const handleDelete = (node: TreeNode) => {
    if (window.confirm(`Delete "${node.name}" and all its children?`)) {
      deleteSuite.mutate(node.id);
      if (selectedSuiteId === node.id) {
        setSelectedSuiteId(null);
        setSelectedCaseId(null);
      }
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

  // Keyboard shortcut: Escape to close the case editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCaseId) {
        e.preventDefault();
        setSelectedCaseId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCaseId]);

  if (projectLoading) {
    return <DetailSkeleton />;
  }

  if (projectError || !project) {
    return <ErrorState />;
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Pane 1: Suite Tree sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <h2 className="text-[13px] font-semibold">Suites</h2>
          <Button size="sm" variant="ghost" className="h-7 cursor-pointer text-xs" onClick={handleCreateRoot}>
            + New Suite
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {suitesLoading ? (
            <div className="space-y-2 px-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <SuiteTree
              tree={tree}
              selectedId={selectedSuiteId}
              onSelect={handleSelectSuite}
              onCreateChild={handleCreateChild}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )}
        </ScrollArea>
      </aside>

      {/* Pane 2 & 3: Case list + Editor, or Project Overview */}
      {selectedSuiteId ? (
        <>
          {/* Pane 2: Case List */}
          <div className="flex w-[340px] shrink-0 flex-col border-r bg-card">
            <CaseListPanel
              projectId={id}
              suiteId={selectedSuiteId}
              suites={suites}
              selectedCaseId={selectedCaseId}
              onSelectCase={handleSelectCase}
              onCaseCreated={handleCaseCreated}
            />
          </div>

          {/* Pane 3: Case Editor */}
          {selectedCaseId ? (
            <div className="flex min-w-0 flex-1 flex-col bg-card">
              <CaseEditorPanel
                key={selectedCaseId}
                projectId={id}
                suiteId={selectedSuiteId}
                caseId={selectedCaseId}
                onClose={handleCloseEditor}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-background">
              <div className="text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <svg className="size-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-muted-foreground">
                  Select a test case to view or edit it.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background">
          <ProjectOverview
            id={id}
            name={project.name}
            description={project.description}
          />
          <div className="flex items-center gap-2">
            <CsvExportButton projectId={id} />
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1.5 size-4" />
              Import CSV
            </Button>
          </div>
        </div>
      )}

      {/* Create / Rename dialog */}
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

      {/* CSV Import Wizard */}
      <CsvImportWizard
        projectId={id}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
