'use client';

import { useCallback, useRef, KeyboardEvent } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const tableRef = useRef<HTMLDivElement>(null);

  const addStep = useCallback(() => {
    onChange([...steps, { description: '', expectedResult: '' }]);
    // Focus the new row's description after render
    requestAnimationFrame(() => {
      const rows = tableRef.current?.querySelectorAll('[data-step-row]');
      const lastRow = rows?.[rows.length - 1];
      const input = lastRow?.querySelector<HTMLTextAreaElement>('[data-field="description"]');
      input?.focus();
    });
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

  // Auto-resize textarea to content
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Tab / Enter keyboard navigation between cells
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>, index: number, field: 'description' | 'expectedResult') => {
      const isTab = e.key === 'Tab' && !e.shiftKey;
      const isEnter = e.key === 'Enter' && !e.shiftKey;
      const isShiftTab = e.key === 'Tab' && e.shiftKey;

      if (isTab || isEnter) {
        e.preventDefault();
        // Move to expected result, or to next row's description
        if (field === 'description') {
          const row = (e.target as HTMLElement).closest('[data-step-row]');
          const next = row?.querySelector<HTMLTextAreaElement>('[data-field="expectedResult"]');
          next?.focus();
        } else {
          // Move to next row's description, or add a new step
          if (index < steps.length - 1) {
            const rows = tableRef.current?.querySelectorAll('[data-step-row]');
            const nextRow = rows?.[index + 1];
            const next = nextRow?.querySelector<HTMLTextAreaElement>('[data-field="description"]');
            next?.focus();
          } else if (isEnter) {
            addStep();
          }
        }
      }

      if (isShiftTab) {
        e.preventDefault();
        if (field === 'expectedResult') {
          const row = (e.target as HTMLElement).closest('[data-step-row]');
          const prev = row?.querySelector<HTMLTextAreaElement>('[data-field="description"]');
          prev?.focus();
        } else if (index > 0) {
          const rows = tableRef.current?.querySelectorAll('[data-step-row]');
          const prevRow = rows?.[index - 1];
          const prev = prevRow?.querySelector<HTMLTextAreaElement>('[data-field="expectedResult"]');
          prev?.focus();
        }
      }

      // Alt+Arrow for reorder
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        moveStep(index, -1);
      }
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        moveStep(index, 1);
      }
    },
    [steps.length, addStep, moveStep],
  );

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndexRef.current = index;
  }, []);

  const handleDrop = useCallback(() => {
    const from = dragIndexRef.current;
    const to = dragOverIndexRef.current;
    if (from === null || to === null || from === to) return;

    const updated = [...steps];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);

    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
  }, [steps, onChange]);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
        <p className="text-sm text-muted-foreground">No steps yet</p>
        <Button variant="outline" size="sm" onClick={addStep}>
          <Plus className="mr-1.5 size-3.5" />
          Add first step
        </Button>
      </div>
    );
  }

  return (
    <div ref={tableRef} className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-0 rounded-t-md border-x border-t bg-muted/50 text-xs font-medium text-muted-foreground">
        <div className="w-11 shrink-0 py-1.5 text-center">#</div>
        <div className="flex-1 border-l px-2.5 py-1.5">Action / Description</div>
        <div className="flex-1 border-l px-2.5 py-1.5">Expected Result</div>
        <div className="w-8 shrink-0" />
      </div>

      {/* Rows */}
      {steps.map((step, index) => (
        <div
          key={step.id ?? index}
          data-step-row
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          className="group flex items-stretch border-x border-b bg-card transition-colors first:border-t-0 last:rounded-b-md hover:bg-muted/20"
        >
          {/* Step number + drag handle */}
          <div className="flex w-11 shrink-0 cursor-grab items-center justify-center gap-0.5 text-xs active:cursor-grabbing">
            <GripVertical className="size-3 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="font-mono text-muted-foreground">{index + 1}</span>
          </div>

          {/* Description cell */}
          <div className="flex-1 border-l">
            <textarea
              data-field="description"
              value={step.description}
              onChange={(e) => {
                updateStep(index, 'description', e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={(e) => handleKeyDown(e, index, 'description')}
              onFocus={(e) => autoResize(e.target)}
              placeholder="Describe the action..."
              rows={1}
              className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Expected result cell */}
          <div className="flex-1 border-l">
            <textarea
              data-field="expectedResult"
              value={step.expectedResult}
              onChange={(e) => {
                updateStep(index, 'expectedResult', e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={(e) => handleKeyDown(e, index, 'expectedResult')}
              onFocus={(e) => autoResize(e.target)}
              placeholder="What should happen?"
              rows={1}
              className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Delete button */}
          <div className="flex w-8 shrink-0 items-center justify-center">
            <button
              type="button"
              onClick={() => removeStep(index)}
              className="rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label="Remove step"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Add step row */}
      <button
        type="button"
        onClick={addStep}
        className="flex w-full items-center justify-center gap-1.5 rounded-b-md border-x border-b border-dashed py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
      >
        <Plus className="size-3" />
        Add step
      </button>
    </div>
  );
}
