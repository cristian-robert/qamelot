'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvPreviewStepProps {
  headers: string[];
  rows: string[][];
  columnMappings: string[];
}

export function CsvPreviewStep({
  headers,
  rows,
  columnMappings,
}: CsvPreviewStepProps) {
  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Preview of first {Math.min(rows.length, 5)} rows:
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {headers.map((h, i) =>
                  columnMappings[i] !== '__skip__' ? (
                    <th key={i} className="px-2 py-1.5 text-left font-medium">
                      {columnMappings[i]}
                    </th>
                  ) : null,
                )}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {row.map((cell, ci) =>
                    columnMappings[ci] !== '__skip__' ? (
                      <td
                        key={ci}
                        className="max-w-32 truncate px-2 py-1.5"
                      >
                        {cell}
                      </td>
                    ) : null,
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {rows.length} row{rows.length !== 1 ? 's' : ''} to import
        </p>
      </div>
    </ScrollArea>
  );
}
