'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function FileUploadZone({ onUpload, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadingName(file.name);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
        setUploadingName(null);
      }
    },
    [onUpload],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && !disabled && inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
        isDragging && 'border-primary bg-primary/5',
        !isDragging && !isUploading && 'border-muted-foreground/25 hover:border-muted-foreground/50',
        (isUploading || disabled) && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={isUploading || disabled}
      />

      {isUploading ? (
        <>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Uploading {uploadingName}...
          </p>
        </>
      ) : (
        <>
          <Upload className="size-6 text-muted-foreground/60" />
          <div>
            <p className="text-sm font-medium">
              Drop a file here or click to browse
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Max 10 MB per file
            </p>
          </div>
        </>
      )}
    </div>
  );
}
