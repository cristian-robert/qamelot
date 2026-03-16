'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreateTestCaseSchema,
  TestCasePriority,
  TestCaseType,
  type CreateTestCaseInput,
  type TestCaseDto,
} from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StepEditor } from './StepEditor';
import { formatLabel } from '@/lib/format';

interface CaseEditorProps {
  testCase?: TestCaseDto;
  onSave: (data: CreateTestCaseInput) => void;
  onCancel: () => void;
  isPending: boolean;
}

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const TYPES = ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'] as const;

export function CaseEditor({ testCase, onSave, onCancel, isPending }: CaseEditorProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof CreateTestCaseSchema>>({
    resolver: zodResolver(CreateTestCaseSchema),
    defaultValues: {
      title: testCase?.title ?? '',
      preconditions: testCase?.preconditions ?? '',
      steps: testCase?.steps ?? [],
      priority: testCase?.priority ?? TestCasePriority.MEDIUM,
      type: testCase?.type ?? TestCaseType.FUNCTIONAL,
      automationFlag: testCase?.automationFlag ?? false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} placeholder="Test case title" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="preconditions">Preconditions</Label>
        <Textarea
          id="preconditions"
          {...register('preconditions')}
          placeholder="Pre-conditions for this test case"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority">
                  <SelectValue formatter={formatLabel} />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {formatLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="type">Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="type">
                  <SelectValue formatter={formatLabel} />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="automationFlag"
          render={({ field }) => (
            <Checkbox
              id="automationFlag"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="automationFlag">Automated</Label>
      </div>

      <Controller
        control={control}
        name="steps"
        render={({ field }) => (
          <StepEditor steps={field.value ?? []} onChange={field.onChange} />
        )}
      />

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
