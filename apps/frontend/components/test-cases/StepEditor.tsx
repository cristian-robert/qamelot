'use client';

import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TestCaseStep } from '@app/shared';

interface StepEditorProps {
  steps: TestCaseStep[];
  onChange: (steps: TestCaseStep[]) => void;
  onInsertSharedSteps?: () => void;
}

export function StepEditor({ steps, onChange, onInsertSharedSteps }: StepEditorProps) {
  const addStep = () => {
    onChange([...steps, { action: '', expected: '' }]);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof TestCaseStep, value: string) => {
    const updated = steps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step,
    );
    onChange(updated);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">Steps</span>
        <div className="flex gap-1.5">
          {onInsertSharedSteps && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onInsertSharedSteps}>
              Insert Shared Steps
            </Button>
          )}
        </div>
      </div>

      {steps.length === 0 && (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-muted-foreground/30 px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            No steps yet. Click &quot;+ Add Step&quot; to begin.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
          >
            {/* Step number circle */}
            <span className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>

            {/* Step fields */}
            <div className="flex flex-1 flex-col gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </label>
                <Input
                  placeholder="Step description..."
                  value={step.action}
                  onChange={(e) => updateStep(index, 'action', e.target.value)}
                  className="text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Expected Result
                </label>
                <Input
                  placeholder="Expected result..."
                  value={step.expected}
                  onChange={(e) => updateStep(index, 'expected', e.target.value)}
                  className="text-[13px]"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 cursor-pointer p-0"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => moveStep(index, -1)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 cursor-pointer p-0"
                aria-label="Move down"
                disabled={index === steps.length - 1}
                onClick={() => moveStep(index, 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 cursor-pointer p-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove step"
                onClick={() => removeStep(index)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add step button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full cursor-pointer gap-1.5 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
        onClick={addStep}
      >
        <Plus className="size-3.5" />
        Add Step
      </Button>
    </div>
  );
}
