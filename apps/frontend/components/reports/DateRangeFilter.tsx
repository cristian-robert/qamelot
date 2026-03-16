'use client';

import type { DateRangeFilter as DateRangeFilterType } from '@app/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface DateRangeFilterProps {
  value: DateRangeFilterType;
  onChange: (value: DateRangeFilterType) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const handleClear = () => {
    onChange({});
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="filter-start-date" className="mb-1 block text-xs">
          Start Date
        </Label>
        <Input
          id="filter-start-date"
          type="date"
          className="w-40"
          value={value.startDate ?? ''}
          onChange={(e) =>
            onChange({ ...value, startDate: e.target.value || undefined })
          }
        />
      </div>
      <div>
        <Label htmlFor="filter-end-date" className="mb-1 block text-xs">
          End Date
        </Label>
        <Input
          id="filter-end-date"
          type="date"
          className="w-40"
          value={value.endDate ?? ''}
          onChange={(e) =>
            onChange({ ...value, endDate: e.target.value || undefined })
          }
        />
      </div>
      {(value.startDate || value.endDate) && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
