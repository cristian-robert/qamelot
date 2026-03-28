'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CsvUploadStepProps {
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
}

export function CsvUploadStep({
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: CsvUploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/20'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
          if (selected) onFileSelect(selected);
        }}
      />
    </div>
  );
}
