'use client';

import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testCasesApi } from '@/lib/api/test-cases';

interface CsvExportButtonProps {
  projectId: string;
}

export function CsvExportButton({ projectId }: CsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await testCasesApi.exportCsv(projectId);
    } catch {
      // Download errors are shown via browser native behavior
    } finally {
      setIsExporting(false);
    }
  }, [projectId]);

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
