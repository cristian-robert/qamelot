# Test Case Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full CRUD for test cases with a split-pane editor — suite tree on the left, case editor on the right.

**Architecture:** Test cases belong to suites within projects. The backend adds a `TestCase` Prisma model with JSON steps, enums for priority/type, and a soft-delete pattern matching existing entities. The frontend adds an API client, query hook, case list, and inline step editor in the existing project detail page's main pane.

**Tech Stack:** NestJS + Prisma (backend), Next.js 16 + Tanstack Query + React Hook Form + Zod + shadcn/ui (frontend), shared types/schemas in `packages/shared`

---

## File Structure

### Shared (`packages/shared/src/`)
- **Modify:** `types/index.ts` — add `TestCasePriority`, `TestCaseType` enums, `TestCaseStep`, `TestCaseDto`
- **Create:** `schemas/test-case.ts` — Zod schemas for create/update case
- **Modify:** `index.ts` — re-export new schemas

### Backend (`apps/backend/src/`)
- **Modify:** `prisma/schema.prisma` — add `Priority`, `Type` enums, `TestCase` model
- **Create:** `test-cases/test-cases.module.ts`
- **Create:** `test-cases/test-cases.controller.ts`
- **Create:** `test-cases/test-cases.service.ts`
- **Create:** `test-cases/dto/test-case-step.dto.ts` — shared step DTO (used by both create and update)
- **Create:** `test-cases/dto/create-test-case.dto.ts`
- **Create:** `test-cases/dto/update-test-case.dto.ts`
- **Create:** `test-cases/test-cases.controller.spec.ts`
- **Create:** `test-cases/test-cases.service.spec.ts`
- **Modify:** `app.module.ts` — import `TestCasesModule`

### Frontend (`apps/frontend/`)
- **Create:** `lib/api/test-cases.ts` — API client
- **Create:** `lib/test-cases/useTestCases.ts` — query hook
- **Create:** `components/test-cases/CaseList.tsx` — case list panel
- **Create:** `components/test-cases/CaseEditor.tsx` — case edit form with step editor
- **Create:** `components/test-cases/StepEditor.tsx` — inline step add/remove/reorder
- **Modify:** `app/(dashboard)/projects/[id]/page.tsx` — wire case list + editor into main pane

### Tests (Frontend)
- **Create:** `components/test-cases/CaseList.test.tsx`
- **Create:** `components/test-cases/CaseEditor.test.tsx`
- **Create:** `components/test-cases/StepEditor.test.tsx`
- **Create:** `lib/test-cases/useTestCases.test.ts`

---

## Chunk 1: Shared Types & Schemas

### Task 1: Add shared enums and types

**Files:**
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add TestCasePriority and TestCaseType enums and TestCaseDto to shared types**

Add to end of `packages/shared/src/types/index.ts`:

```typescript
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
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm --filter shared typecheck`
Expected: PASS, no errors

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat(shared): add Priority, Type enums and TestCaseDto type

Ref #5"
```

### Task 2: Add Zod schemas for test case validation

**Files:**
- Create: `packages/shared/src/schemas/test-case.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create test case Zod schemas**

Create `packages/shared/src/schemas/test-case.ts`:

```typescript
import { z } from 'zod';

export const TestCaseStepSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  expected: z.string().min(1, 'Expected result is required'),
});

export const CreateTestCaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  preconditions: z
    .string()
    .max(2000, 'Preconditions must be 2000 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  steps: z.array(TestCaseStepSchema).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY']).optional(),
  automationFlag: z.boolean().optional(),
});

export const UpdateTestCaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  preconditions: z
    .string()
    .max(2000, 'Preconditions must be 2000 characters or less')
    .nullable()
    .optional(),
  steps: z.array(TestCaseStepSchema).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY']).optional(),
  automationFlag: z.boolean().optional(),
});

export type CreateTestCaseInput = z.infer<typeof CreateTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof UpdateTestCaseSchema>;
```

- [ ] **Step 2: Export schemas from shared index**

Add to `packages/shared/src/index.ts`:

```typescript
export * from './schemas/test-case';
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm --filter shared typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/test-case.ts packages/shared/src/index.ts
git commit -m "feat(shared): add Zod schemas for test case create/update

Ref #5"
```

---

## Chunk 2: Backend — Prisma Schema & Migration

### Task 3: Add TestCase model to Prisma schema

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Add enums and TestCase model to schema**

Add the following enums and model to `schema.prisma`:

```prisma
enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum Type {
  FUNCTIONAL
  REGRESSION
  SMOKE
  ACCEPTANCE
  EXPLORATORY
}

model TestCase {
  id              String    @id @default(cuid())
  title           String
  preconditions   String?
  steps           Json      @default("[]")
  priority        Priority  @default(MEDIUM)
  type            Type      @default(FUNCTIONAL)
  automationFlag  Boolean   @default(false)
  suiteId         String
  suite           TestSuite @relation(fields: [suiteId], references: [id])
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id])
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([suiteId])
  @@index([projectId])
}
```

Also add the reverse relation to the `TestSuite` model:

```prisma
// In TestSuite model, add:
testCases   TestCase[]
```

And to the `Project` model:

```prisma
// In Project model, add:
testCases   TestCase[]
```

- [ ] **Step 2: Run Prisma migration**

Run: `cd apps/backend && npx prisma migrate dev --name add-test-case-model`
Expected: Migration created and applied successfully

- [ ] **Step 3: Generate Prisma client**

Run: `cd apps/backend && npx prisma generate`
Expected: Client generated

