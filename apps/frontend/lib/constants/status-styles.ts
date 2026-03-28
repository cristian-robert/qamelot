import { TestResultStatus, TestPlanStatus, MilestoneStatus, Role } from '@app/shared';

/** Badge styles: bg + text + border for use with <Badge variant="outline"> */
export const statusBadgeStyles: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [TestResultStatus.FAILED]: 'bg-red-50 text-red-700 border-red-200',
  [TestResultStatus.BLOCKED]: 'bg-amber-50 text-amber-700 border-amber-200',
  [TestResultStatus.RETEST]: 'bg-blue-50 text-blue-700 border-blue-200',
  [TestResultStatus.UNTESTED]: 'bg-gray-50 text-gray-600 border-gray-200',
};

/** Solid dot colors for status indicators (progress bars, activity dots) */
export const statusDotStyles: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'bg-emerald-500',
  [TestResultStatus.FAILED]: 'bg-red-500',
  [TestResultStatus.BLOCKED]: 'bg-amber-500',
  [TestResultStatus.RETEST]: 'bg-blue-500',
  [TestResultStatus.UNTESTED]: 'bg-gray-400',
};

/** Left-border accent for step result cards */
export const statusBorderStyles: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'border-l-emerald-500',
  [TestResultStatus.FAILED]: 'border-l-red-500',
  [TestResultStatus.BLOCKED]: 'border-l-amber-500',
  [TestResultStatus.RETEST]: 'border-l-blue-500',
  [TestResultStatus.UNTESTED]: 'border-l-gray-300',
};

/** Text color for inline status labels (e.g. coverage breakdown) */
export const statusTextStyles: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'text-emerald-600',
  [TestResultStatus.FAILED]: 'text-red-600',
  [TestResultStatus.BLOCKED]: 'text-amber-600',
  [TestResultStatus.RETEST]: 'text-blue-600',
  [TestResultStatus.UNTESTED]: 'text-gray-500',
};

/** Step number circle bg + text (used in StepResultsPanel) */
export const statusCircleStyles: Record<TestResultStatus, string> = {
  [TestResultStatus.PASSED]: 'bg-emerald-100 text-emerald-700',
  [TestResultStatus.FAILED]: 'bg-red-100 text-red-700',
  [TestResultStatus.BLOCKED]: 'bg-amber-100 text-amber-700',
  [TestResultStatus.RETEST]: 'bg-blue-100 text-blue-700',
  [TestResultStatus.UNTESTED]: 'bg-gray-100 text-gray-600',
};

/** shadcn Badge variant for status (dashboard activity feed) */
export const statusBadgeVariant: Record<
  TestResultStatus,
  'default' | 'destructive' | 'secondary' | 'outline'
> = {
  [TestResultStatus.PASSED]: 'default',
  [TestResultStatus.FAILED]: 'destructive',
  [TestResultStatus.BLOCKED]: 'secondary',
  [TestResultStatus.RETEST]: 'outline',
  [TestResultStatus.UNTESTED]: 'secondary',
};

/** Test plan status -> shadcn Badge variant */
export const planStatusBadgeVariant: Record<
  TestPlanStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  [TestPlanStatus.DRAFT]: 'secondary',
  [TestPlanStatus.ACTIVE]: 'default',
  [TestPlanStatus.COMPLETED]: 'outline',
  [TestPlanStatus.ARCHIVED]: 'secondary',
};

/** Plan status badge: bg + text + border for semantic coloring */
export const planStatusBadgeStyles: Record<TestPlanStatus, string> = {
  [TestPlanStatus.DRAFT]: 'bg-slate-50 text-slate-600 border-slate-200',
  [TestPlanStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [TestPlanStatus.COMPLETED]: 'bg-teal-50 text-teal-700 border-teal-200',
  [TestPlanStatus.ARCHIVED]: 'bg-gray-50 text-gray-500 border-gray-200',
};

/** Milestone status -> shadcn Badge variant */
export const milestoneStatusBadgeVariant: Record<
  MilestoneStatus,
  'default' | 'secondary'
> = {
  [MilestoneStatus.OPEN]: 'default',
  [MilestoneStatus.CLOSED]: 'secondary',
};

/** Milestone status badge: bg + text + border for semantic coloring */
export const milestoneStatusBadgeStyles: Record<MilestoneStatus, string> = {
  [MilestoneStatus.OPEN]: 'bg-blue-50 text-blue-700 border-blue-200',
  [MilestoneStatus.CLOSED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/** Action button styles for step execution (pass/fail/block buttons) */
export const statusActionButtonStyles: Record<
  'pass' | 'fail' | 'block',
  { selected: string; unselected: string }
> = {
  pass: {
    selected: 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200',
    unselected: 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 border-border',
  },
  fail: {
    selected: 'bg-red-100 text-red-700 border-red-300 ring-1 ring-red-200',
    unselected: 'text-muted-foreground hover:bg-red-50 hover:text-red-600 border-border',
  },
  block: {
    selected: 'bg-amber-100 text-amber-700 border-amber-300 ring-1 ring-amber-200',
    unselected: 'text-muted-foreground hover:bg-amber-50 hover:text-amber-600 border-border',
  },
};

/** Role badge styles: bg + text + border */
export const roleBadgeStyles: Record<Role, string> = {
  [Role.ADMIN]: 'bg-purple-50 text-purple-700 border-purple-200',
  [Role.LEAD]: 'bg-blue-50 text-blue-700 border-blue-200',
  [Role.TESTER]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [Role.VIEWER]: 'bg-gray-50 text-gray-600 border-gray-200',
};
