'use client';

import { X, FolderInput, Copy, Tag, Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkToolbarProps {
  count: number;
  onMove: () => void;
  onCopy?: () => void;
  onSetPriority: () => void;
  onSetType: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function BulkToolbar({
  count,
  onMove,
  onCopy,
  onSetPriority,
  onSetType,
  onDelete,
  onClose,
}: BulkToolbarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-sidebar px-3 py-2 text-white shadow-xl">
      <span className="mr-2 text-sm font-medium">
        {count} selected
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="text-white/80 hover:bg-white/10 hover:text-white"
        onClick={onMove}
      >
        <FolderInput className="mr-1.5 size-3.5" />
        Move
      </Button>

      {onCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80 hover:bg-white/10 hover:text-white"
          onClick={onCopy}
        >
          <Copy className="mr-1.5 size-3.5" />
          Copy
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="text-white/80 hover:bg-white/10 hover:text-white"
        onClick={onSetPriority}
      >
        <Tag className="mr-1.5 size-3.5" />
        Priority
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-white/80 hover:bg-white/10 hover:text-white"
        onClick={onSetType}
      >
        <Layers className="mr-1.5 size-3.5" />
        Type
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-red-300 hover:bg-red-500/20 hover:text-red-200"
        onClick={onDelete}
      >
        <Trash2 className="mr-1.5 size-3.5" />
        Delete
      </Button>

      <div className="mx-1 h-5 w-px bg-white/20" />

      <Button
        variant="ghost"
        size="icon-sm"
        className="text-white/60 hover:bg-white/10 hover:text-white"
        onClick={onClose}
        aria-label="Clear selection"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
