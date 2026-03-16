'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateDefectSchema } from '@app/shared';
import type { CreateDefectInput, TestRunCaseWithResultDto } from '@app/shared';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateDefectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testRunCase: TestRunCaseWithResultDto;
  runName: string;
  onSubmit: (data: CreateDefectInput) => void;
  isPending: boolean;
}

function buildDefaultDescription(
  testRunCase: TestRunCaseWithResultDto,
  runName: string,
): string {
  const parts: string[] = [];
  parts.push(`Test Case: ${testRunCase.testCase.title}`);
  parts.push(`Run: ${runName}`);
  if (testRunCase.latestResult?.comment) {
    parts.push(`Failure Comment: ${testRunCase.latestResult.comment}`);
  }
  return parts.join('\n');
}

export function CreateDefectDialog({
  open,
  onOpenChange,
  testRunCase,
  runName,
  onSubmit,
  isPending,
}: CreateDefectDialogProps) {
  const resultId = testRunCase.latestResult?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDefectInput>({
    resolver: zodResolver(CreateDefectSchema),
    defaultValues: {
      reference: '',
      description: buildDefaultDescription(testRunCase, runName),
      testResultId: resultId,
    },
  });

  const handleFormSubmit = useCallback(
    (data: CreateDefectInput) => {
      onSubmit({ ...data, testResultId: resultId });
      reset();
      onOpenChange(false);
    },
    [onSubmit, resultId, reset, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Defect</DialogTitle>
          <DialogDescription>
            Report a defect for &quot;{testRunCase.testCase.title}&quot; in run &quot;{runName}&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defect-reference">Reference (ticket ID or URL)</Label>
            <Input
              id="defect-reference"
              placeholder="e.g. PROJ-123 or https://issues.example.com/123"
              {...register('reference')}
              aria-invalid={!!errors.reference}
            />
            {errors.reference && (
              <p className="text-xs text-destructive">{errors.reference.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defect-description">Description</Label>
            <Textarea
              id="defect-description"
              placeholder="Describe the defect..."
              rows={4}
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Defect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
