'use client';

import { use, useState } from 'react';
import { Plus, SlidersHorizontal, X } from 'lucide-react';
import {
  CustomFieldType,
  CustomFieldEntityType,
} from '@app/shared';
import type { CustomFieldDefinitionDto } from '@app/shared';
import { useProject } from '@/lib/projects/useProjects';
import {
  useCustomFieldDefinitions,
  useCreateCustomFieldDefinition,
  useDeleteCustomFieldDefinition,
} from '@/lib/custom-fields/useCustomFields';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const fieldTypeLabels: Record<string, string> = {
  [CustomFieldType.STRING]: 'Text',
  [CustomFieldType.NUMBER]: 'Number',
  [CustomFieldType.DROPDOWN]: 'Dropdown',
  [CustomFieldType.CHECKBOX]: 'Checkbox',
  [CustomFieldType.DATE]: 'Date',
};

export default function CustomFieldsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project } = useProject(projectId);
  const { data: definitions, isLoading, isError, refetch } = useCustomFieldDefinitions(projectId);
  const createDefinition = useCreateCustomFieldDefinition(projectId);
  const deleteDefinition = useDeleteCustomFieldDefinition(projectId);

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomFieldDefinitionDto | null>(null);
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
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: project?.name ?? '...', href: `/projects/${projectId}` },
          { label: 'Custom Fields' },
        ]}
      />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <PageHeader
          title="Custom Fields"
          action={
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              New Field
            </DialogTrigger>
          }
        />
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
                <Switch
                  checked={required}
                  onCheckedChange={setRequired}
                />
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
              <Button
                onClick={handleCreate}
                disabled={
                  !name.trim() ||
                  (fieldType === CustomFieldType.DROPDOWN && options.length === 0) ||
                  createDefinition.isPending
                }
              >
                {createDefinition.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : definitions?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Options</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {definitions.map((def: CustomFieldDefinitionDto) => (
              <TableRow key={def.id}>
                <TableCell className="font-medium">{def.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{fieldTypeLabels[def.fieldType] ?? def.fieldType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {def.entityType.replace('_', ' ')}
                </TableCell>
                <TableCell>{def.required ? 'Yes' : 'No'}</TableCell>
                <TableCell className="max-w-xs">
                  {def.options?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {def.options.map((opt) => (
                        <Badge key={opt} variant="secondary" className="text-xs">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{'\u2014'}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(def)}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={SlidersHorizontal}
          title="No custom fields defined"
          description="Add fields to extend your test data."
          action={
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              New Field
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Custom Field"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteDefinition.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        loading={deleteDefinition.isPending}
      />
    </div>
  );
}
