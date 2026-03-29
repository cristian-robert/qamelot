'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UpdateTestCaseSchema,
  type UpdateTestCaseInput,
  type TestCaseStepDto,
  TemplateType,
} from '@app/shared';
import { useTestCase, useUpdateTestCase } from '@/lib/test-cases/useTestCases';
import { syncSteps } from './StepSyncLogic';
import { CaseEditorForm } from './CaseEditorForm';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Undo2, Clock } from 'lucide-react';
import { CaseEditorSkeleton } from './CaseEditorSkeleton';
import type { StepData } from './StepEditor';
import { CaseHistoryPanel } from './CaseHistoryPanel';
import { stripTitleQuotes } from '@/lib/format';
import { toast } from 'sonner';

interface CaseEditorProps {
  projectId: string;
  caseId: string;
}

export function CaseEditor({ projectId, caseId }: CaseEditorProps) {
  const { data: testCase, isLoading } = useTestCase(projectId, caseId);
  const updateMutation = useUpdateTestCase(projectId);
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [steps, setSteps] = useState<StepData[]>([]);
  const [saving, setSaving] = useState(false);
  // Track original steps from server to diff against
  const originalStepsRef = useRef<TestCaseStepDto[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateTestCaseInput>({
    resolver: zodResolver(UpdateTestCaseSchema),
  });

  const templateType = watch('templateType');

  useEffect(() => {
    if (testCase) {
      reset({
        title: testCase.title,
        priority: testCase.priority,
        type: testCase.type,
        templateType: testCase.templateType,
        estimate: testCase.estimate,
        preconditions: testCase.preconditions ?? '',
        body: testCase.body ?? '',
        references: testCase.references ?? '',
      });
      const serverSteps = (testCase as unknown as { steps?: TestCaseStepDto[] }).steps ?? [];
      originalStepsRef.current = serverSteps;
      setSteps(
        serverSteps.map((s) => ({
          id: s.id,
          description: s.description,
          expectedResult: s.expectedResult,
        })),
      );
    }
  }, [testCase, reset]);

  // Check if steps have changed compared to original
  const stepsChanged = useCallback(() => {
    const orig = originalStepsRef.current;
    if (steps.length !== orig.length) return true;
    return steps.some((step, i) => {
      const o = orig[i];
      return step.description !== o.description || step.expectedResult !== o.expectedResult || step.id !== o.id;
    });
  }, [steps]);

  const hasChanges = isDirty || stepsChanged();

  const onSubmit = useCallback(
    async (data: UpdateTestCaseInput) => {
      setSaving(true);
      try {
        // 1. Save case metadata
        const cleanData = { ...data };
        // Convert NaN estimate to null
        if (cleanData.estimate !== undefined && cleanData.estimate !== null && isNaN(cleanData.estimate)) {
          cleanData.estimate = null;
        }
        await updateMutation.mutateAsync({ id: caseId, data: cleanData });

        // 2. Sync steps if template is STEPS
        const currentTemplate = data.templateType ?? testCase?.templateType;
        if (currentTemplate === TemplateType.STEPS) {
          await syncSteps(projectId, caseId, steps, originalStepsRef.current);
        }

        // 3. Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['test-cases'] });
        toast.success('Test case saved');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [caseId, projectId, testCase, steps, updateMutation, queryClient],
  );

  const handleDiscard = useCallback(() => {
    if (testCase) {
      reset({
        title: testCase.title,
        priority: testCase.priority,
        type: testCase.type,
        templateType: testCase.templateType,
        estimate: testCase.estimate,
        preconditions: testCase.preconditions ?? '',
        body: testCase.body ?? '',
        references: testCase.references ?? '',
      });
      const serverSteps = (testCase as unknown as { steps?: TestCaseStepDto[] }).steps ?? [];
      setSteps(
        serverSteps.map((s) => ({
          id: s.id,
          description: s.description,
          expectedResult: s.expectedResult,
        })),
      );
    }
  }, [testCase, reset]);

  if (isLoading) {
    return <CaseEditorSkeleton />;
  }

  if (!testCase) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Test case not found.
      </div>
    );
  }

  const effectiveTemplate = templateType ?? testCase.templateType;

  return (
    <div className="flex min-h-0 h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="truncate text-sm font-semibold">{stripTitleQuotes(testCase.title)}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Toggle history"
          >
            <Clock className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={!hasChanges}
          >
            <Undo2 className="mr-1 size-3" />
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit(onSubmit)}
            disabled={!hasChanges || saving}
          >
            <Save className="mr-1 size-3" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <CaseEditorForm
          register={register}
          control={control}
          errors={errors}
          effectiveTemplate={effectiveTemplate}
          steps={steps}
          setSteps={setSteps}
          automationStatus={testCase.automationStatus}
          automationId={testCase.automationId}
          automationFilePath={testCase.automationFilePath}
          savedReferences={testCase.references}
          onSubmit={handleSubmit(onSubmit)}
        />
      </div>

      {/* History slide-in */}
      {showHistory && (
        <>
          <Separator />
          <div className="max-h-60 overflow-y-auto border-t bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Change History
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setShowHistory(false)}
              >
                <span className="sr-only">Close history</span>
                &times;
              </Button>
            </div>
            <CaseHistoryPanel projectId={projectId} caseId={caseId} />
          </div>
        </>
      )}
    </div>
  );
}
