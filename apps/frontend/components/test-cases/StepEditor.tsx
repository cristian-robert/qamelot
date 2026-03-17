'use client';

import { useCallback } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface StepData {
  id?: string;
  description: string;
  expectedResult: string;
}

interface StepEditorProps {
  steps: StepData[];
  onChange: (steps: StepData[]) => void;
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const addStep = useCallback(() => {
    onChange([...steps, { description: '', expectedResult: '' }]);
  }, [steps, onChange]);

  const removeStep = useCallback(
    (index: number) => {
      onChange(steps.filter((_, i) => i !== index));
    },
    [steps, onChange],
  );

  const updateStep = useCallback(
    (index: number, field: keyof StepData, value: string) => {
      const updated = steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step,
      );
      onChange(updated);
    },
    [steps, onChange],
  );

  const moveStep = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= steps.length) return;
      const updated = [...steps];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      onChange(updated);
    },
    [steps, onChange],
  );

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={index}
          className="group flex gap-3 rounded-lg border bg-card p-3"
        >
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              {index + 1}
            </div>
            <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => moveStep(index, -1)}
                disabled={index === 0}
                aria-label="Move step up"
              >
                <ArrowUp className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                aria-label="Move step down"
              >
                <ArrowDown className="size-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Step Description
              </label>
              <Textarea
                placeholder="Describe the action to perform..."
                value={step.description}
                onChange={(e) => updateStep(index, 'description', e.target.value)}
                className="min-h-10 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Expected Result
              </label>
              <Input
                placeholder="What should happen?"
                value={step.expectedResult}
                onChange={(e) =>
                  updateStep(index, 'expectedResult', e.target.value)
                }
                className="text-sm"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            onClick={() => removeStep(index)}
            aria-label="Remove step"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addStep}
        className="w-full border-dashed"
      >
        <Plus className="mr-1.5 size-3.5" />
        Add Step
      </Button>
    </div>
  );
}
