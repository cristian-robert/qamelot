'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UpdateTestCaseSchema,
  type UpdateTestCaseInput,
  type TestCaseStepDto,
  AutomationStatus,
  CasePriority,
  CaseType,
  TemplateType,
} from '@app/shared';
import { useTestCase, useUpdateTestCase } from '@/lib/test-cases/useTestCases';
import { testCasesApi } from '@/lib/api/test-cases';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Undo2, Clock } from 'lucide-react';
import { CaseEditorSkeleton } from './CaseEditorSkeleton';
import { StepEditor, type StepData } from './StepEditor';
import { ReferenceLinks } from './ReferenceLinks';
import { CaseHistoryPanel } from './CaseHistoryPanel';
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
          const origSteps = originalStepsRef.current;
          const origIds = new Set(origSteps.map((s) => s.id));

          // Delete removed steps
          for (const orig of origSteps) {
            const stillExists = steps.some((s) => s.id === orig.id);
            if (!stillExists) {
              await testCasesApi.deleteStep(projectId, caseId, orig.id);
            }
          }

          // Create new steps and update existing
          for (const step of steps) {
            if (step.id && origIds.has(step.id)) {
              // Update existing step
              const orig = origSteps.find((o) => o.id === step.id);
              if (orig && (orig.description !== step.description || orig.expectedResult !== step.expectedResult)) {
                await testCasesApi.updateStep(projectId, caseId, step.id, {
                  description: step.description,
                  expectedResult: step.expectedResult,
                });
              }
            } else {
              // Create new step
              await testCasesApi.createStep(projectId, caseId, {
                description: step.description || 'New step',
                expectedResult: step.expectedResult || 'Expected result',
              });
            }
          }

          // Reorder if needed (get fresh step ids after creates)
          const freshSteps = await testCasesApi.listSteps(projectId, caseId);
          if (freshSteps.length > 1) {
            // Build desired order based on current step descriptions
            const orderedIds = steps
              .map((s) => {
                if (s.id && freshSteps.some((fs) => fs.id === s.id)) return s.id;
                // For newly created steps, match by description
                return freshSteps.find(
                  (fs) => fs.description === (s.description || 'New step') && !steps.some((existing) => existing.id === fs.id),
                )?.id;
              })
              .filter(Boolean) as string[];

            if (orderedIds.length === freshSteps.length) {
              await testCasesApi.reorderSteps(projectId, caseId, orderedIds);
            }
          }
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
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Test case not found.
      </div>
    );
  }

  const effectiveTemplate = templateType ?? testCase.templateType;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="truncate text-sm font-semibold">{testCase.title}</h2>
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 p-4"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="case-title">Title</Label>
            <Input
              id="case-title"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Template Toggle */}
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Controller
              name="templateType"
              control={control}
              render={({ field }) => (
                <Tabs
                  value={field.value ?? TemplateType.STEPS}
                  onValueChange={(val) => field.onChange(val)}
                >
                  <TabsList>
                    <TabsTrigger value={TemplateType.TEXT}>Text</TabsTrigger>
                    <TabsTrigger value={TemplateType.STEPS}>Steps</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </div>

          {/* Priority / Type / Estimate row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? CasePriority.MEDIUM}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CasePriority).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0) + p.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? CaseType.FUNCTIONAL}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CaseType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="case-estimate">Estimate (min)</Label>
              <Input
                id="case-estimate"
                type="number"
                min={0}
                {...register('estimate', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Preconditions */}
          <div className="space-y-1.5">
            <Label htmlFor="case-preconditions">Preconditions</Label>
            <Textarea
              id="case-preconditions"
              placeholder="Any setup steps or conditions required before running this case..."
              {...register('preconditions')}
              className="min-h-16"
            />
          </div>

          {/* References */}
          <div className="space-y-1.5">
            <Label htmlFor="case-references">References</Label>
            <Input
              id="case-references"
              placeholder="e.g. JIRA-123, REQ-456"
              {...register('references')}
            />
            {testCase.references && (
              <div className="mt-1">
                <ReferenceLinks references={testCase.references} />
              </div>
            )}
          </div>

          <Separator />

          {/* TEXT template body */}
          {effectiveTemplate === TemplateType.TEXT && (
            <div className="space-y-1.5">
              <Label htmlFor="case-body">Test Description</Label>
              <Textarea
                id="case-body"
                placeholder="Describe the test procedure, expected behavior, and any notes..."
                {...register('preconditions')}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                For text-based test cases, use the preconditions field to describe the full test procedure.
              </p>
            </div>
          )}

          {/* Steps (when template is STEPS) */}
          {effectiveTemplate === TemplateType.STEPS && (
            <div className="space-y-2">
              <Label>Test Steps ({steps.length})</Label>
              {steps.length === 0 && testCase.automationStatus === AutomationStatus.AUTOMATED ? (
                <div className="rounded-lg border border-dashed py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    This is an automated test — manual steps are not required.
                  </p>
                </div>
              ) : (
                <StepEditor steps={steps} onChange={setSteps} />
              )}
            </div>
          )}

          <Separator />

          {/* Automation Section (read-only) */}
          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="text-sm font-medium text-muted-foreground">Automation</h4>
            {testCase.automationStatus === AutomationStatus.NOT_AUTOMATED ? (
              <p className="text-sm text-muted-foreground">
                Not linked to any automated test.
              </p>
            ) : (
              <div className="space-y-2">
                <Badge variant={testCase.automationStatus === AutomationStatus.AUTOMATED ? 'default' : 'destructive'}>
                  {testCase.automationStatus === AutomationStatus.AUTOMATED ? 'Automated' : 'Needs Update'}
                </Badge>
                {testCase.automationId && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Automation ID</span>
                    <p className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                      {testCase.automationId}
                    </p>
                  </div>
                )}
                {testCase.automationFilePath && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Spec File</span>
                    <p className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                      {testCase.automationFilePath}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  This test case is linked to an automated Playwright test.
                </p>
              </div>
            )}
          </div>
        </form>
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
