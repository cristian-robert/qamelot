'use client';

import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  activeFilters?: ActiveFilter[];
  onFilterChange?: (key: string, value: string | null) => void;
  onClearAll?: () => void;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  activeFilters = [],
  onFilterChange,
  onClearAll,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-48 pl-8 text-xs"
          />
        </div>
      )}

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={activeFilters.find((f) => f.key === filter.key)?.value ?? ''}
          onValueChange={(v) => onFilterChange?.(filter.key, v || null)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      <div className="flex-1" />

      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary"
        >
          {filter.label}: {filter.displayValue}
          <button
            onClick={() => onFilterChange?.(filter.key, null)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}

      {activeFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-[11px] text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
