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
  deletedAt: string | null;
}

// Test run with nested relations for detail view
export interface TestRunDetailDto extends TestRunDto {
  testPlan: { id: string; name: string };
  assignedTo: { id: string; name: string; email: string } | null;
  testRunCases: TestRunCaseDto[];
}

// Junction between test run and suite
export interface TestRunCaseDto {
  id: string;
  testRunId: string;
  suiteId: string;
  suite: { id: string; name: string };
  createdAt: string;
}

// Test plan with run count for list views
export interface TestPlanWithRunCountDto extends TestPlanDto {
  _count: { testRuns: number };
}

// JWT payload embedded in access/refresh tokens
export interface JwtPayload {
  sub: string;   // user id (cuid)
  email: string;
  role: Role;
}
