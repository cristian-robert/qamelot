'use client';

import { useParams } from 'next/navigation';
import { CustomFieldDefinitionsList } from '@/components/custom-fields/CustomFieldDefinitionsList';

export default function CustomFieldsPage() {
  const { id: projectId } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Fields</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define custom fields that appear on test cases and test results in this project.
        </p>
      </div>
      <CustomFieldDefinitionsList projectId={projectId} />
    </div>
  );
}
