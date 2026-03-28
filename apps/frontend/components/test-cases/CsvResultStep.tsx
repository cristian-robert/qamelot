'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CsvImportResult } from '@/lib/api/test-cases';

interface CsvResultStepProps {
  result: CsvImportResult;
}

export function CsvResultStep({ result }: CsvResultStepProps) {
  return (
    <div className="space-y-3">
      {result.imported > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-status-passed/10 p-3 text-status-passed">
          <CheckCircle2 className="size-5 shrink-0" />
          <p className="text-sm font-medium">
            Successfully imported {result.imported} test case
            {result.imported !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      {result.errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm font-medium">
              {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ScrollArea className="max-h-40">
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded bg-destructive/5 px-2 py-1 text-xs"
                >
                  <Badge variant="destructive" className="h-4 text-[10px]">
                    Row {err.row}
                  </Badge>
                  <span className="text-muted-foreground">{err.field}:</span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
