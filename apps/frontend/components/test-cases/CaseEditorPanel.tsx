'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { testCasesApi } from '@/lib/api/test-cases';
import { testCasesQueryKey } from '@/lib/test-cases/useTestCases';
import { CaseEditor } from './CaseEditor';
import { CaseEditorSkeleton } from './CaseEditorSkeleton';
import { CaseHistoryPanel } from './CaseHistoryPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';

type Tab = 'editor' | 'history';

interface CaseEditorPanelProps {
  projectId: string;
  suiteId: string;
  caseId: string;
  onClose: () => void;
}

export function CaseEditorPanel({ projectId, suiteId, caseId, onClose }: CaseEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const queryClient = useQueryClient();

  const { data: testCase, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'cases', caseId],
    queryFn: () => testCasesApi.getById(projectId, caseId),
    enabled: !!caseId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTestCaseInput) =>
      testCasesApi.update(projectId, caseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: testCasesQueryKey(projectId, suiteId),
      });
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'cases', caseId],
      });
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'cases', caseId, 'history'],
      });
    },
  });

  const handleSave = (data: CreateTestCaseInput) => {
    const updateData: UpdateTestCaseInput = {
      title: data.title,
      preconditions: data.preconditions ?? null,
      priority: data.priority,
      type: data.type,
      templateType: data.templateType,
      estimate: data.estimate,
      references: data.references,
    };
    updateMutation.mutate(updateData);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">
          {testCase ? 'Edit Test Case' : 'Loading...'}
        </h3>
        <Button size="sm" variant="ghost" onClick={onClose} aria-label="Close editor">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex border-b">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'editor'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('editor')}
        >
          Details
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'editor' ? (
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading ? (
              <CaseEditorSkeleton />
            ) : testCase ? (
              <CaseEditor
                key={testCase.id}
                testCase={testCase}
                projectId={projectId}
                onSave={handleSave}
                onCancel={onClose}
                isPending={updateMutation.isPending}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Test case not found.</p>
            )}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 overflow-hidden">
          <CaseHistoryPanel projectId={projectId} caseId={caseId} />
        </div>
      )}
    </div>
  );
}
