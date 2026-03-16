'use client';

import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testResultsApi } from '@/lib/api/test-results';

interface ResultsCsvExportButtonProps {
  runId: string;
}

export function ResultsCsvExportButton({ runId }: ResultsCsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await testResultsApi.exportCsv(runId);
    } catch {
      // Download errors are shown via browser native behavior
    } finally {
      setIsExporting(false);
    }
  }, [runId]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="mr-1.5 size-4" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
