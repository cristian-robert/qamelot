'use client';

import { Search, X } from 'lucide-react';
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
  totalCount?: number;
  filteredCount?: number;
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
  totalCount,
  filteredCount,
  onChange,
  onClearAll,
  searchValue,
  onSearchChange,
}: FilterBarProps) {
  /** Get the display label for a currently-selected filter value */
  const getActiveFilterLabel = (filter: SelectFilterConfig): string | null => {
    const val = values[filter.key];
    if (!val) return null;
    return filter.options.find((o) => o.value === val)?.label ?? val;
  };

  return (
    <div className="space-y-2">
      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          if (filter.type === 'search') {
            return (
              <div key={filter.key} className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={filter.placeholder}
                  value={searchValue ?? values[filter.key] ?? ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  aria-label={filter.placeholder}
                  className="h-8 w-56 pl-8 text-[13px]"
                />
              </div>
            );
          }

          return (
            <select
              key={filter.key}
              value={values[filter.key] ?? ''}
              onChange={(e) =>
                onChange(filter.key, e.target.value || undefined)
              }
              aria-label={filter.label}
              className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-1 text-[13px] transition-colors outline-none hover:border-ring/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        })}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 cursor-pointer gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active filter chips + result count */}
      {(activeCount > 0 || (totalCount !== undefined && filteredCount !== undefined)) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Active filter chips */}
          {filters.map((filter) => {
            if (filter.type !== 'select') return null;
            const label = getActiveFilterLabel(filter);
            if (!label) return null;
            return (
              <Badge
                key={filter.key}
                className="cursor-pointer gap-1 bg-primary/10 text-primary hover:bg-primary/20"
              >
                {filter.label}: {label}
                <button
                  type="button"
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                  onClick={() => onChange(filter.key, undefined)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            );
          })}

          {/* Result count */}
          {totalCount !== undefined && filteredCount !== undefined && (
            <span className="ml-auto text-xs text-muted-foreground">
              Showing {filteredCount} of {totalCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
