'use client';

import { useState, useCallback } from 'react';
import {
  FileSpreadsheet,
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
import { Progress } from '@/components/ui/progress';
import { testCasesApi, type CsvImportResult } from '@/lib/api/test-cases';
import { CsvUploadStep } from './CsvUploadStep';
import { CsvMappingStep, FIELD_OPTIONS } from './CsvMappingStep';
import { CsvPreviewStep } from './CsvPreviewStep';
import { CsvResultStep } from './CsvResultStep';

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

  const handleMappingChange = useCallback(
    (index: number, value: string) => {
      const updated = [...columnMappings];
      updated[index] = value;
      setColumnMappings(updated);
    },
    [columnMappings],
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

        {step === 1 && (
          <CsvUploadStep
            dragActive={dragActive}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onFileSelect={handleFile}
          />
        )}

        {step === 2 && (
          <CsvMappingStep
            headers={headers}
            columnMappings={columnMappings}
            onMappingChange={handleMappingChange}
          />
        )}

        {step === 3 && (
          <CsvPreviewStep
            headers={headers}
            rows={rows}
            columnMappings={columnMappings}
          />
        )}

        {step === 4 && result && <CsvResultStep result={result} />}

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
