'use client';

import { CustomFieldType } from '@app/shared';
import type { CustomFieldDefinitionDto } from '@app/shared';
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

interface CustomFieldRendererProps {
  definition: CustomFieldDefinitionDto;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Renders a single custom field based on its definition type */
export function CustomFieldRenderer({
  definition,
  value,
  onChange,
  disabled = false,
}: CustomFieldRendererProps) {
  const fieldId = `custom-field-${definition.id}`;

  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId}>
        {definition.name}
        {definition.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {renderField(definition, value, onChange, disabled, fieldId)}
    </div>
  );
}

function renderField(
  definition: CustomFieldDefinitionDto,
  value: string,
  onChange: (value: string) => void,
  disabled: boolean,
  fieldId: string,
) {
  switch (definition.fieldType) {
    case CustomFieldType.STRING:
      return (
        <Input
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${definition.name.toLowerCase()}`}
          disabled={disabled}
        />
      );

    case CustomFieldType.NUMBER:
      return (
        <Input
          id={fieldId}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${definition.name.toLowerCase()}`}
          disabled={disabled}
        />
      );

    case CustomFieldType.DROPDOWN:
      return (
        <Select
          value={value}
          onValueChange={(val) => onChange(val ?? '')}
          disabled={disabled}
        >
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder={`Select ${definition.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(definition.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case CustomFieldType.CHECKBOX:
      return (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={fieldId}
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(String(!!checked))}
            disabled={disabled}
          />
          <Label htmlFor={fieldId} className="text-sm font-normal">
            {definition.name}
          </Label>
        </div>
      );

    case CustomFieldType.DATE:
      return (
        <Input
          id={fieldId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    default:
      return null;
  }
}
