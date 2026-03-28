'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CustomFieldType, CustomFieldEntityType } from '@app/shared';
import { useCreateCustomFieldDefinition } from '@/lib/custom-fields/useCustomFields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const fieldTypeLabels: Record<string, string> = {
  [CustomFieldType.STRING]: 'Text',
  [CustomFieldType.NUMBER]: 'Number',
  [CustomFieldType.DROPDOWN]: 'Dropdown',
  [CustomFieldType.CHECKBOX]: 'Checkbox',
  [CustomFieldType.DATE]: 'Date',
};

interface CustomFieldFormDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomFieldFormDialog({
  projectId,
  open,
  onOpenChange,
}: CustomFieldFormDialogProps) {
  const createDefinition = useCreateCustomFieldDefinition(projectId);

  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<string>(CustomFieldType.STRING);
  const [entityType, setEntityType] = useState<string>(CustomFieldEntityType.TEST_CASE);
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  function resetForm() {
    setName('');
    setFieldType(CustomFieldType.STRING);
    setEntityType(CustomFieldEntityType.TEST_CASE);
    setRequired(false);
    setOptions([]);
    setNewOption('');
  }

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
    if (!value) resetForm();
  }

  function addOption() {
    const trimmed = newOption.trim();
    if (!trimmed || options.includes(trimmed)) return;
    setOptions([...options, trimmed]);
    setNewOption('');
  }

  function removeOption(opt: string) {
    setOptions(options.filter((o) => o !== opt));
  }

  function handleCreate() {
    if (!name.trim()) return;
    createDefinition.mutate(
      {
        name: name.trim(),
        fieldType: fieldType as CustomFieldType,
        entityType: entityType as CustomFieldEntityType,
        required,
        options: fieldType === CustomFieldType.DROPDOWN ? options : undefined,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  }

  const isSubmitDisabled =
    !name.trim() ||
    (fieldType === CustomFieldType.DROPDOWN && options.length === 0) ||
    createDefinition.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Field</DialogTitle>
          <DialogDescription>
            Define a custom field for test cases or test results.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cf-name">Name</Label>
            <Input
              id="cf-name"
              placeholder="Field name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={fieldType} onValueChange={(v) => v && setFieldType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CustomFieldType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {fieldTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={entityType} onValueChange={(v) => v && setEntityType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CustomFieldEntityType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={required} onCheckedChange={setRequired} />
            <Label>Required</Label>
          </div>

          {fieldType === CustomFieldType.DROPDOWN && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add option"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <Badge key={opt} variant="secondary" className="gap-1">
                    {opt}
                    <button
                      onClick={() => removeOption(opt)}
                      className="ml-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isSubmitDisabled}>
            {createDefinition.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
