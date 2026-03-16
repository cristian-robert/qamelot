'use client';

import { Badge } from '@/components/ui/badge';
import type { DefectDto } from '@app/shared';

interface DefectBadgeProps {
  defects: DefectDto[];
}

export function DefectBadge({ defects }: DefectBadgeProps) {
  if (defects.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {defects.map((defect) => (
        <Badge
          key={defect.id}
          variant="secondary"
          className="bg-red-50 text-red-700 hover:bg-red-100"
          title={defect.description ?? defect.reference}
        >
          {defect.reference}
        </Badge>
      ))}
    </div>
  );
}
