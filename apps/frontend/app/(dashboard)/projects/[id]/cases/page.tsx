'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useProject } from '@/lib/projects/useProjects';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { useBulkMoveCases, useBulkUpdateCases, useBulkDeleteCases } from '@/lib/test-cases/useTestCases';
import { useSelection } from '@/lib/test-cases/useSelection';
import type { CasePriority, CaseType, TestSuiteDto } from '@app/shared';
import { Button } from '@/components/ui/button';
import { SuiteTree } from '@/components/test-suites/SuiteTree';
import { CaseListPanel } from '@/components/test-cases/CaseListPanel';
import { CaseEditorPanel } from '@/components/test-cases/CaseEditorPanel';
import { BulkToolbar } from '@/components/test-cases/BulkToolbar';
import { BulkUpdateDialog } from '@/components/test-cases/BulkUpdateDialog';
import type { BulkUpdateDialogOption } from '@/components/test-cases/BulkUpdateDialog';
import { CsvExportButton } from '@/components/test-cases/CsvExportButton';
import { CsvImportWizard } from '@/components/test-cases/CsvImportWizard';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

type BulkDialogType = 'move' | 'priority' | 'type' | null;

export default function TestCasesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project } = useProject(projectId);

  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkDialog, setBulkDialog] = useState<BulkDialogType>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkValue, setBulkValue] = useState('');

  const selection = useSelection();
  const { data: suites } = useTestSuites(projectId);
  const bulkMoveMutation = useBulkMoveCases(projectId);
  const bulkUpdateMutation = useBulkUpdateCases(projectId);
  const bulkDeleteMutation = useBulkDeleteCases(projectId);

  const selectedSuite = useMemo(
    () => suites?.find((s: TestSuiteDto) => s.id === selectedSuiteId) ?? null,
    [suites, selectedSuiteId],
  );

  const toOption = (v: string): BulkUpdateDialogOption => ({
    value: v,
    label: v.charAt(0) + v.slice(1).toLowerCase(),
  });

  const moveOptions: BulkUpdateDialogOption[] = useMemo(
    () =>
      (suites ?? [])
        .filter((s: TestSuiteDto) => s.id !== selectedSuiteId)
        .map((s: TestSuiteDto) => ({ value: s.id, label: s.name })),
    [suites, selectedSuiteId],
  );

  const priorityOptions = useMemo(
    () => ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(toOption),
    [],
  );

  const typeOptions = useMemo(
    () => ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'EXPLORATORY', 'OTHER'].map(toOption),
    [],
  );

  const handleSelectSuite = useCallback(
    (suiteId: string) => {
      setSelectedSuiteId(suiteId);
      setSelectedCaseId(null);
      selection.clear();
    },
    [selection],
  );

  const handleSelectCase = useCallback((caseId: string) => {
    setSelectedCaseId(caseId);
  }, []);

  const handleBulkMove = useCallback(async () => {
    if (!bulkValue) return;
    const caseIds = Array.from(selection.selected);
    await bulkMoveMutation.mutateAsync({ caseIds, targetSuiteId: bulkValue });
    selection.clear();
    setBulkDialog(null);
    setBulkValue('');
    toast.success(`Moved ${caseIds.length} case(s)`);
  }, [bulkValue, selection, bulkMoveMutation]);

  const handleBulkPriority = useCallback(async () => {
    if (!bulkValue) return;
    const caseIds = Array.from(selection.selected);
    await bulkUpdateMutation.mutateAsync({
      caseIds,
      fields: { priority: bulkValue as CasePriority },
    });
    selection.clear();
    setBulkDialog(null);
    setBulkValue('');
    toast.success(`Updated priority for ${caseIds.length} case(s)`);
  }, [bulkValue, selection, bulkUpdateMutation]);

  const handleBulkType = useCallback(async () => {
    if (!bulkValue) return;
    const caseIds = Array.from(selection.selected);
    await bulkUpdateMutation.mutateAsync({
      caseIds,
      fields: { type: bulkValue as CaseType },
    });
    selection.clear();
    setBulkDialog(null);
    setBulkValue('');
    toast.success(`Updated type for ${caseIds.length} case(s)`);
  }, [bulkValue, selection, bulkUpdateMutation]);

  const handleBulkDelete = useCallback(async () => {
    const caseIds = Array.from(selection.selected);
    await bulkDeleteMutation.mutateAsync({ caseIds });
    selection.clear();
    setDeleteConfirmOpen(false);
    if (selectedCaseId && caseIds.includes(selectedCaseId)) {
      setSelectedCaseId(null);
    }
    toast.success(`Deleted ${caseIds.length} case(s)`);
  }, [selection, bulkDeleteMutation, selectedCaseId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Breadcrumb + Page header */}
      <div className="shrink-0 space-y-4 px-6 pt-6 pb-4">
        <Breadcrumb
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project?.name ?? '...', href: `/projects/${projectId}` },
            { label: 'Test Cases' },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Test Cases</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage test suites and cases for this project
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CsvExportButton projectId={projectId} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1.5 size-3.5" />
              Import CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Three-pane layout */}
      <div className="mx-6 mb-6 flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
        <SuiteTree
          projectId={projectId}
          selectedSuiteId={selectedSuiteId}
          onSelectSuite={handleSelectSuite}
        />
        <CaseListPanel
          projectId={projectId}
          suiteId={selectedSuiteId}
          suiteName={selectedSuite?.name}
          selectedCaseId={selectedCaseId}
          onSelectCase={handleSelectCase}
          selection={selection}
        />
        <CaseEditorPanel projectId={projectId} caseId={selectedCaseId} />
      </div>

      {/* Bulk action toolbar */}
      <BulkToolbar
        count={selection.count}
        onMove={() => {
          setBulkValue('');
          setBulkDialog('move');
        }}
        onSetPriority={() => {
          setBulkValue('');
          setBulkDialog('priority');
        }}
        onSetType={() => {
          setBulkValue('');
          setBulkDialog('type');
        }}
        onDelete={() => setDeleteConfirmOpen(true)}
        onClose={selection.clear}
      />

      {/* Bulk move dialog */}
      <BulkUpdateDialog
        open={bulkDialog === 'move'}
        onOpenChange={(open) => !open && setBulkDialog(null)}
        title={`Move ${selection.count} case(s)`}
        description="Select the target suite to move the selected cases."
        placeholder="Select target suite"
        options={moveOptions}
        value={bulkValue}
        onValueChange={setBulkValue}
        onConfirm={handleBulkMove}
        isPending={bulkMoveMutation.isPending}
        confirmLabel="Move"
      />

      {/* Bulk priority dialog */}
      <BulkUpdateDialog
        open={bulkDialog === 'priority'}
        onOpenChange={(open) => !open && setBulkDialog(null)}
        title={`Set priority for ${selection.count} case(s)`}
        description="Choose a priority to apply to all selected cases."
        placeholder="Select priority"
        options={priorityOptions}
        value={bulkValue}
        onValueChange={setBulkValue}
        onConfirm={handleBulkPriority}
        isPending={bulkUpdateMutation.isPending}
      />

      {/* Bulk type dialog */}
      <BulkUpdateDialog
        open={bulkDialog === 'type'}
        onOpenChange={(open) => !open && setBulkDialog(null)}
        title={`Set type for ${selection.count} case(s)`}
        description="Choose a type to apply to all selected cases."
        placeholder="Select type"
        options={typeOptions}
        value={bulkValue}
        onValueChange={setBulkValue}
        onConfirm={handleBulkType}
        isPending={bulkUpdateMutation.isPending}
      />

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${selection.count} case(s)?`}
        description="This action cannot be undone. All selected test cases will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={handleBulkDelete}
        loading={bulkDeleteMutation.isPending}
      />

      {/* CSV import wizard */}
      <CsvImportWizard
        projectId={projectId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
