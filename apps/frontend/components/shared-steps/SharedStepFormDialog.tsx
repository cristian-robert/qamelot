'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSharedStepSchema, type CreateSharedStepInput } from '@app/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SharedStepFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSharedStepInput) => void;
  isPending: boolean;
  defaultValues?: CreateSharedStepInput;
  title: string;
}

export function SharedStepFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultValues,
  title,
}: SharedStepFormDialogProps) {
  const values = defaultValues ?? {
    title: '',
    items: [{ description: '', expectedResult: '' }],
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateSharedStepInput>({
    resolver: zodResolver(CreateSharedStepSchema),
    values,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const handleFormSubmit = (data: CreateSharedStepInput) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ss-title">Title</Label>
            <Input
              id="ss-title"
              placeholder="Shared step title (e.g. Login flow)"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Step Items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ description: '', expectedResult: '' })}
              >
                Add Item
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                At least one step item is required.
              </p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2 rounded border p-2">
                <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {index + 1}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    placeholder="Description"
                    {...register(`items.${index}.description`)}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive">
                      {errors.items[index].description?.message}
                    </p>
                  )}
                  <Input
                    placeholder="Expected result"
                    {...register(`items.${index}.expectedResult`)}
                  />
                  {errors.items?.[index]?.expectedResult && (
                    <p className="text-xs text-destructive">
                      {errors.items[index].expectedResult?.message}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Remove item"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  x
                </Button>
              </div>
            ))}

            {errors.items?.root && (
              <p className="text-sm text-destructive">{errors.items.root.message}</p>
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
