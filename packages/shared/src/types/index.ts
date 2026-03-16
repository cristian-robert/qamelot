// Role enum — shared between backend guards and frontend UI
export enum Role {
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  TESTER = 'TESTER',
  VIEWER = 'VIEWER',
}

// Base entity fields present on every DB record.
// Dates are strings (ISO 8601) because JSON has no Date type.
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Minimal user shape returned by API (no password hash)
export interface UserDto extends BaseEntity {
  email: string;
  name: string;
  role: Role;
  deletedAt: string | null;
}

// Project shape returned by API
export interface ProjectDto extends BaseEntity {
  name: string;
  description: string | null;
  deletedAt: string | null;
}

// Test suite node in a hierarchical tree structure
export interface TestSuiteDto extends BaseEntity {
  projectId: string;
  name: string;
  description: string | null;
  parentId: string | null;
  deletedAt: string | null;
}

// Test plan status enum
export enum TestPlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

// Test run status enum
export enum TestRunStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// Test plan shape returned by API
export interface TestPlanDto extends BaseEntity {
  name: string;
  description: string | null;
  projectId: string;
  status: TestPlanStatus;
  deletedAt: string | null;
}

// Test run shape returned by API
export interface TestRunDto extends BaseEntity {
  name: string;
  testPlanId: string;
  projectId: string;
  assignedToId: string | null;
  status: TestRunStatus;
  sourceRunId: string | null;
  deletedAt: string | null;
}

// Test run with nested relations for detail view
export interface TestRunDetailDto extends TestRunDto {
  testPlan: { id: string; name: string };
  assignedTo: { id: string; name: string; email: string } | null;
  testRunCases: TestRunCaseDto[];
}

// Junction between test run and test case
export interface TestRunCaseDto {
  id: string;
  testRunId: string;
  testCaseId: string;
  testCase: {
    id: string;
    title: string;
    priority: CasePriority;
    type: CaseType;
    templateType?: TemplateType;
    suiteId: string;
    suite?: { id: string; name: string };
    steps?: TestCaseStepDto[];
  };
  createdAt: string;
}

// Test plan with run count for list views
export interface TestPlanWithRunCountDto extends TestPlanDto {
  _count: { testRuns: number };
}

// Test result status enum
export enum TestResultStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  RETEST = 'RETEST',
  UNTESTED = 'UNTESTED',
}

// Step-level result shape returned by API
export interface TestStepResultDto {
  id: string;
  testResultId: string;
  testCaseStepId: string;
  status: TestResultStatus;
  actualResult: string | null;
  createdAt: string;
  updatedAt: string;
}

// Test result shape returned by API
export interface TestResultDto {
  id: string;
  testRunCaseId: string;
  testRunId: string;
  executedById: string;
  executedBy: { id: string; name: string; email: string };
  status: TestResultStatus;
  statusOverride: boolean;
  comment: string | null;
  elapsed: number | null;
  stepResults?: TestStepResultDto[];
  createdAt: string;
  updatedAt: string;
}

// Test run case with its latest result for the execution view
export interface TestRunCaseWithResultDto extends TestRunCaseDto {
  latestResult: TestResultDto | null;
}

// Summary counts for a test run's results
export interface TestRunResultSummary {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  retest: number;
  untested: number;
}

// Test run detail with result summary for the execution view
export interface TestRunExecutionDto extends TestRunDto {
  testPlan: { id: string; name: string };
  assignedTo: { id: string; name: string; email: string } | null;
  testRunCases: TestRunCaseWithResultDto[];
  summary: TestRunResultSummary;
}

// SSE event emitted when a test result is submitted or updated
export interface RunProgressEvent {
  runId: string;
  summary: TestRunResultSummary;
  updatedCase: {
    testRunCaseId: string;
    latestResult: TestResultDto;
  };
  runStatus: TestRunStatus;
}

// ── Report DTOs ──

/** Coverage breakdown: how many test run cases have each status */
export interface CoverageReportDto {
  totalCases: number;
  covered: number;
  coveragePercent: number;
  byStatus: StatusCount[];
}

/** A single status count bucket */
export interface StatusCount {
  status: TestResultStatus;
  count: number;
}

/** Progress: pass/fail/blocked per test run, ordered by run creation date */
export interface ProgressReportDto {
  runs: RunProgressEntry[];
}

export interface RunProgressEntry {
  runId: string;
  runName: string;
  createdAt: string;
  passed: number;
  failed: number;
  blocked: number;
  retest: number;
  untested: number;
  total: number;
}

/** Activity: results submitted per user per day */
export interface ActivityReportDto {
  entries: ActivityEntry[];
}

