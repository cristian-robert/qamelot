'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateMilestoneSchema, type CreateMilestoneInput } from '@app/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MilestoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateMilestoneInput) => void;
  isPending: boolean;
  defaultValues?: { name: string; description?: string; startDate?: string; dueDate?: string };
  parentId?: string | null;
  parentName?: string;
  title: string;
}

export function MilestoneFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultValues,
  parentId,
  parentName,
  title,
}: MilestoneFormDialogProps) {
  const values = defaultValues ?? { name: '', description: '', startDate: '', dueDate: '' };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMilestoneInput>({
    resolver: zodResolver(CreateMilestoneSchema),
    values,
  });

  const handleFormSubmit = (data: CreateMilestoneInput) => {
    onSubmit({ ...data, parentId: parentId ?? null });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {parentName && (
          <p className="text-sm text-muted-foreground">
            Creating under: <span className="font-medium">{parentName}</span>
          </p>
        )}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Milestone name" {...register('name')} />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Start date</label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due date</label>
              <Input type="date" {...register('dueDate')} />
            </div>
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