- [ ] **Step 4: Verify typecheck passes**

Run: `pnpm --filter backend typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(db): add TestCase model with Priority and Type enums

Adds TestCase with title, preconditions, JSON steps, priority, type,
automationFlag, and soft-delete support.

Ref #5"
```

---

## Chunk 3: Backend — Service (TDD)

### Task 4: Write test cases service tests (failing)

**Files:**
- Create: `apps/backend/src/test-cases/test-cases.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Create `apps/backend/src/test-cases/test-cases.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestCasesService } from './test-cases.service';

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockTestCase = {
  id: 'case-1',
  title: 'Verify login with valid credentials',
  preconditions: 'User exists in the system',
  steps: [{ action: 'Enter username', expected: 'Username accepted' }],
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestCasesService', () => {
  let service: TestCasesService;

  const mockPrisma = {
    testCase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
    testSuite: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestCasesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TestCasesService>(TestCasesService);
  });

  describe('create', () => {
    it('creates a test case in a suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.create.mockResolvedValue(mockTestCase);

      const result = await service.create(PROJECT_ID, SUITE_ID, {
        title: 'Verify login with valid credentials',
        preconditions: 'User exists in the system',
        steps: [{ action: 'Enter username', expected: 'Username accepted' }],
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testSuite.findFirst).toHaveBeenCalledWith({
        where: { id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: {
          title: 'Verify login with valid credentials',
          preconditions: 'User exists in the system',
          steps: [{ action: 'Enter username', expected: 'Username accepted' }],
          projectId: PROJECT_ID,
          suiteId: SUITE_ID,
        },
      });
      expect(result).toEqual(mockTestCase);
    });

    it('creates a case with defaults when optional fields omitted', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.create.mockResolvedValue(mockTestCase);

      await service.create(PROJECT_ID, SUITE_ID, { title: 'Simple case' });

      expect(mockPrisma.testCase.create).toHaveBeenCalledWith({
        data: {
          title: 'Simple case',
          projectId: PROJECT_ID,
          suiteId: SUITE_ID,
        },
      });
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, SUITE_ID, { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when suite does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, SUITE_ID, { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllBySuite', () => {
    it('returns all non-deleted cases for a suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue({ id: SUITE_ID, projectId: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findMany.mockResolvedValue([mockTestCase]);

      const result = await service.findAllBySuite(PROJECT_ID, SUITE_ID);

      expect(mockPrisma.testCase.findMany).toHaveBeenCalledWith({
        where: { suiteId: SUITE_ID, projectId: PROJECT_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockTestCase]);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllBySuite(PROJECT_ID, SUITE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns a single test case', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);

      const result = await service.findOne(PROJECT_ID, 'case-1');

      expect(mockPrisma.testCase.findFirst).toHaveBeenCalledWith({
        where: { id: 'case-1', projectId: PROJECT_ID, deletedAt: null },
      });
      expect(result).toEqual(mockTestCase);
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(service.findOne(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates a test case title', async () => {
      const updated = { ...mockTestCase, title: 'Updated title' };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'case-1', { title: 'Updated title' });

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { title: 'Updated title' },
      });
      expect(result).toEqual(updated);
    });

    it('updates steps, priority, type, and automationFlag', async () => {
      const newSteps = [{ action: 'Click login', expected: 'Dashboard shown' }];
      const updated = {
        ...mockTestCase,
        steps: newSteps,
        priority: 'HIGH',
        type: 'REGRESSION',
        automationFlag: true,
      };
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'case-1', {
        steps: newSteps,
        priority: 'HIGH',
        type: 'REGRESSION',
        automationFlag: true,
      });

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: {
          steps: newSteps,
          priority: 'HIGH',
          type: 'REGRESSION',
          automationFlag: true,
        },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('soft-deletes a test case', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(mockTestCase);
      mockPrisma.testCase.update.mockResolvedValue({ ...mockTestCase, deletedAt: new Date() });

      const result = await service.softDelete(PROJECT_ID, 'case-1');

      expect(mockPrisma.testCase.update).toHaveBeenCalledWith({
        where: { id: 'case-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeTruthy();
    });

    it('throws NotFoundException when case does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testCase.findFirst.mockResolvedValue(null);

      await expect(service.softDelete(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter backend test -- --testPathPattern="test-cases.service.spec"`
Expected: FAIL — `Cannot find module './test-cases.service'`

### Task 5: Implement test cases service

**Files:**
- Create: `apps/backend/src/test-cases/test-cases.service.ts`

- [ ] **Step 1: Implement the service**

Create `apps/backend/src/test-cases/test-cases.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';

@Injectable()
export class TestCasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, suiteId: string, data: CreateTestCaseInput) {
    await this.verifyProject(projectId);
    await this.verifySuiteInProject(suiteId, projectId);

    return this.prisma.testCase.create({
      data: {
        title: data.title,
        ...(data.preconditions !== undefined && { preconditions: data.preconditions }),
        ...(data.steps !== undefined && { steps: data.steps }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.automationFlag !== undefined && { automationFlag: data.automationFlag }),
        projectId,
        suiteId,
      },
    });
  }

  async findAllBySuite(projectId: string, suiteId: string) {
    await this.verifyProject(projectId);
    await this.verifySuiteInProject(suiteId, projectId);

    return this.prisma.testCase.findMany({
      where: { suiteId, projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string) {
    await this.verifyProject(projectId);

    const testCase = await this.prisma.testCase.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }
    return testCase;
  }

  async update(projectId: string, id: string, data: UpdateTestCaseInput) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(id, projectId);

    return this.prisma.testCase.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.preconditions !== undefined && { preconditions: data.preconditions }),
        ...(data.steps !== undefined && { steps: data.steps }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.automationFlag !== undefined && { automationFlag: data.automationFlag }),
      },
    });
  }

  async softDelete(projectId: string, id: string) {
    await this.verifyProject(projectId);
    await this.verifyCaseInProject(id, projectId);

    return this.prisma.testCase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async verifySuiteInProject(suiteId: string, projectId: string) {
    const suite = await this.prisma.testSuite.findFirst({
      where: { id: suiteId, projectId, deletedAt: null },
    });
    if (!suite) {
      throw new NotFoundException('Test suite not found');
    }
    return suite;
  }

  private async verifyCaseInProject(caseId: string, projectId: string) {
    const testCase = await this.prisma.testCase.findFirst({
      where: { id: caseId, projectId, deletedAt: null },
    });
    if (!testCase) {
      throw new NotFoundException('Test case not found');
    }
    return testCase;
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm --filter backend test -- --testPathPattern="test-cases.service.spec"`
Expected: PASS — all tests green

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/test-cases/test-cases.service.ts apps/backend/src/test-cases/test-cases.service.spec.ts
git commit -m "feat(backend): add TestCasesService with full CRUD and soft-delete

TDD: tests written first, then implementation.

Ref #5"
```

---

## Chunk 4: Backend — Controller & DTOs (TDD)

### Task 6: Create DTOs for test case endpoints

**Files:**
- Create: `apps/backend/src/test-cases/dto/test-case-step.dto.ts`
- Create: `apps/backend/src/test-cases/dto/create-test-case.dto.ts`
- Create: `apps/backend/src/test-cases/dto/update-test-case.dto.ts`

- [ ] **Step 1: Create shared TestCaseStepDto**

Create `apps/backend/src/test-cases/dto/test-case-step.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TestCaseStepDto {
  @ApiProperty({ example: 'Click the login button' })
  @IsString()
  @MinLength(1)
  action!: string;

  @ApiProperty({ example: 'Login form is displayed' })
  @IsString()
  @MinLength(1)
  expected!: string;
}
```

- [ ] **Step 2: Create CreateTestCaseDto**

Create `apps/backend/src/test-cases/dto/create-test-case.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCaseStepDto } from './test-case-step.dto';

export class CreateTestCaseDto {
  @ApiProperty({ example: 'Verify login with valid credentials', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'User must exist in the system', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  preconditions?: string;

  @ApiPropertyOptional({ type: [TestCaseStepDto], description: 'Ordered test steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseStepDto)
  @IsOptional()
  steps?: TestCaseStepDto[];

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' })
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  @IsOptional()
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiPropertyOptional({
    enum: ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'],
    default: 'FUNCTIONAL',
  })
  @IsIn(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'])
  @IsOptional()
  type?: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'ACCEPTANCE' | 'EXPLORATORY';

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  automationFlag?: boolean;
}
```

- [ ] **Step 3: Create UpdateTestCaseDto**

Create `apps/backend/src/test-cases/dto/update-test-case.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
  ValidateIf,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TestCaseStepDto } from './test-case-step.dto';

export class UpdateTestCaseDto {
  @ApiPropertyOptional({ example: 'Updated test title', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated preconditions', maxLength: 2000, nullable: true })
  @ValidateIf((o) => o.preconditions !== null)
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  preconditions?: string | null;

  @ApiPropertyOptional({ type: [TestCaseStepDto], description: 'Ordered test steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseStepDto)
  @IsOptional()
  steps?: TestCaseStepDto[];

  @ApiPropertyOptional({ enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] })
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  @IsOptional()
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  @ApiPropertyOptional({
    enum: ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'],
  })
  @IsIn(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'])
  @IsOptional()
  type?: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'ACCEPTANCE' | 'EXPLORATORY';

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  automationFlag?: boolean;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/test-cases/dto/
git commit -m "feat(backend): add test case DTOs with class-validator decorators

Ref #5"
```

### Task 7: Write controller tests (failing)

**Files:**
- Create: `apps/backend/src/test-cases/test-cases.controller.spec.ts`

- [ ] **Step 1: Write failing controller tests**

Create `apps/backend/src/test-cases/test-cases.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockTestCase = {
  id: 'case-1',
  title: 'Verify login',
  preconditions: null,
  steps: [],
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestCasesController', () => {
  let controller: TestCasesController;

  const mockService = {
    create: jest.fn(),
    findAllBySuite: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestCasesController],
      providers: [{ provide: TestCasesService, useValue: mockService }],
    }).compile();
    controller = module.get<TestCasesController>(TestCasesController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockTestCase);

    const result = await controller.create(PROJECT_ID, SUITE_ID, { title: 'Verify login' });

    expect(mockService.create).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID, { title: 'Verify login' });
    expect(result).toEqual(mockTestCase);
  });

  it('findAllBySuite delegates to service', async () => {
    mockService.findAllBySuite.mockResolvedValue([mockTestCase]);

    const result = await controller.findAllBySuite(PROJECT_ID, SUITE_ID);

    expect(mockService.findAllBySuite).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID);
    expect(result).toEqual([mockTestCase]);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue(mockTestCase);

    const result = await controller.findOne(PROJECT_ID, 'case-1');

    expect(mockService.findOne).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    expect(result).toEqual(mockTestCase);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockTestCase, title: 'Updated' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update(PROJECT_ID, 'case-1', { title: 'Updated' });

    expect(mockService.update).toHaveBeenCalledWith(PROJECT_ID, 'case-1', { title: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('remove delegates to service', async () => {
    const deleted = { ...mockTestCase, deletedAt: new Date() };
    mockService.softDelete.mockResolvedValue(deleted);

    const result = await controller.remove(PROJECT_ID, 'case-1');

    expect(mockService.softDelete).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    expect(result).toEqual(deleted);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter backend test -- --testPathPattern="test-cases.controller.spec"`
Expected: FAIL — `Cannot find module './test-cases.controller'`

### Task 8: Implement controller and module

**Files:**
- Create: `apps/backend/src/test-cases/test-cases.controller.ts`
- Create: `apps/backend/src/test-cases/test-cases.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Implement the controller**

Create `apps/backend/src/test-cases/test-cases.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

@ApiTags('test-cases')
@Controller('projects/:projectId')
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Post('suites/:suiteId/cases')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a test case in a suite' })
  @ApiResponse({ status: 201, description: 'Test case created' })
  @ApiResponse({ status: 404, description: 'Project or suite not found' })
  create(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
    @Body() dto: CreateTestCaseDto,
  ) {
    return this.testCasesService.create(projectId, suiteId, dto);
  }

  @Get('suites/:suiteId/cases')
  @ApiOperation({ summary: 'List all test cases in a suite' })
  @ApiResponse({ status: 200, description: 'Array of test cases' })
  @ApiResponse({ status: 404, description: 'Project or suite not found' })
  findAllBySuite(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
  ) {
    return this.testCasesService.findAllBySuite(projectId, suiteId);
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a single test case' })
  @ApiResponse({ status: 200, description: 'Test case details' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testCasesService.findOne(projectId, id);
  }

  @Patch('cases/:id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a test case' })
  @ApiResponse({ status: 200, description: 'Test case updated' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTestCaseDto,
  ) {
    return this.testCasesService.update(projectId, id, dto);
  }

  @Delete('cases/:id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Soft-delete a test case' })
  @ApiResponse({ status: 200, description: 'Test case deleted' })
  @ApiResponse({ status: 404, description: 'Test case not found' })
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testCasesService.softDelete(projectId, id);
  }
}
```

- [ ] **Step 2: Create the module**

Create `apps/backend/src/test-cases/test-cases.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestCasesController } from './test-cases.controller';
import { TestCasesService } from './test-cases.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestCasesController],
  providers: [TestCasesService],
  exports: [TestCasesService],
})
export class TestCasesModule {}
```

- [ ] **Step 3: Register module in AppModule**

In `apps/backend/src/app.module.ts`, add:
- Import: `import { TestCasesModule } from './test-cases/test-cases.module';`
- Add `TestCasesModule` to the `imports` array

- [ ] **Step 4: Run controller tests to verify they pass**

Run: `pnpm --filter backend test -- --testPathPattern="test-cases.controller.spec"`
Expected: PASS

- [ ] **Step 5: Run ALL backend tests to verify no regressions**

Run: `pnpm --filter backend test`
Expected: All tests pass

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter backend typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/test-cases/ apps/backend/src/app.module.ts
git commit -m "feat(backend): add TestCasesController, module, and DTOs

Thin controller delegates to service. Routes:
- POST /projects/:projectId/suites/:suiteId/cases
- GET  /projects/:projectId/suites/:suiteId/cases
- GET  /projects/:projectId/cases/:id
- PATCH /projects/:projectId/cases/:id
- DELETE /projects/:projectId/cases/:id

Ref #5"
```

---

## Chunk 5: Frontend — API Client & Hook

### Task 9: Add frontend API client for test cases

**Files:**
- Create: `apps/frontend/lib/api/test-cases.ts`

- [ ] **Step 1: Create API client**

Create `apps/frontend/lib/api/test-cases.ts`:

```typescript
import type { TestCaseDto, CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';
import { apiFetch } from './client';

export const testCasesApi = {
  listBySuite: (projectId: string, suiteId: string) =>
    apiFetch<TestCaseDto[]>(`/projects/${projectId}/suites/${suiteId}/cases`),

  getById: (projectId: string, id: string) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`),

  create: (projectId: string, suiteId: string, data: CreateTestCaseInput) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/suites/${suiteId}/cases`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateTestCaseInput) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (projectId: string, id: string) =>
    apiFetch<TestCaseDto>(`/projects/${projectId}/cases/${id}`, {
      method: 'DELETE',
    }),
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/lib/api/test-cases.ts
git commit -m "feat(frontend): add test cases API client

Ref #5"
```

### Task 10: Add useTestCases hook (TDD)

**Files:**
- Create: `apps/frontend/lib/test-cases/useTestCases.test.ts`
- Create: `apps/frontend/lib/test-cases/useTestCases.ts`

- [ ] **Step 1: Write failing hook test**

Create `apps/frontend/lib/test-cases/useTestCases.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTestCases, testCasesQueryKey } from './useTestCases';
import { testCasesApi } from '../api/test-cases';
import type { TestCaseDto } from '@app/shared';

vi.mock('../api/test-cases', () => ({
  testCasesApi: {
    listBySuite: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockList = testCasesApi.listBySuite as ReturnType<typeof vi.fn>;
const mockCreate = testCasesApi.create as ReturnType<typeof vi.fn>;
const mockUpdate = testCasesApi.update as ReturnType<typeof vi.fn>;
const mockRemove = testCasesApi.remove as ReturnType<typeof vi.fn>;

const PROJECT_ID = 'proj-1';
const SUITE_ID = 'suite-1';

const mockCase: TestCaseDto = {
  id: 'case-1',
  title: 'Verify login',
  preconditions: null,
  steps: [],
  priority: 'MEDIUM',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: SUITE_ID,
  projectId: PROJECT_ID,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useTestCases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns cases for a suite', async () => {
    mockList.mockResolvedValue([mockCase]);
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.cases).toEqual([mockCase]);
    });
    expect(mockList).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID);
  });

  it('returns empty array when suiteId is null', () => {
    const { result } = renderHook(() => useTestCases(PROJECT_ID, null), {
      wrapper: createWrapper(),
    });

    expect(result.current.cases).toEqual([]);
    expect(mockList).not.toHaveBeenCalled();
  });

  it('exposes query key builder', () => {
    expect(testCasesQueryKey(PROJECT_ID, SUITE_ID)).toEqual([
      'projects',
      PROJECT_ID,
      'suites',
      SUITE_ID,
      'cases',
    ]);
  });

  it('createCase calls API and invalidates query', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue(mockCase);
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createCase.mutate({ title: 'New case' });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(PROJECT_ID, SUITE_ID, { title: 'New case' });
    });
  });

  it('updateCase calls API with id and data', async () => {
    mockList.mockResolvedValue([mockCase]);
    mockUpdate.mockResolvedValue({ ...mockCase, title: 'Updated' });
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.cases).toHaveLength(1));

    result.current.updateCase.mutate({ id: 'case-1', data: { title: 'Updated' } });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(PROJECT_ID, 'case-1', { title: 'Updated' });
    });
  });

  it('deleteCase calls API with id', async () => {
    mockList.mockResolvedValue([mockCase]);
    mockRemove.mockResolvedValue(mockCase);
    const { result } = renderHook(() => useTestCases(PROJECT_ID, SUITE_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.cases).toHaveLength(1));

    result.current.deleteCase.mutate('case-1');

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(PROJECT_ID, 'case-1');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test -- --run --reporter=verbose useTestCases.test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

Create `apps/frontend/lib/test-cases/useTestCases.ts`:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '@app/shared';
import { testCasesApi } from '../api/test-cases';

export function testCasesQueryKey(projectId: string, suiteId: string) {
  return ['projects', projectId, 'suites', suiteId, 'cases'] as const;
}

export function useTestCases(projectId: string, suiteId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = suiteId ? testCasesQueryKey(projectId, suiteId) : [];

  const { data: cases, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testCasesApi.listBySuite(projectId, suiteId!),
    enabled: !!projectId && !!suiteId,
  });

  const createCase = useMutation({
    mutationFn: (data: CreateTestCaseInput) =>
      testCasesApi.create(projectId, suiteId!, data),
    onSuccess: () => {
      if (suiteId) queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateCase = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestCaseInput }) =>
      testCasesApi.update(projectId, id, data),
    onSuccess: () => {
      if (suiteId) queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteCase = useMutation({
    mutationFn: (id: string) => testCasesApi.remove(projectId, id),
    onSuccess: () => {
      if (suiteId) queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    cases: cases ?? [],
    isLoading,
    error,
    createCase,
    updateCase,
    deleteCase,
  };
}
```

- [ ] **Step 4: Run hook tests to verify they pass**

Run: `pnpm --filter frontend test -- --run --reporter=verbose useTestCases.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/lib/test-cases/ apps/frontend/lib/api/test-cases.ts
git commit -m "feat(frontend): add useTestCases hook with TDD

Query hook for CRUD operations on test cases within a suite.

Ref #5"
```

---

## Chunk 6: Frontend — UI Components

### Task 11: Install required shadcn/ui components

Before building UI, check if `select`, `textarea`, `badge`, `checkbox`, and `label` components exist. If not, install them.

- [ ] **Step 1: Install missing shadcn/ui components**

Run: `cd apps/frontend && npx shadcn@latest add select textarea badge checkbox label separator`
Expected: Components installed to `components/ui/`

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/components/ui/
git commit -m "chore(frontend): add shadcn/ui select, textarea, badge, checkbox, label, separator

Ref #5"
```

### Task 12: Build StepEditor component (TDD)

**Files:**
- Create: `apps/frontend/components/test-cases/StepEditor.test.tsx`
- Create: `apps/frontend/components/test-cases/StepEditor.tsx`

- [ ] **Step 1: Write failing StepEditor tests**

Create `apps/frontend/components/test-cases/StepEditor.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepEditor } from './StepEditor';
import type { TestCaseStep } from '@app/shared';

describe('StepEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing steps', () => {
    const steps: TestCaseStep[] = [
      { action: 'Click login', expected: 'Form appears' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('Click login')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Form appears')).toBeInTheDocument();
  });

  it('adds a new empty step when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<StepEditor steps={[]} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /add step/i }));

    expect(mockOnChange).toHaveBeenCalledWith([{ action: '', expected: '' }]);
  });

  it('removes a step when remove button is clicked', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [
      { action: 'Step 1', expected: 'Result 1' },
      { action: 'Step 2', expected: 'Result 2' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove step/i });
    await user.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([{ action: 'Step 2', expected: 'Result 2' }]);
  });

  it('updates a step action field', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [{ action: 'Old', expected: 'Result' }];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const actionInput = screen.getByDisplayValue('Old');
    await user.clear(actionInput);
    await user.type(actionInput, 'New');

    // Last call should have the updated action
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
    expect(lastCall[0].action).toBe('New');
  });

  it('renders step numbers', () => {
    const steps: TestCaseStep[] = [
      { action: 'Step A', expected: 'Result A' },
      { action: 'Step B', expected: 'Result B' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('moves a step up', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [
      { action: 'First', expected: 'R1' },
      { action: 'Second', expected: 'R2' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(moveUpButtons[1]); // move second step up

    expect(mockOnChange).toHaveBeenCalledWith([
      { action: 'Second', expected: 'R2' },
      { action: 'First', expected: 'R1' },
    ]);
  });

  it('moves a step down', async () => {
    const user = userEvent.setup();
    const steps: TestCaseStep[] = [
      { action: 'First', expected: 'R1' },
      { action: 'Second', expected: 'R2' },
    ];
    render(<StepEditor steps={steps} onChange={mockOnChange} />);

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    await user.click(moveDownButtons[0]); // move first step down

    expect(mockOnChange).toHaveBeenCalledWith([
      { action: 'Second', expected: 'R2' },
      { action: 'First', expected: 'R1' },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test -- --run --reporter=verbose StepEditor.test`
Expected: FAIL

- [ ] **Step 3: Implement StepEditor**

Create `apps/frontend/components/test-cases/StepEditor.tsx`:

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TestCaseStep } from '@app/shared';

interface StepEditorProps {
  steps: TestCaseStep[];
  onChange: (steps: TestCaseStep[]) => void;
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const addStep = () => {
    onChange([...steps, { action: '', expected: '' }]);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof TestCaseStep, value: string) => {
    const updated = steps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step,
    );
    onChange(updated);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Steps</span>
        <Button type="button" size="sm" variant="outline" onClick={addStep}>
          Add Step
        </Button>
      </div>

      {steps.length === 0 && (
        <p className="text-sm text-muted-foreground">No steps yet. Click "Add Step" to begin.</p>
      )}

      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-2 rounded border p-2">
          <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {index + 1}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <Input
              placeholder="Action"
              value={step.action}
              onChange={(e) => updateStep(index, 'action', e.target.value)}
            />
            <Input
              placeholder="Expected result"
              value={step.expected}
              onChange={(e) => updateStep(index, 'expected', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => moveStep(index, -1)}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Move down"
              disabled={index === steps.length - 1}
              onClick={() => moveStep(index, 1)}
            >
              ↓
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Remove step"
              onClick={() => removeStep(index)}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter frontend test -- --run --reporter=verbose StepEditor.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/test-cases/StepEditor.tsx apps/frontend/components/test-cases/StepEditor.test.tsx
git commit -m "feat(frontend): add StepEditor component with TDD

Inline add/remove/reorder steps for test cases.

Ref #5"
```

### Task 13: Build CaseEditor component (TDD)

The case editor is the form for creating/editing a test case — title, preconditions, priority, type, automation flag, and steps.

**Files:**
- Create: `apps/frontend/components/test-cases/CaseEditor.test.tsx`
- Create: `apps/frontend/components/test-cases/CaseEditor.tsx`

- [ ] **Step 1: Write failing CaseEditor tests**

Create `apps/frontend/components/test-cases/CaseEditor.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseEditor } from './CaseEditor';
import type { TestCaseDto } from '@app/shared';

describe('CaseEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty form for new case', () => {
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/preconditions/i)).toHaveValue('');
  });

  it('renders form pre-filled when editing existing case', () => {
    const testCase: TestCaseDto = {
      id: 'case-1',
      title: 'Verify login',
      preconditions: 'User exists',
      steps: [{ action: 'Click', expected: 'OK' }],
      priority: 'HIGH',
      type: 'REGRESSION',
      automationFlag: true,
      suiteId: 'suite-1',
      projectId: 'proj-1',
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    render(
      <CaseEditor
        testCase={testCase}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue('Verify login');
    expect(screen.getByLabelText(/preconditions/i)).toHaveValue('User exists');
  });

  it('calls onSave with form data on submit', async () => {
    const user = userEvent.setup();
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    await user.type(screen.getByLabelText(/title/i), 'New test case');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedData = mockOnSave.mock.calls[0][0];
    expect(savedData.title).toBe('New test case');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables save button when isPending is true', () => {
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={true} />);

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup();
    render(<CaseEditor onSave={mockOnSave} onCancel={mockOnCancel} isPending={false} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test -- --run --reporter=verbose CaseEditor.test`
Expected: FAIL

- [ ] **Step 3: Implement CaseEditor**

Create `apps/frontend/components/test-cases/CaseEditor.tsx`:

```typescript
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTestCaseSchema, type CreateTestCaseInput, type TestCaseDto, type TestCaseStep } from '@app/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StepEditor } from './StepEditor';

interface CaseEditorProps {
  testCase?: TestCaseDto;
  onSave: (data: CreateTestCaseInput) => void;
  onCancel: () => void;
  isPending: boolean;
}

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const TYPES = ['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'ACCEPTANCE', 'EXPLORATORY'] as const;

export function CaseEditor({ testCase, onSave, onCancel, isPending }: CaseEditorProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTestCaseInput>({
    resolver: zodResolver(CreateTestCaseSchema),
    defaultValues: {
      title: testCase?.title ?? '',
      preconditions: testCase?.preconditions ?? '',
      steps: testCase?.steps ?? [],
      priority: testCase?.priority ?? 'MEDIUM',
      type: testCase?.type ?? 'FUNCTIONAL',
      automationFlag: testCase?.automationFlag ?? false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} placeholder="Test case title" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="preconditions">Preconditions</Label>
        <Textarea
          id="preconditions"
          {...register('preconditions')}
          placeholder="Pre-conditions for this test case"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <Label>Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="automationFlag"
          render={({ field }) => (
            <Checkbox
              id="automationFlag"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="automationFlag">Automated</Label>
      </div>

      <Controller
        control={control}
        name="steps"
        render={({ field }) => (
          <StepEditor steps={field.value ?? []} onChange={field.onChange} />
        )}
      />

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter frontend test -- --run --reporter=verbose CaseEditor.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/test-cases/CaseEditor.tsx apps/frontend/components/test-cases/CaseEditor.test.tsx
git commit -m "feat(frontend): add CaseEditor form component with TDD

React Hook Form + Zod validation, priority/type selects, automation
checkbox, and integrated StepEditor.

Ref #5"
```

### Task 14: Build CaseList component (TDD)

The case list shows all test cases in the selected suite, with click-to-select.

**Files:**
- Create: `apps/frontend/components/test-cases/CaseList.test.tsx`
- Create: `apps/frontend/components/test-cases/CaseList.tsx`

- [ ] **Step 1: Write failing CaseList tests**

Create `apps/frontend/components/test-cases/CaseList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseList } from './CaseList';
import type { TestCaseDto } from '@app/shared';

const mockCase: TestCaseDto = {
  id: 'case-1',
  title: 'Verify login with valid credentials',
  preconditions: null,
  steps: [{ action: 'Click', expected: 'OK' }],
  priority: 'HIGH',
  type: 'FUNCTIONAL',
  automationFlag: false,
  suiteId: 'suite-1',
  projectId: 'proj-1',
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('CaseList', () => {
  const mockOnSelect = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders case titles', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Verify login with valid credentials')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('calls onSelect when a case is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseList
        cases={[mockCase]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    await user.click(screen.getByText('Verify login with valid credentials'));

    expect(mockOnSelect).toHaveBeenCalledWith('case-1');
  });

  it('highlights the selected case', () => {
    render(
      <CaseList
        cases={[mockCase]}
        selectedId="case-1"
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    const item = screen.getByText('Verify login with valid credentials').closest('[data-selected]');
    expect(item).toHaveAttribute('data-selected', 'true');
  });

  it('shows empty state when no cases', () => {
    render(
      <CaseList
        cases={[]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/no test cases/i)).toBeInTheDocument();
  });

  it('calls onCreate when new case button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CaseList
        cases={[]}
        selectedId={null}
        onSelect={mockOnSelect}
        onCreate={mockOnCreate}
        onDelete={mockOnDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /new case/i }));

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test -- --run --reporter=verbose CaseList.test`
Expected: FAIL

- [ ] **Step 3: Implement CaseList**

Create `apps/frontend/components/test-cases/CaseList.tsx`:

```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TestCaseDto } from '@app/shared';

interface CaseListProps {
  cases: TestCaseDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const PRIORITY_VARIANT: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

function formatLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function CaseList({ cases, selectedId, onSelect, onCreate, onDelete }: CaseListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-sm font-semibold">Test Cases</h3>
        <Button size="sm" variant="ghost" onClick={onCreate}>
          + New Case
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {cases.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No test cases in this suite yet.
          </p>
        ) : (
          <div className="divide-y">
            {cases.map((tc) => (
              <button
                key={tc.id}
                type="button"
                data-selected={selectedId === tc.id}
                className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedId === tc.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelect(tc.id)}
              >
                <span className="text-sm font-medium">{tc.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[tc.priority] ?? 'secondary'}>
                    {formatLabel(tc.priority)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatLabel(tc.type)}</span>
                  {tc.automationFlag && (
                    <span className="text-xs text-muted-foreground">Auto</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {tc.steps.length} step{tc.steps.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${tc.title}`}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(tc.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter frontend test -- --run --reporter=verbose CaseList.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/test-cases/CaseList.tsx apps/frontend/components/test-cases/CaseList.test.tsx
git commit -m "feat(frontend): add CaseList component with TDD

Displays test cases in a suite with priority badges and selection state.

Ref #5"
```

---

## Chunk 7: Frontend — Wire Up Project Detail Page

### Task 15: Integrate case list and editor into project detail page

**Files:**
- Modify: `apps/frontend/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Update project detail page to wire in test case components**

Modify `apps/frontend/app/(dashboard)/projects/[id]/page.tsx` to:

1. Add `selectedSuiteId` state — set when clicking a suite in the tree
2. Add `selectedCaseId` state — set when clicking a case in the list
3. Add `editorMode` state — `'idle' | 'create' | 'edit'`
4. Use `useTestCases(id, selectedSuiteId)` hook
5. Show `CaseList` in the main pane when a suite is selected
6. Show `CaseEditor` when creating/editing a case
7. Handle onSave → call `createCase.mutate()` or `updateCase.mutate()`

Key changes to the main content area:

```typescript
// New imports
import { useTestCases } from '@/lib/test-cases/useTestCases';
import { CaseList } from '@/components/test-cases/CaseList';
import { CaseEditor } from '@/components/test-cases/CaseEditor';
import type { CreateTestCaseInput } from '@app/shared';

// New state inside component
const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
const [editorMode, setEditorMode] = useState<'idle' | 'create' | 'edit'>('idle');

const { cases, isLoading: casesLoading, createCase, updateCase, deleteCase } =
  useTestCases(id, selectedSuiteId);

const selectedCase = selectedCaseId
  ? cases.find((c) => c.id === selectedCaseId) ?? null
  : null;

// Handler for suite selection (add onSelect prop to SuiteTree)
const handleSuiteSelect = (suiteId: string) => {
  setSelectedSuiteId(suiteId);
  setSelectedCaseId(null);
  setEditorMode('idle');
};

// Handler for case save
const handleCaseSave = (data: CreateTestCaseInput) => {
  if (editorMode === 'create' && selectedSuiteId) {
    createCase.mutate(data, {
      onSuccess: () => setEditorMode('idle'),
    });
  } else if (editorMode === 'edit' && selectedCaseId) {
    updateCase.mutate(
      { id: selectedCaseId, data },
      { onSuccess: () => setEditorMode('idle') },
    );
  }
};

const handleCaseDelete = (caseId: string) => {
  if (window.confirm('Delete this test case?')) {
    deleteCase.mutate(caseId, {
      onSuccess: () => {
        if (selectedCaseId === caseId) {
          setSelectedCaseId(null);
          setEditorMode('idle');
        }
      },
    });
  }
};
```

The main content area becomes a split between CaseList and CaseEditor:

```tsx
<main className="flex flex-1">
  {/* Case list panel */}
  {selectedSuiteId ? (
    <div className="flex w-72 shrink-0 flex-col border-r">
      {casesLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <CaseList
          cases={cases}
          selectedId={selectedCaseId}
          onSelect={(caseId) => {
            setSelectedCaseId(caseId);
            setEditorMode('edit');
          }}
          onCreate={() => {
            setSelectedCaseId(null);
            setEditorMode('create');
          }}
          onDelete={handleCaseDelete}
        />
      )}
    </div>
  ) : null}

  {/* Editor pane */}
  <div className="flex-1 p-6">
    {!selectedSuiteId && (
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
        <p className="mt-8 text-muted-foreground">
          Select a suite from the sidebar to view its test cases.
        </p>
      </div>
    )}

    {selectedSuiteId && editorMode === 'idle' && (
      <p className="text-muted-foreground">
        Select a test case or click "+ New Case" to create one.
      </p>
    )}

    {editorMode === 'create' && (
      <CaseEditor
        onSave={handleCaseSave}
        onCancel={() => setEditorMode('idle')}
        isPending={createCase.isPending}
      />
    )}

    {editorMode === 'edit' && selectedCase && (
      <CaseEditor
        key={selectedCase.id}
        testCase={selectedCase}
        onSave={handleCaseSave}
        onCancel={() => setEditorMode('idle')}
        isPending={updateCase.isPending}
      />
    )}
  </div>
</main>
```

- [ ] **Step 2: Add onSelect prop to SuiteTree**

Modify `apps/frontend/components/test-suites/SuiteTree.tsx`:

1. Add `onSelect?: (suiteId: string) => void` and `selectedId?: string | null` to both `SuiteTreeProps` and `SuiteTreeNodeProps`.

2. Pass them through from `SuiteTree` to `SuiteTreeNode`.

3. In `SuiteTreeNode`, add an `onClick` handler to the name `<span>` element that calls `onSelect?.(node.id)`. The existing expand/collapse button keeps its own `onClick`. The name `<span>` becomes a clickable `<button>` styled inline:

```typescript
// In SuiteTreeNode, replace the name span:
<button
  type="button"
  className={`truncate text-left hover:underline ${
    selectedId === node.id ? 'font-semibold' : ''
  }`}
  onClick={(e) => {
    e.stopPropagation();
    onSelect?.(node.id);
  }}
>
  {node.name}
</button>
```

4. Update the existing `SuiteTree.test.tsx` to add a test for `onSelect`:

```typescript
it('calls onSelect when suite name is clicked', async () => {
  const user = userEvent.setup();
  const mockOnSelect = vi.fn();
  const tree = [makeNode({ id: 'a', name: 'Alpha' })];
  render(<SuiteTree tree={tree} onSelect={mockOnSelect} {...otherProps} />);
  await user.click(screen.getByRole('button', { name: 'Alpha' }));
  expect(mockOnSelect).toHaveBeenCalledWith('a');
});
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app apps/frontend/components/test-suites/SuiteTree.tsx apps/frontend/components/test-suites/SuiteTree.test.tsx
git commit -m "feat(frontend): wire test case list and editor into project detail page

Split-pane layout: suite tree (left) → case list (center) → editor (right).
Selecting a suite shows its cases. Click a case to edit, or + New Case to create.

Ref #5"
```

---

## Chunk 8: Verification & Cleanup

### Task 16: Full verification

- [ ] **Step 1: Run all backend tests**

Run: `pnpm --filter backend test`
Expected: All pass

- [ ] **Step 2: Run all frontend tests**

Run: `pnpm --filter frontend test -- --run`
Expected: All pass

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: Zero errors

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: Zero errors

- [ ] **Step 5: Fix any issues found**

If any step above fails, fix the issue and re-run.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint/type/test issues from test case editor

Closes #5"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | 1–2 | Shared enums, types, Zod schemas |
| 2 | 3 | Prisma TestCase model + migration |
| 3 | 4–5 | TestCasesService (TDD) |
| 4 | 6–8 | DTOs, controller, module (TDD) |
| 5 | 9–10 | Frontend API client + hook (TDD) |
| 6 | 11–14 | UI components: StepEditor, CaseEditor, CaseList (TDD) |
| 7 | 15 | Wire everything into project detail page |
| 8 | 16 | Full verification pass |
