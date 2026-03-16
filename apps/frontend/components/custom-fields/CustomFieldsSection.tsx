'use client';

import { useState, useCallback, useEffect } from 'react';
import { CustomFieldEntityType } from '@app/shared';
import { useCustomFieldDefinitions, useCustomFieldValues } from '@/lib/custom-fields/useCustomFields';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { Button } from '@/components/ui/button';

interface CustomFieldsSectionProps {
  projectId: string;
  entityType: CustomFieldEntityType;
  entityId: string | null;
  disabled?: boolean;
}

/** Renders all custom fields for an entity with save capability */
export function CustomFieldsSection({
  projectId,
  entityType,
  entityId,
  disabled = false,
}: CustomFieldsSectionProps) {
  const { definitions, isLoading: defsLoading } = useCustomFieldDefinitions(
    projectId,
    entityType,
  );
  const { values, isLoading: valsLoading, setValues } = useCustomFieldValues(
    projectId,
    entityType,
    entityId,
  );

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Sync field values from API response
  useEffect(() => {
    const valueMap: Record<string, string> = {};
    for (const val of values) {
      valueMap[val.definitionId] = val.value;
    }
    setFieldValues(valueMap);
    setIsDirty(false);
  }, [values]);

  const handleChange = useCallback((definitionId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [definitionId]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!entityId) return;

    const valuesToSave = definitions
      .filter((def) => fieldValues[def.id] !== undefined && fieldValues[def.id] !== '')
      .map((def) => ({
        definitionId: def.id,
        value: fieldValues[def.id],
      }));

    setValues.mutate(
      { values: valuesToSave },
      { onSuccess: () => setIsDirty(false) },
    );
  }, [entityId, definitions, fieldValues, setValues]);

  if (defsLoading || valsLoading) {
    return <div className="text-sm text-muted-foreground">Loading custom fields...</div>;
  }

  if (definitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">Custom Fields</h4>
      {definitions.map((def) => (
        <CustomFieldRenderer
          key={def.id}
          definition={def}
          value={fieldValues[def.id] ?? ''}
          onChange={(value) => handleChange(def.id, value)}
          disabled={disabled || !entityId}
        />
      ))}
      {entityId && isDirty && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={setValues.isPending || disabled}
        >
          {setValues.isPending ? 'Saving...' : 'Save Custom Fields'}
        </Button>
      )}
    </div>
  );
}
