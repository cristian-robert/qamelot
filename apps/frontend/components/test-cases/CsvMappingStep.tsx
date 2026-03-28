'use client';

import { ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

export const FIELD_OPTIONS = [
  { value: '__skip__', label: 'Skip' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'type', label: 'Type' },
  { value: 'preconditions', label: 'Preconditions' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'references', label: 'References' },
] as const;

interface CsvMappingStepProps {
  headers: string[];
  columnMappings: string[];
  onMappingChange: (index: number, value: string) => void;
}

export function CsvMappingStep({
  headers,
  columnMappings,
  onMappingChange,
}: CsvMappingStepProps) {
  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-2">
        {headers.map((header, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {header}
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            <Select
              value={columnMappings[i] ?? '__skip__'}
              onValueChange={(val) => onMappingChange(i, val ?? '__skip__')}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
