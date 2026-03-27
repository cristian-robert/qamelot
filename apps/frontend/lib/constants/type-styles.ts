import { CaseType } from '@app/shared';

/** Badge styles for case type (with border, for execution/detail views) */
export const typeBadgeStyles: Record<CaseType, string> = {
  [CaseType.FUNCTIONAL]: 'bg-purple-50 text-purple-700 border-purple-200',
  [CaseType.REGRESSION]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [CaseType.SMOKE]: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  [CaseType.EXPLORATORY]: 'bg-pink-50 text-pink-700 border-pink-200',
  [CaseType.OTHER]: 'bg-gray-50 text-gray-600 border-gray-200',
};

/** Compact badge styles for type in list views (bg + text only, no border) */
export const typeCompactStyles: Record<CaseType, string> = {
  [CaseType.FUNCTIONAL]: 'bg-blue-100 text-blue-700',
  [CaseType.REGRESSION]: 'bg-purple-100 text-purple-700',
  [CaseType.SMOKE]: 'bg-emerald-100 text-emerald-700',
  [CaseType.EXPLORATORY]: 'bg-amber-100 text-amber-700',
  [CaseType.OTHER]: 'bg-gray-100 text-gray-600',
};
