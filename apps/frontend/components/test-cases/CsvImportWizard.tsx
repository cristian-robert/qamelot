'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileWarning, CheckCircle, AlertCircle, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { testCasesApi } from '@/lib/api/test-cases';
import type { CsvImportResult } from '@/lib/api/test-cases';

type WizardStep = 'select' | 'preview' | 'importing' | 'result';

const WIZARD_STEPS = [
  { key: 'select', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'importing', label: 'Import' },
  { key: 'result', label: 'Done' },
] as const;

function getStepIndex(step: WizardStep): number {
  if (step === 'select') return 0;
  if (step === 'preview') return 1;
  if (step === 'importing') return 2;
  return 3;
}

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
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const importMutation = useMutation({
    mutationFn: (file: File) => testCasesApi.importCsv(projectId, file),
    onMutate: () => {
      setStep('importing');
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
    onError: () => {
      setStep('preview');
    },
  });

  const parseFile = useCallback((file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      const preview = lines.slice(0, 6).map((line) => {
        const rowResult: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            rowResult.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        rowResult.push(current.trim());
        return rowResult;
      });
      setPreviewRows(preview);
      setStep('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      parseFile(file);
    },
    [parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        parseFile(file);
      }
    },
    [parseFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleImport = useCallback(() => {
    if (!selectedFile) return;
    importMutation.mutate(selectedFile);
  }, [selectedFile, importMutation]);

  const handleClose = useCallback(() => {
    setStep('select');
    setSelectedFile(null);
    setPreviewRows([]);
    setResult(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  }, [onOpenChange]);

  const currentStepIdx = getStepIndex(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Import Test Cases from CSV</DialogTitle>
          <DialogDescription className="text-[13px]">
            Upload a CSV file with columns: Title, Suite, Priority, Type,
            Preconditions, Step1, Expected1, ...
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 py-2">
          {WIZARD_STEPS.map((ws, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={ws.key} className="flex items-center gap-1">
                {idx > 0 && (
                  <div className={cn(
                    'h-px w-8 transition-colors',
                    idx <= currentStepIdx ? 'bg-primary' : 'bg-border',
                  )} />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                      isDone && 'bg-primary text-primary-foreground',
                      isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                      !isDone && !isCurrent && 'border-2 border-border text-muted-foreground',
                    )}
                  >
                    {isDone ? <Check className="size-3.5" /> : idx + 1}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    isCurrent ? 'text-primary' : 'text-muted-foreground',
                  )}>
                    {ws.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1: File selection with drag and drop */}
        {step === 'select' && (
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed py-10 transition-colors',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            )}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload CSV file"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="size-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium">
                Drag and drop your CSV file here
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[13px]">
              <FileWarning className="size-4 text-amber-500" />
              <span>
                Preview of <strong>{selectedFile?.name}</strong> (first 5 rows)
              </span>
            </div>

            <ScrollArea className="max-h-64 rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {previewRows[0]?.map((header, i) => (
                        <th
                          key={i}
                          className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b transition-colors hover:bg-muted/30">
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="max-w-[200px] truncate whitespace-nowrap px-3 py-2 text-[12px]"
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

            {importMutation.error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[13px] text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{importMutation.error.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="cursor-pointer"
              >
                Import
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Importing progress */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-full max-w-xs space-y-2">
              <p className="text-center text-[13px] font-medium">Importing test cases...</p>
              <Progress value={null} className="h-2" />
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-primary/5 py-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="size-5 text-primary" />
              </div>
              <span className="text-[15px] font-semibold">
                {result.imported} test case{result.imported !== 1 ? 's' : ''}{' '}
                imported
              </span>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-amber-600">
                  <AlertCircle className="size-4" />
                  <span>
                    {result.errors.length} row{result.errors.length !== 1 ? 's' : ''}{' '}
                    skipped due to errors
                  </span>
                </div>

                <ScrollArea className="max-h-40 rounded-lg border">
                  <div className="space-y-1 p-3">
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
              <Button onClick={handleClose} className="cursor-pointer">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
