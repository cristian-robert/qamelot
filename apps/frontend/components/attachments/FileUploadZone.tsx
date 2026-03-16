'use client';

import { useCallback, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@app/shared';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUploadZone({ onFilesSelected, disabled, className }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback((files: File[]): File[] => {
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds 10MB limit`);
        return [];
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
        setError(`"${file.name}" has unsupported type: ${file.type || 'unknown'}`);
        return [];
      }
      valid.push(file);
    }
    setError(null);
    return valid;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      const valid = validateFiles(files);
      if (valid.length > 0) onFilesSelected(valid);
    },
    [disabled, onFilesSelected, validateFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return;
      const files = Array.from(e.target.files);
      const valid = validateFiles(files);
      if (valid.length > 0) onFilesSelected(valid);
      e.target.value = '';
    },
    [disabled, onFilesSelected, validateFiles],
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragOver && !disabled
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop files here, or{' '}
          <label
            className={cn(
              'cursor-pointer font-medium text-primary underline-offset-4 hover:underline',
              disabled && 'pointer-events-none',
            )}
          >
            browse
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={handleFileInput}
              disabled={disabled}
              accept={ALLOWED_MIME_TYPES.join(',')}
            />
          </label>
        </p>
        <p className="text-xs text-muted-foreground/70">
          Max 10MB. Images, PDFs, text, and log files.
        </p>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
