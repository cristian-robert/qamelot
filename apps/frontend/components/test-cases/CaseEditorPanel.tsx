'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { testCasesApi } from '@/lib/api/test-cases';
import { testCasesQueryKey } from '@/lib/test-cases/useTestCases';
import { CaseEditor } from './CaseEditor';
import { CaseEditorSkeleton } from './CaseEditorSkeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';

interface CaseEditorPanelProps {
  projectId: string;
  suiteId: string;
  caseId: string;
  onClose: () => void;
}

export function CaseEditorPanel({ projectId, suiteId, caseId, onClose }: CaseEditorPanelProps) {
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

      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <CaseEditorSkeleton />
          ) : testCase ? (
            <CaseEditor
              key={testCase.id}
              testCase={testCase}
              onSave={handleSave}
              onCancel={onClose}
              isPending={updateMutation.isPending}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Test case not found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
