'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testResultsApi } from '@/lib/api/test-results';

export function ResultsCsvExportButton({ runId }: { runId: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => testResultsApi.exportCsv(runId)}>
      <Download className="mr-1.5 size-3.5" />
      Export Results
    </Button>
  );
}
