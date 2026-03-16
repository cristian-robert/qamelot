'use client';

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Steps</span>
        <div className="flex gap-1">
          {onInsertSharedSteps && (
            <Button type="button" size="sm" variant="outline" onClick={onInsertSharedSteps}>
              Insert Shared Steps
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" onClick={addStep}>
            Add Step
          </Button>
        </div>
      </div>

      {steps.length === 0 && (
        <p className="text-sm text-muted-foreground">No steps yet. Click &quot;Add Step&quot; to begin.</p>
      )}

      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-2 rounded border p-2">
          <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {index + 1}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <Input
              placeholder="Action"
              value={step.action}
              onChange={(e) => updateStep(index, 'action', e.target.value)}
            />
            <Input
              placeholder="Expected result"
              value={step.expected}
              onChange={(e) => updateStep(index, 'expected', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => moveStep(index, -1)}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Move down"
              disabled={index === steps.length - 1}
              onClick={() => moveStep(index, 1)}
            >
              ↓
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Remove step"
              onClick={() => removeStep(index)}
            >
              x
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
