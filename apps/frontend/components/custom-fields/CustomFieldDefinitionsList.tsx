'use client';

import { useState } from 'react';
import type {
  CustomFieldDefinitionDto,
  CreateCustomFieldDefinitionInput,
  UpdateCustomFieldDefinitionInput,
} from '@app/shared';
import { useCustomFieldDefinitions } from '@/lib/custom-fields/useCustomFields';
import { CustomFieldDefinitionForm } from './CustomFieldDefinitionForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { formatLabel } from '@/lib/format';

interface CustomFieldDefinitionsListProps {
  projectId: string;
}

const TYPE_COLORS: Record<string, string> = {
  STRING: 'bg-blue-100 text-blue-800',
  NUMBER: 'bg-green-100 text-green-800',
  DROPDOWN: 'bg-purple-100 text-purple-800',
  CHECKBOX: 'bg-orange-100 text-orange-800',
  DATE: 'bg-pink-100 text-pink-800',
};

export function CustomFieldDefinitionsList({ projectId }: CustomFieldDefinitionsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<CustomFieldDefinitionDto | null>(null);

  const {
    definitions,
    isLoading,
    createDefinition,
    updateDefinition,
    deleteDefinition,
  } = useCustomFieldDefinitions(projectId);

  const handleCreate = (data: CreateCustomFieldDefinitionInput) => {
    createDefinition.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  };

  const handleUpdate = (data: CreateCustomFieldDefinitionInput) => {
    if (!editingDef) return;
    const updateData: UpdateCustomFieldDefinitionInput = {
      name: data.name,
      fieldType: data.fieldType,
      options: data.options,
      required: data.required,
      position: data.position,
    };
    updateDefinition.mutate(
      { id: editingDef.id, data: updateData },
      {
        onSuccess: () => {
          setEditingDef(null);
          setDialogOpen(false);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteDefinition.mutate(id);
  };

  const openCreate = () => {
    setEditingDef(null);
    setDialogOpen(true);
  };

  const openEdit = (def: CustomFieldDefinitionDto) => {
    setEditingDef(def);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading custom fields...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Fields</h3>
        <Button size="sm" onClick={openCreate}>
          Add Field
        </Button>
      </div>

      {definitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom fields defined yet. Click &quot;Add Field&quot; to create one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applies To</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {definitions.map((def) => (
              <TableRow key={def.id}>
                <TableCell className="font-medium">{def.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={TYPE_COLORS[def.fieldType] ?? ''}
                  >
                    {formatLabel(def.fieldType)}
                  </Badge>
                </TableCell>
                <TableCell>{formatLabel(def.entityType)}</TableCell>
                <TableCell>{def.required ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(def)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(def.id)}
                      disabled={deleteDefinition.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDef ? 'Edit Custom Field' : 'Create Custom Field'}
            </DialogTitle>
          </DialogHeader>
          <CustomFieldDefinitionForm
            definition={editingDef ?? undefined}
            onSave={editingDef ? handleUpdate : handleCreate}
            onCancel={() => setDialogOpen(false)}
            isPending={createDefinition.isPending || updateDefinition.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
