'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface BulkUpdateDialogOption {
  value: string;
  label: string;
}

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  options: BulkUpdateDialogOption[];
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel?: string;
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  options,
  value,
  onValueChange,
  onConfirm,
  isPending,
  confirmLabel = 'Apply',
}: BulkUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Select value={value} onValueChange={(val) => onValueChange(val ?? '')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!value || isPending}>
            {isPending ? 'Updating...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
