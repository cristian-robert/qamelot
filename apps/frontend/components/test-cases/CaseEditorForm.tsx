'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import {
  type UpdateTestCaseInput,
  AutomationStatus,
  CasePriority,
  CaseType,
  TemplateType,
} from '@app/shared';
import { AutomationSection } from './AutomationSection';
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
import { StepEditor, type StepData } from './StepEditor';
import { ReferenceLinks } from './ReferenceLinks';

export interface CaseEditorFormProps {
  register: UseFormRegister<UpdateTestCaseInput>;
  control: Control<UpdateTestCaseInput>;
  errors: FieldErrors<UpdateTestCaseInput>;
  effectiveTemplate: TemplateType;
  steps: StepData[];
  setSteps: (steps: StepData[]) => void;
  automationStatus: AutomationStatus;
  automationId: string | null;
  automationFilePath: string | null;
  savedReferences: string | null;
  onSubmit: () => void;
}

export function CaseEditorForm({
  register,
  control,
  errors,
  effectiveTemplate,
  steps,
  setSteps,
  automationStatus,
  automationId,
  automationFilePath,
  savedReferences,
  onSubmit,
}: CaseEditorFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 p-4">
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
        {savedReferences && (
          <div className="mt-1">
            <ReferenceLinks references={savedReferences} />
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
            {...register('body')}
            className="min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Describe the full test procedure, expected behavior, and any notes.
          </p>
        </div>
      )}

      {/* Steps (when template is STEPS) */}
      {effectiveTemplate === TemplateType.STEPS && (
        <div className="space-y-2">
          <Label>Test Steps ({steps.length})</Label>
          {steps.length === 0 && automationStatus === AutomationStatus.AUTOMATED ? (
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
      <AutomationSection
        automationStatus={automationStatus}
        automationId={automationId}
        automationFilePath={automationFilePath}
      />
    </form>
  );
}
