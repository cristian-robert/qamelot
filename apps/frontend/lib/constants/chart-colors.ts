import { TestResultStatus } from '@app/shared';

/**
 * Hex color values for Recharts and other chart libraries.
 *
 * These must be raw hex strings because Recharts `fill` prop does not
 * support CSS custom properties or Tailwind classes.
 *
 * Color mapping:
 * - PASSED:   #10b981  (emerald-500)
 * - FAILED:   #ef4444  (red-500)
 * - BLOCKED:  #f59e0b  (amber-500)
 * - RETEST:   #3b82f6  (blue-500)
 * - UNTESTED: #9ca3af  (gray-400)
 */
export const statusChartColors: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: '#10b981',
  [TestResultStatus.FAILED]: '#ef4444',
  [TestResultStatus.BLOCKED]: '#f59e0b',
  [TestResultStatus.RETEST]: '#3b82f6',
  [TestResultStatus.UNTESTED]: '#9ca3af',
};
