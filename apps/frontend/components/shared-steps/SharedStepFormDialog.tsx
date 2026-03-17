'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  CreateSharedStepSchema,
  type CreateSharedStepInput,
  type SharedStepWithItemsDto,
} from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface SharedStepFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSharedStepInput) => void;
  isPending: boolean;
  error: Error | null;
  editingStep?: SharedStepWithItemsDto | null;
}

export function SharedStepFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  error,
  editingStep,
}: SharedStepFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateSharedStepInput>({
    resolver: zodResolver(CreateSharedStepSchema),
    defaultValues: {
      title: '',
      items: [{ description: '', expectedResult: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (editingStep) {
      reset({
        title: editingStep.title,
        items: editingStep.items.map((item) => ({
          description: item.description,
          expectedResult: item.expectedResult,
        })),
      });
    } else {
      reset({
        title: '',
        items: [{ description: '', expectedResult: '' }],
      });
    }
  }, [editingStep, reset]);

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      reset({ title: '', items: [{ description: '', expectedResult: '' }] });
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingStep ? 'Edit Shared Step' : 'Create Shared Step'}</DialogTitle>
          <DialogDescription>
            {editingStep
              ? 'Update the shared step title and items.'
              : 'Define a reusable set of test steps.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shared-step-title">Title</Label>
            <Input
              id="shared-step-title"
              placeholder="Shared step title"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Step Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', expectedResult: '' })}
              >
                <Plus className="size-3.5" />
                Add Step
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 rounded-md border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`step-desc-${index}`} className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id={`step-desc-${index}`}
                    placeholder="What to do"
                    rows={2}
                    {...register(`items.${index}.description`)}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-xs text-destructive">
                      {errors.items[index].description?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`step-expected-${index}`} className="text-xs">
                    Expected Result
                  </Label>
                  <Textarea
                    id={`step-expected-${index}`}
                    placeholder="What should happen"
                    rows={2}
                    {...register(`items.${index}.expectedResult`)}
                  />
                  {errors.items?.[index]?.expectedResult && (
                    <p className="text-xs text-destructive">
                      {errors.items[index].expectedResult?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {errors.items?.root && (
              <p className="text-xs text-destructive">{errors.items.root.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? editingStep ? 'Saving...' : 'Creating...'
                : editingStep ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
