'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterOption {
  value: string;
  label: string;
}

export interface SelectFilterConfig {
  type: 'select';
  key: string;
  label: string;
  options: FilterOption[];
}

export interface SearchFilterConfig {
  type: 'search';
  key: string;
  placeholder: string;
}

export type FilterConfig = SelectFilterConfig | SearchFilterConfig;

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string | undefined>;
  activeCount: number;
  onChange: (key: string, value: string | undefined) => void;
  onClearAll: () => void;
  /** Local search input value (may differ from debounced URL param) */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function FilterBar({
  filters,
  values,
  activeCount,
  onChange,
  onClearAll,
  searchValue,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        if (filter.type === 'select') {
          return (
            <select
              key={filter.key}
              value={values[filter.key] ?? ''}
              onChange={(e) =>
                onChange(filter.key, e.target.value || undefined)
              }
              aria-label={filter.label}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        }

        return (
          <Input
            key={filter.key}
            type="search"
            placeholder={filter.placeholder}
            value={searchValue ?? values[filter.key] ?? ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label={filter.placeholder}
            className="w-56"
          />
        );
      })}

      {activeCount > 0 && (
        <>
          <Badge variant="secondary">{activeCount} active</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 gap-1 text-xs"
          >
            <X className="size-3" />
            Clear all
          </Button>
        </>
      )}
    </div>
  );
}
