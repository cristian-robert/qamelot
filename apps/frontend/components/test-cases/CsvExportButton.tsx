'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testCasesApi } from '@/lib/api/test-cases';

export function CsvExportButton({ projectId }: { projectId: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => testCasesApi.exportCsv(projectId)}>
      <Download className="mr-1.5 size-3.5" />
      Export CSV
    </Button>
  );
}
