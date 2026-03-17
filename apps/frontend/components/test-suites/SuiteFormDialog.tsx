'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTestSuiteSchema, type CreateTestSuiteInput, type TestSuiteDto } from '@app/shared';
import {
  useCreateTestSuite,
  useUpdateTestSuite,
} from '@/lib/test-suites/useTestSuites';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SuiteFormDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSuite?: TestSuiteDto | null;
  parentId?: string | null;
  allSuites: TestSuiteDto[];
}

export function SuiteFormDialog({
  projectId,
  open,
  onOpenChange,
  editSuite,
  parentId,
  allSuites,
}: SuiteFormDialogProps) {
  const isEditing = !!editSuite;
  const createMutation = useCreateTestSuite(projectId);
  const updateMutation = useUpdateTestSuite(projectId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTestSuiteInput>({
    resolver: zodResolver(CreateTestSuiteSchema),
    defaultValues: {
      name: '',
      parentId: parentId ?? undefined,
    },
  });

  const selectedParentId = watch('parentId');

  useEffect(() => {
    if (open) {
      if (editSuite) {
        reset({
          name: editSuite.name,
          parentId: editSuite.parentId ?? undefined,
        });
      } else {
        reset({
          name: '',
          parentId: parentId ?? undefined,
        });
      }
    }
  }, [open, editSuite, parentId, reset]);

  const onSubmit = async (data: CreateTestSuiteInput) => {
    if (isEditing && editSuite) {
      await updateMutation.mutateAsync({
        id: editSuite.id,
        data: { name: data.name, parentId: data.parentId ?? null },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const availableParents = allSuites.filter((s) => s.id !== editSuite?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Suite' : 'New Suite'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the suite name or parent folder.'
              : 'Create a new test suite to organize your cases.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suite-name">Name</Label>
            <Input
              id="suite-name"
              placeholder="e.g. Authentication, Checkout Flow"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Parent Suite (optional)</Label>
            <Select
              value={selectedParentId ?? ''}
              onValueChange={(val) =>
                setValue('parentId', !val || val === '__none__' ? undefined : val)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None (root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (root level)</SelectItem>
                {availableParents.map((suite) => (
                  <SelectItem key={suite.id} value={suite.id}>
                    {suite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Suite'
                  : 'Create Suite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