export interface ActivityEntry {
  date: string;
  userId: string;
  userName: string;
  count: number;
}

/** Cross-project summary for the dashboard home page */
export interface DashboardSummaryDto {
  totalProjects: number;
  activeRuns: number;
  overallPassRate: number;
  recentActivityCount: number;
  recentResults: RecentResultEntry[];
}

export interface RecentResultEntry {
  id: string;
  status: TestResultStatus;
  userName: string;
  runName: string;
  caseName: string;
  createdAt: string;
}

// Test case priority enum
export enum CasePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Test case type enum
export enum CaseType {
  FUNCTIONAL = 'FUNCTIONAL',
  REGRESSION = 'REGRESSION',
  SMOKE = 'SMOKE',
  EXPLORATORY = 'EXPLORATORY',
  OTHER = 'OTHER',
}

// Backward-compatible aliases
export { CasePriority as TestCasePriority };
export { CaseType as TestCaseType };

// Template type enum — TEXT for rich-text body, STEPS for structured steps
export enum TemplateType {
  TEXT = 'TEXT',
  STEPS = 'STEPS',
}

// Test case step shape returned by API
export interface TestCaseStepDto {
  id: string;
  caseId: string;
  stepNumber: number;
  description: string;
  expectedResult: string;
  createdAt: string;
  updatedAt: string;
}

// Test case shape returned by API
export interface TestCaseDto extends BaseEntity {
  title: string;
  preconditions: string | null;
  templateType: TemplateType;
  priority: CasePriority;
  type: CaseType;
  estimate: number | null;
  references: string | null;
  position: number;
  suiteId: string;
  projectId: string;
  deletedAt: string | null;
}

// Test case with steps included
export interface TestCaseWithStepsDto extends TestCaseDto {
  steps: TestCaseStepDto[];
}

// Shared step item shape returned by API
export interface SharedStepItemDto {
  id: string;
  sharedStepId: string;
  stepNumber: number;
  description: string;
  expectedResult: string;
  createdAt: string;
  updatedAt: string;
}

// Shared step shape returned by API (without items)
export interface SharedStepDto {
  id: string;
  title: string;
  projectId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Shared step with items included
export interface SharedStepWithItemsDto extends SharedStepDto {
  items: SharedStepItemDto[];
}

// Case history entry for the audit trail
export interface CaseHistoryDto {
  id: string;
  caseId: string;
  userId: string;
  user: { id: string; name: string; email: string };
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Lightweight step shape for inline form editing (action + expected)
export interface TestCaseStep {
  action: string;
  expected: string;
}

// Attachment entity type — polymorphic relation target
export enum AttachmentEntityType {
  TEST_CASE = 'TEST_CASE',
  TEST_RESULT = 'TEST_RESULT',
}

// Attachment shape returned by API
export interface AttachmentDto extends BaseEntity {
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  entityType: AttachmentEntityType;
  entityId: string;
  uploadedById: string;
  uploadedBy: { id: string; name: string; email: string };
}


// JWT payload embedded in access/refresh tokens
export interface JwtPayload {
  sub: string;   // user id (cuid)
  email: string;
  role: Role;
}

// Milestone status — open or closed
export enum MilestoneStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

// Milestone shape returned by API
export interface MilestoneDto extends BaseEntity {
  name: string;
  description: string | null;
  projectId: string;
  parentId: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  deletedAt: string | null;
}

// Milestone tree node with nested children and aggregated progress
export interface MilestoneTreeNode extends MilestoneDto {
  children: MilestoneTreeNode[];
  progress: MilestoneProgress;
}

// Aggregated progress for a milestone (own + children)
export interface MilestoneProgress {
  open: number;
  closed: number;
  total: number;
  percent: number;
}

// Defect reference shape returned by API
export interface DefectDto extends BaseEntity {
  reference: string;
  description: string | null;
  projectId: string;
  testResultId: string | null;
  deletedAt: string | null;
}

// Defect with linked test result context for detail view
export interface DefectWithResultDto extends DefectDto {
  testResult: {
    id: string;
    status: TestResultStatus;
    comment: string | null;
    testRunId: string;
    testRunCase: {
      suite: { id: string; name: string };
    };
    testRun: {
      id: string;
      name: string;
    };
  } | null;
}

/** Reference coverage: which references have passing/failing tests */
export interface ReferenceCoverageDto {
  references: ReferenceCoverageEntry[];
}

/** A single reference with its test status breakdown */
export interface ReferenceCoverageEntry {
  reference: string;
  totalCases: number;
  passed: number;
  failed: number;
  blocked: number;
  retest: number;
  untested: number;
  coveragePercent: number;
}
