'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileWarning, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { testCasesApi } from '@/lib/api/test-cases';
import type { CsvImportResult } from '@/lib/api/test-cases';

type WizardStep = 'select' | 'preview' | 'result';

interface CsvImportWizardProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvImportWizard({
  projectId,
  open,
  onOpenChange,
}: CsvImportWizardProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: (file: File) => testCasesApi.importCsv(projectId, file),
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);

      // Read first few lines for preview
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        const preview = lines.slice(0, 6).map((line) => {
          // Simple CSV split (handles basic cases)
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });
        setPreviewRows(preview);
        setStep('preview');
      };
      reader.readAsText(file);
    },
    [],
  );

  const handleImport = useCallback(() => {
    if (!selectedFile) return;
    importMutation.mutate(selectedFile);
  }, [selectedFile, importMutation]);

  const handleClose = useCallback(() => {
    setStep('select');
    setSelectedFile(null);
    setPreviewRows([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Test Cases from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: Title, Suite, Priority, Type,
            Preconditions, Step1, Expected1, ...
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Upload className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Select a CSV file to import test cases
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Choose File
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileWarning className="size-4 text-amber-500" />
              <span>
                Preview of <strong>{selectedFile?.name}</strong> (first 5 rows)
              </span>
            </div>

            <ScrollArea className="max-h-64 rounded border">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {previewRows[0]?.map((header, i) => (
                        <th
                          key={i}
                          className="whitespace-nowrap px-3 py-2 text-left font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b">
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="max-w-[200px] truncate whitespace-nowrap px-3 py-1.5"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            {importMutation.isPending && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Importing...</p>
                <Progress value={null} className="h-2" />
              </div>
            )}

            {importMutation.error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                <span>{importMutation.error.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              <span className="font-medium">
                {result.imported} test case{result.imported !== 1 ? 's' : ''}{' '}
                imported successfully
              </span>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="size-4" />
                  <span>
                    {result.errors.length} row{result.errors.length !== 1 ? 's' : ''}{' '}
                    skipped due to errors
                  </span>
                </div>

                <ScrollArea className="max-h-40 rounded border">
                  <div className="p-3 space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        <span className="font-medium">Row {err.row}</span>{' '}
                        ({err.field}): {err.message}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
