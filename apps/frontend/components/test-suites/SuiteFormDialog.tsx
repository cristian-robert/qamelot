'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTestSuiteSchema, type CreateTestSuiteInput } from '@app/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SuiteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTestSuiteInput) => void;
  isPending: boolean;
  defaultValues?: { name: string; description?: string };
  title: string;
}

export function SuiteFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultValues,
  title,
}: SuiteFormDialogProps) {
  const values = defaultValues ?? { name: '', description: '' };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTestSuiteInput>({
    resolver: zodResolver(CreateTestSuiteSchema),
    values,
  });

  const handleFormSubmit = (data: CreateTestSuiteInput) => {
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
            <Input placeholder="Suite name" {...register('name')} />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
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
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
