'use client';

import { useState } from 'react';
import { Bug } from 'lucide-react';
import { useCreateDefect } from '@/lib/defects/useDefects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface CreateDefectDialogProps {
  projectId: string;
  testResultId: string;
  caseTitle: string;
  trigger?: React.ReactElement;
}

export function CreateDefectDialog({
  projectId,
  testResultId,
  caseTitle,
  trigger,
}: CreateDefectDialogProps) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState(
    `Defect found during execution of: ${caseTitle}`,
  );

  const createDefect = useCreateDefect(projectId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return;

    createDefect.mutate(
      {
        reference: reference.trim(),
        description: description.trim() || undefined,
        testResultId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setReference('');
          setDescription('');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="xs" className="gap-1 text-red-600 hover:text-red-700" />
          )
        }
      >
        <Bug className="size-3" />
        Log Defect
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log Defect</DialogTitle>
            <DialogDescription>
              Link a defect reference to this failed test result.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="defect-reference">Reference</Label>
              <Input
                id="defect-reference"
                placeholder="e.g. BUG-123 or JIRA ticket URL"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="defect-description">Description</Label>
              <Textarea
                id="defect-description"
                placeholder="Describe the defect..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={!reference.trim() || createDefect.isPending}
            >
              {createDefect.isPending ? 'Creating...' : 'Create Defect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
