'use client';

import { useState } from 'react';
import type { TestSuiteDto } from '@app/shared';
import { useCreateTestRun } from '@/lib/test-runs/useTestRuns';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { CasePickerList } from './CasePickerList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CreateRunDialogProps {
  planId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRunDialog({ planId, projectId, open, onOpenChange }: CreateRunDialogProps) {
  const createRun = useCreateTestRun(planId);
  const { data: suites } = useTestSuites(projectId);

  const [runName, setRunName] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());
  const [pickerSuiteId, setPickerSuiteId] = useState<string | null>(null);

  function resetCreateForm() {
    setRunName('');
    setAssigneeId('');
    setSelectedCaseIds(new Set());
    setPickerSuiteId(null);
  }

  function toggleCase(id: string) {
    setSelectedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllCases(ids: string[]) {
    setSelectedCaseIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleCreateRun() {
    if (!runName.trim() || selectedCaseIds.size === 0) return;
    createRun.mutate(
      {
        name: runName.trim(),
        assignedToId: assigneeId.trim() || undefined,
        caseIds: Array.from(selectedCaseIds),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetCreateForm();
        },
      },
    );
  }

  function handleOpenChange(value: boolean) {
    onOpenChange(value);
    if (!value) resetCreateForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Test Run</DialogTitle>
          <DialogDescription>
            Name your run, select test cases, and optionally assign it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="run-name">Name</Label>
              <Input
                id="run-name"
                placeholder="Run name"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="run-assignee">Assignee ID (optional)</Label>
              <Input
                id="run-assignee"
                placeholder="User ID"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Test Cases</Label>
              <Badge variant="secondary" className="text-xs">
                {selectedCaseIds.size} selected
              </Badge>
            </div>

            <Select
              value={pickerSuiteId ?? ''}
              onValueChange={(v) => setPickerSuiteId(v || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a suite..." />
              </SelectTrigger>
              <SelectContent>
                {(suites ?? []).map((s: TestSuiteDto) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CasePickerList
              projectId={projectId}
              suiteId={pickerSuiteId}
              selectedCaseIds={selectedCaseIds}
              onToggleCase={toggleCase}
              onToggleAll={toggleAllCases}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRun}
            disabled={!runName.trim() || selectedCaseIds.size === 0 || createRun.isPending}
          >
            {createRun.isPending ? 'Creating...' : `Create Run (${selectedCaseIds.size} cases)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
