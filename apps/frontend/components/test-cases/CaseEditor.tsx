'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreateTestCaseSchema,
  CasePriority,
  CaseType,
  TemplateType,
  type CreateTestCaseInput,
  type TestCaseDto,
} from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatLabel } from '@/lib/format';
import { ReferenceLinks } from '@/components/test-cases/ReferenceLinks';
import { CustomFieldsSection } from '@/components/custom-fields/CustomFieldsSection';
import { CustomFieldEntityType } from '@app/shared';
import { cn } from '@/lib/utils';

interface CaseEditorProps {
  testCase?: TestCaseDto;
  projectId?: string;
  onSave: (data: CreateTestCaseInput) => void;
  onCancel: () => void;
  isPending: boolean;
  onInsertSharedSteps?: () => void;
}

const PRIORITIES = Object.values(CasePriority);
const TYPES = Object.values(CaseType);

const PRIORITY_DOT_COLORS: Record<CasePriority, string> = {
  [CasePriority.CRITICAL]: 'bg-red-500',
  [CasePriority.HIGH]: 'bg-orange-500',
  [CasePriority.MEDIUM]: 'bg-blue-500',
  [CasePriority.LOW]: 'bg-gray-400',
};

export function CaseEditor({ testCase, projectId, onSave, onCancel, isPending, onInsertSharedSteps }: CaseEditorProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof CreateTestCaseSchema>>({
    resolver: zodResolver(CreateTestCaseSchema),
    defaultValues: {
      title: testCase?.title ?? '',
      preconditions: testCase?.preconditions ?? '',
      templateType: testCase?.templateType ?? TemplateType.TEXT,
      priority: testCase?.priority ?? CasePriority.MEDIUM,
      type: testCase?.type ?? CaseType.FUNCTIONAL,
      estimate: testCase?.estimate ?? null,
      references: testCase?.references ?? '',
    },
  });

  const referencesValue = watch('references');
  const templateValue = watch('templateType');

  return (
    <form onSubmit={handleSubmit(onSave as Parameters<typeof handleSubmit>[0])} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-[13px] font-semibold">Title</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Test case title"
          className="text-[13px]"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Template type toggle */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold">Template</Label>
        <Controller
          control={control}
          name="templateType"
          render={({ field }) => (
            <div className="inline-flex rounded-lg border p-0.5">
              {Object.values(TemplateType).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={cn(
                    'cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition-all',
                    field.value === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => field.onChange(t)}
                >
                  {t === TemplateType.TEXT ? 'Text' : 'Steps'}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Priority, Type, Estimate row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="priority" className="text-[13px] font-semibold">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority" className="text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-block size-2 rounded-full', PRIORITY_DOT_COLORS[field.value as CasePriority])} />
                    <SelectValue placeholder="Select priority" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-block size-2 rounded-full', PRIORITY_DOT_COLORS[p])} />
                        {formatLabel(p)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type" className="text-[13px] font-semibold">Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type" className="text-[13px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="cursor-pointer">
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimate" className="text-[13px] font-semibold">Estimate (min)</Label>
          <Input
            id="estimate"
            type="number"
            min={0}
            {...register('estimate', { valueAsNumber: true })}
            placeholder="0"
            className="text-[13px]"
          />
        </div>
      </div>

      {/* Preconditions */}
      <div className="space-y-1.5">
        <Label htmlFor="preconditions" className="text-[13px] font-semibold">Preconditions</Label>
        <Textarea
          id="preconditions"
          {...register('preconditions')}
          placeholder="Pre-conditions for this test case"
          rows={3}
          className="text-[13px]"
        />
      </div>

      {/* References */}
      <div className="space-y-1.5">
        <Label htmlFor="references" className="text-[13px] font-semibold">References</Label>
        <Input
          id="references"
          {...register('references')}
          placeholder="e.g. REQ-001, https://jira.example.com/PROJ-42"
          className="text-[13px]"
        />
        {errors.references && (
          <p className="text-xs text-destructive">{errors.references.message}</p>
        )}
        {referencesValue && (
          <div className="mt-1">
            <ReferenceLinks references={referencesValue} />
          </div>
        )}
      </div>

      {projectId && testCase && (
        <CustomFieldsSection
          projectId={projectId}
          entityType={CustomFieldEntityType.TEST_CASE}
          entityId={testCase.id}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-2 border-t pt-4">
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isPending ? 'Saving\u2026' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="cursor-pointer">
          Cancel
        </Button>
      </div>
    </form>
  );
}
