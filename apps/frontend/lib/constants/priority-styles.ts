import { CasePriority } from '@app/shared';

/** Badge styles for case priority (with border, for execution/detail views) */
export const priorityBadgeStyles: Record<CasePriority, string> = {
  [CasePriority.CRITICAL]: 'bg-red-50 text-red-700 border-red-200',
  [CasePriority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [CasePriority.MEDIUM]: 'bg-blue-50 text-blue-700 border-blue-200',
  [CasePriority.LOW]: 'bg-gray-50 text-gray-600 border-gray-200',
};

/** Compact badge styles for priority in list views (bg + text only, no border) */
export const priorityCompactStyles: Record<CasePriority, string> = {
  [CasePriority.CRITICAL]: 'bg-red-100 text-red-700',
  [CasePriority.HIGH]: 'bg-orange-100 text-orange-700',
  [CasePriority.MEDIUM]: 'bg-yellow-100 text-yellow-700',
  [CasePriority.LOW]: 'bg-gray-100 text-gray-600',
};
