'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreateTestCaseSchema,
  CasePriority,
  CaseType,
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

interface CaseEditorProps {
  testCase?: TestCaseDto;
  onSave: (data: CreateTestCaseInput) => void;
  onCancel: () => void;
  isPending: boolean;
}

const PRIORITIES = Object.values(CasePriority);
const TYPES = Object.values(CaseType);

export function CaseEditor({ testCase, onSave, onCancel, isPending }: CaseEditorProps) {
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
      priority: testCase?.priority ?? CasePriority.MEDIUM,
      type: testCase?.type ?? CaseType.FUNCTIONAL,
      references: testCase?.references ?? '',
    },
  });

  const referencesValue = watch('references');

  return (
    <form onSubmit={handleSubmit(onSave as Parameters<typeof handleSubmit>[0])} className="space-y-4">
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
                  <SelectValue placeholder="Select priority" />
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
                  <SelectValue placeholder="Select type" />
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

      <div className="space-y-1">
        <Label htmlFor="references">References</Label>
        <Input
          id="references"
          {...register('references')}
          placeholder="e.g. REQ-001, https://jira.example.com/PROJ-42"
        />
        {errors.references && (
          <p className="text-sm text-destructive">{errors.references.message}</p>
        )}
        {referencesValue && (
          <div className="mt-1">
            <ReferenceLinks references={referencesValue} />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving\u2026' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
