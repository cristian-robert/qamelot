'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDefectSchema, type CreateDefectInput } from '@app/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DefectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDefectInput) => void;
  isPending: boolean;
  defaultValues?: { reference: string; description?: string };
  title: string;
}

export function DefectFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultValues,
  title,
}: DefectFormDialogProps) {
  const values = defaultValues ?? { reference: '', description: '' };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDefectInput>({
    resolver: zodResolver(CreateDefectSchema),
    values,
  });

  const handleFormSubmit = (data: CreateDefectInput) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Input
              placeholder="Ticket reference (e.g. PROJ-123 or URL)"
              {...register('reference')}
            />
            {errors.reference && (
              <p className="mt-1 text-sm text-destructive">{errors.reference.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="Description (optional)" {...register('description')} />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
