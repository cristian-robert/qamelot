'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { testCasesApi, type CsvImportResult } from '@/lib/api/test-cases';

const FIELD_OPTIONS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'type', label: 'Type' },
  { value: 'preconditions', label: 'Preconditions' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'references', label: 'References' },
] as const;

interface CsvImportWizardProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

function parseCsv(text: string): string[][] {
  const lines = text.split('\n').filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
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
}

export function CsvImportWizard({
  projectId,
  open,
  onOpenChange,
}: CsvImportWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = csvData[0] ?? [];
  const rows = csvData.slice(1);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    const text = await f.text();
    const parsed = parseCsv(text);
    setCsvData(parsed);
    const hdrs = parsed[0] ?? [];
    setColumnMappings(
      hdrs.map((h) => {
        const lower = h.toLowerCase();
        const match = FIELD_OPTIONS.find(
          (opt) => opt.value !== '__skip__' && lower.includes(opt.value),
        );
        return match?.value ?? '__skip__';
      }),
    );
    setStep(2);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith('.csv')) {
        handleFile(droppedFile);
      }
    },
    [handleFile],
  );

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    try {
      const importResult = await testCasesApi.importCsv(projectId, file);
      setResult(importResult);
      setStep(4);
    } catch (err) {
      setResult({
        imported: 0,
        errors: [
          {
            row: 0,
            field: 'file',
            message: err instanceof Error ? err.message : 'Import failed',
          },
        ],
      });
      setStep(4);
    } finally {
      setImporting(false);
    }
  }, [file, projectId]);

  const handleClose = useCallback(() => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setColumnMappings([]);
    setResult(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const stepLabels = ['Upload', 'Map Columns', 'Preview', 'Result'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Test Cases from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to test case fields.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  i + 1 <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div
            className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/20'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Drag & drop a CSV file here
            </p>
            <p className="text-xs text-muted-foreground/60">or</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFile(selected);
              }}
            />
          </div>
        )}

        {/* Step 2: Column mapping */}
        {step === 2 && (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {headers.map((header, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {header}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <Select
                    value={columnMappings[i] ?? '__skip__'}
                    onValueChange={(val) => {
                      const updated = [...columnMappings];
                      updated[i] = val ?? '__skip__';
                      setColumnMappings(updated);
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
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
        )}

        {/* Step 4: Result */}
        {step === 4 && result && (
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
        )}

        {importing && (
          <div className="space-y-2">
            <Progress value={null} className="h-1.5" />
            <p className="text-center text-xs text-muted-foreground">
              Importing...
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 size-3" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!columnMappings.some((m) => m === 'title')}
              >
                Next
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-1 size-3" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                <FileSpreadsheet className="mr-1 size-3.5" />
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </>
          )}

          {step === 4 && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
