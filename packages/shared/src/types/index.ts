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

// JWT payload embedded in access/refresh tokens
export interface JwtPayload {
  sub: string;   // user id (cuid)
  email: string;
  role: Role;
}

// Test case priority levels
export enum TestCasePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Test case type classifications
export enum TestCaseType {
  FUNCTIONAL = 'FUNCTIONAL',
  REGRESSION = 'REGRESSION',
  SMOKE = 'SMOKE',
  ACCEPTANCE = 'ACCEPTANCE',
  EXPLORATORY = 'EXPLORATORY',
}

// A single step in a test case
export interface TestCaseStep {
  action: string;
  expected: string;
}

// Test case shape returned by API
export interface TestCaseDto extends BaseEntity {
  projectId: string;
  suiteId: string;
  title: string;
  preconditions: string | null;
  steps: TestCaseStep[];
  priority: TestCasePriority;
  type: TestCaseType;
  automationFlag: boolean;
  deletedAt: string | null;
}
