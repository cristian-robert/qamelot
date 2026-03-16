'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateCustomFieldDefinitionSchema,
  CustomFieldType,
  CustomFieldEntityType,
  type CreateCustomFieldDefinitionInput,
  type CustomFieldDefinitionDto,
} from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatLabel } from '@/lib/format';

const FIELD_TYPES = Object.values(CustomFieldType);
const ENTITY_TYPES = Object.values(CustomFieldEntityType);

interface CustomFieldDefinitionFormProps {
  definition?: CustomFieldDefinitionDto;
  onSave: (data: CreateCustomFieldDefinitionInput) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CustomFieldDefinitionForm({
  definition,
  onSave,
  onCancel,
  isPending,
}: CustomFieldDefinitionFormProps) {
  const [options, setOptions] = useState<string[]>(
    (definition?.options as string[] | null) ?? [''],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateCustomFieldDefinitionInput>({
    resolver: zodResolver(CreateCustomFieldDefinitionSchema),
    defaultValues: {
      name: definition?.name ?? '',
      fieldType: definition?.fieldType ?? CustomFieldType.STRING,
      entityType: definition?.entityType ?? CustomFieldEntityType.TEST_CASE,
      required: definition?.required ?? false,
      options: definition?.options ?? undefined,
      position: definition?.position ?? 0,
    },
  });

  const fieldType = watch('fieldType');

  const handleAddOption = () => setOptions((prev) => [...prev, '']);

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const onSubmit = (data: CreateCustomFieldDefinitionInput) => {
    const payload: CreateCustomFieldDefinitionInput = {
      ...data,
      options: data.fieldType === 'DROPDOWN' ? options.filter((o) => o.trim() !== '') : null,
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cf-name">Field Name</Label>
        <Input id="cf-name" {...register('name')} placeholder="e.g. Browser, Environment" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cf-fieldType">Field Type</Label>
          <Controller
            control={control}
            name="fieldType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="cf-fieldType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cf-entityType">Applies To</Label>
          <Controller
            control={control}
            name="entityType"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!!definition}
              >
                <SelectTrigger id="cf-entityType">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => (
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

      {fieldType === 'DROPDOWN' && (
        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveOption(i)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
            Add Option
          </Button>
          {errors.options && (
            <p className="text-sm text-destructive">{errors.options.message}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="required"
          render={({ field }) => (
            <Checkbox
              id="cf-required"
              checked={field.value ?? false}
              onCheckedChange={(checked) => field.onChange(!!checked)}
            />
          )}
        />
        <Label htmlFor="cf-required" className="text-sm font-normal">
          Required field
        </Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : definition ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
