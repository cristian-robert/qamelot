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
import { cn } from '@/lib/utils';
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

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'editor', label: 'Details' },
    { key: 'history', label: 'History' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h3 className="text-[13px] font-semibold">
          {testCase ? 'Edit Test Case' : 'Loading...'}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Close editor"
          className="size-7 cursor-pointer p-0"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cn(
              'relative cursor-pointer px-3 py-2.5 text-[13px] font-medium transition-colors',
              activeTab === tab.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
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
              <p className="text-[13px] text-muted-foreground">Test case not found.</p>
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
