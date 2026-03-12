# Test Suite Tree — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement hierarchical test suite tree structure (TestRail-style sections) per project, with CRUD backend endpoints, a collapsible sidebar tree UI, and context-menu actions.

**Architecture:** Self-referencing `TestSuite` Prisma model with `parentId` for arbitrary nesting. Backend returns a flat list; frontend builds the tree client-side for simplicity and performance. The project detail page gets a split-pane layout: collapsible tree sidebar (left) + content area (right).

**Tech Stack:** Prisma (self-relation), NestJS (module/controller/service), Next.js 16 App Router, Tanstack Query, React Hook Form + Zod, shadcn/ui, Tailwind v4

**Issue:** Closes #4

---

## File Structure

### Shared (`packages/shared/src/`)
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `schemas/test-suite.ts` | Zod schemas: CreateTestSuiteSchema, UpdateTestSuiteSchema + inferred types |
| Modify | `types/index.ts` | Add `TestSuiteDto` interface |
| Modify | `index.ts` | Re-export new schema module |

### Backend (`apps/backend/src/`)
| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `prisma/schema.prisma` | Add `TestSuite` model with self-relation + Project relation |
| Create | `test-suites/test-suites.module.ts` | NestJS module — imports PrismaModule, declares controller + service |
| Create | `test-suites/test-suites.service.ts` | Business logic: CRUD, soft-delete cascade, tree queries |
| Create | `test-suites/test-suites.controller.ts` | Thin REST controller nested under `/projects/:projectId/suites` |
| Create | `test-suites/dto/create-test-suite.dto.ts` | class-validator DTO for POST |
| Create | `test-suites/dto/update-test-suite.dto.ts` | class-validator DTO for PATCH |
| Modify | `app.module.ts` | Register `TestSuitesModule` |
| Create | `test-suites/test-suites.service.spec.ts` | Unit tests for service |
| Create | `test-suites/test-suites.controller.spec.ts` | Unit tests for controller |

### Frontend (`apps/frontend/`)
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `lib/api/test-suites.ts` | API client functions for test suite endpoints |
| Create | `lib/test-suites/useTestSuites.ts` | Tanstack Query hook: queries + mutations |
| Create | `lib/test-suites/tree-utils.ts` | Pure function: flat list → nested tree |
| Create | `lib/test-suites/tree-utils.test.ts` | Unit tests for tree builder |
| Create | `components/test-suites/SuiteTree.tsx` | Recursive collapsible tree component |
| Create | `components/test-suites/SuiteTree.test.tsx` | Tests for tree rendering + interactions |
| Create | `components/test-suites/SuiteContextMenu.tsx` | Right-click context menu (create/rename/delete) |
| Create | `components/test-suites/SuiteFormDialog.tsx` | Dialog for create/rename suite (React Hook Form + Zod) |
| Modify | `app/(dashboard)/projects/[id]/page.tsx` | Add split-pane layout: sidebar tree + content area |
| Create | `app/(dashboard)/projects/[id]/page.test.tsx` | Tests for updated project detail page |

---

## Chunk 1: Shared Types + Schemas + Prisma Model

### Task 1: Add TestSuiteDto to shared types

**Files:**
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add TestSuiteDto interface**

Add after `ProjectDto`:

```typescript
// Test suite node in a hierarchical tree structure
export interface TestSuiteDto extends BaseEntity {
  projectId: string;
  name: string;
  description: string | null;
  parentId: string | null;
  deletedAt: string | null;
}
```

- [ ] **Step 2: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: PASS — no errors

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat(shared): add TestSuiteDto interface

Closes #4"
```

---

### Task 2: Add Zod schemas for test suite

**Files:**
- Create: `packages/shared/src/schemas/test-suite.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create test suite Zod schemas**

```typescript
import { z } from 'zod';

export const CreateTestSuiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  parentId: z.string().optional(),
});

export const UpdateTestSuiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
  parentId: z.string().nullable().optional(),
});

export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteSchema>;
export type UpdateTestSuiteInput = z.infer<typeof UpdateTestSuiteSchema>;
```

- [ ] **Step 2: Re-export from index.ts**

Add to `packages/shared/src/index.ts`:

```typescript
export * from './schemas/test-suite';
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/test-suite.ts packages/shared/src/index.ts
git commit -m "feat(shared): add Zod schemas for test suite CRUD

Closes #4"
```

---

### Task 3: Add Prisma TestSuite model + migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Add TestSuite model to Prisma schema**

Add after the `Project` model:

```prisma
model TestSuite {
  id          String      @id @default(cuid())
  name        String
  description String?
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id])
  parentId    String?
  parent      TestSuite?  @relation("SuiteTree", fields: [parentId], references: [id])
  children    TestSuite[] @relation("SuiteTree")
  deletedAt   DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([projectId])
  @@index([parentId])
}
```

Also add the reverse relation to `Project`:

```prisma
model Project {
  // ... existing fields ...
  testSuites  TestSuite[]
}
```

- [ ] **Step 2: Generate and run migration**

Run:
```bash
pnpm --filter backend exec prisma migrate dev --name add-test-suite-model
```
Expected: Migration created and applied successfully.

- [ ] **Step 3: Verify Prisma Client generation**

Run:
```bash
pnpm --filter backend exec prisma generate
```
Expected: PASS — client generated with TestSuite model

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat(db): add TestSuite model with self-referencing tree relation

Self-referencing parent/child relation via 'SuiteTree'.
Indexes on projectId and parentId for tree queries.

Closes #4"
```

---

## Chunk 2: Backend — Service + Controller + DTOs

### Task 4: Create DTOs for test suites

**Files:**
- Create: `apps/backend/src/test-suites/dto/create-test-suite.dto.ts`
- Create: `apps/backend/src/test-suites/dto/update-test-suite.dto.ts`

- [ ] **Step 1: Create CreateTestSuiteDto**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateTestSuiteDto {
  @ApiProperty({ example: 'Login Tests', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Tests for the login flow', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'clxyz123abc', description: 'Parent suite ID for nesting' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  parentId?: string;
}
```

- [ ] **Step 2: Create UpdateTestSuiteDto**

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, ValidateIf } from 'class-validator';

export class UpdateTestSuiteDto {
  @ApiPropertyOptional({ example: 'Login Tests v2', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', maxLength: 500, nullable: true })
  @ValidateIf((o) => o.description !== null)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({
    example: 'clxyz456def',
    description: 'New parent suite ID (null to move to root)',
    nullable: true,
  })
  @ValidateIf((o) => o.parentId !== null)
  @IsString()
  @IsOptional()
  @MinLength(1)
  parentId?: string | null;
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/test-suites/dto/
git commit -m "feat(backend): add DTOs for test suite create/update

class-validator decorators + Swagger docs.

Closes #4"
```

---

### Task 5: Test-drive the TestSuitesService

**Files:**
- Create: `apps/backend/src/test-suites/test-suites.service.spec.ts`
- Create: `apps/backend/src/test-suites/test-suites.service.ts`

- [ ] **Step 1: Write failing tests for the service**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestSuitesService } from './test-suites.service';

const PROJECT_ID = 'proj-1';

const mockSuite = {
  id: 'suite-1',
  name: 'Login Tests',
  description: null,
  projectId: PROJECT_ID,
  parentId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const childSuite = {
  ...mockSuite,
  id: 'suite-2',
  name: 'OAuth Tests',
  parentId: 'suite-1',
};

describe('TestSuitesService', () => {
  let service: TestSuitesService;

  const mockPrisma = {
    testSuite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestSuitesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<TestSuitesService>(TestSuitesService);
  });

  describe('create', () => {
    it('creates a root suite', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.create.mockResolvedValue(mockSuite);

      const result = await service.create(PROJECT_ID, { name: 'Login Tests' });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testSuite.create).toHaveBeenCalledWith({
        data: { name: 'Login Tests', projectId: PROJECT_ID },
      });
      expect(result).toEqual(mockSuite);
    });

    it('creates a child suite with parentId', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue(mockSuite);
      mockPrisma.testSuite.create.mockResolvedValue(childSuite);

      const result = await service.create(PROJECT_ID, {
        name: 'OAuth Tests',
        parentId: 'suite-1',
      });

      expect(mockPrisma.testSuite.findFirst).toHaveBeenCalledWith({
        where: { id: 'suite-1', projectId: PROJECT_ID, deletedAt: null },
      });
      expect(mockPrisma.testSuite.create).toHaveBeenCalledWith({
        data: { name: 'OAuth Tests', projectId: PROJECT_ID, parentId: 'suite-1' },
      });
      expect(result).toEqual(childSuite);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.create(PROJECT_ID, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when parent suite does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROJECT_ID, { name: 'Test', parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProject', () => {
    it('returns all non-deleted suites for a project', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID, deletedAt: null });
      mockPrisma.testSuite.findMany.mockResolvedValue([mockSuite, childSuite]);

      const result = await service.findAllByProject(PROJECT_ID);

      expect(mockPrisma.testSuite.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, deletedAt: null },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockSuite, childSuite]);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.findAllByProject(PROJECT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a suite name', async () => {
      const updated = { ...mockSuite, name: 'Renamed' };
      mockPrisma.testSuite.findFirst.mockResolvedValue(mockSuite);
      mockPrisma.testSuite.update.mockResolvedValue(updated);

      const result = await service.update(PROJECT_ID, 'suite-1', { name: 'Renamed' });

      expect(mockPrisma.testSuite.update).toHaveBeenCalledWith({
        where: { id: 'suite-1' },
        data: { name: 'Renamed' },
      });
      expect(result).toEqual(updated);
    });

    it('moves a suite to root (parentId: null)', async () => {
      const moved = { ...childSuite, parentId: null };
      mockPrisma.testSuite.findFirst
        .mockResolvedValueOnce(childSuite) // finding the suite itself
      mockPrisma.testSuite.update.mockResolvedValue(moved);

      const result = await service.update(PROJECT_ID, 'suite-2', { parentId: null });

      expect(mockPrisma.testSuite.update).toHaveBeenCalledWith({
        where: { id: 'suite-2' },
        data: { parentId: null },
      });
      expect(result).toEqual(moved);
    });

    it('moves a suite to a different parent', async () => {
      const newParent = { ...mockSuite, id: 'suite-3', name: 'New Parent' };
      const moved = { ...childSuite, parentId: 'suite-3' };
      mockPrisma.testSuite.findFirst
        .mockResolvedValueOnce(childSuite)  // verify suite exists
        .mockResolvedValueOnce(newParent);  // verify new parent exists
      mockPrisma.testSuite.update.mockResolvedValue(moved);

      const result = await service.update(PROJECT_ID, 'suite-2', { parentId: 'suite-3' });

      expect(mockPrisma.testSuite.update).toHaveBeenCalledWith({
        where: { id: 'suite-2' },
        data: { parentId: 'suite-3' },
      });
      expect(result).toEqual(moved);
    });

    it('validates new parent exists when moving to non-null parent', async () => {
      mockPrisma.testSuite.findFirst
        .mockResolvedValueOnce(mockSuite) // finding the suite itself
        .mockResolvedValueOnce(null);     // parent not found

      await expect(
        service.update(PROJECT_ID, 'suite-1', { parentId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when suite does not exist', async () => {
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(
        service.update(PROJECT_ID, 'nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('soft-deletes a suite and its descendants', async () => {
      mockPrisma.testSuite.findFirst.mockResolvedValue(mockSuite);
      mockPrisma.testSuite.findMany.mockResolvedValue([childSuite]);
      mockPrisma.testSuite.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.softDelete(PROJECT_ID, 'suite-1');

      expect(mockPrisma.testSuite.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['suite-1', 'suite-2'] } },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ deleted: 2 });
    });

    it('throws NotFoundException when suite does not exist', async () => {
      mockPrisma.testSuite.findFirst.mockResolvedValue(null);

      await expect(service.softDelete(PROJECT_ID, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `pnpm --filter backend test -- --testPathPattern=test-suites.service.spec`
Expected: FAIL — `TestSuitesService` not found

- [ ] **Step 3: Implement TestSuitesService**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';

@Injectable()
export class TestSuitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, data: CreateTestSuiteInput) {
    await this.verifyProject(projectId);

    if (data.parentId) {
      await this.verifySuiteInProject(data.parentId, projectId);
    }

    return this.prisma.testSuite.create({
      data: {
        name: data.name,
        ...(data.description !== undefined && { description: data.description }),
        projectId,
        ...(data.parentId && { parentId: data.parentId }),
      },
    });
  }

  async findAllByProject(projectId: string) {
    await this.verifyProject(projectId);

    return this.prisma.testSuite.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async update(projectId: string, id: string, data: UpdateTestSuiteInput) {
    await this.verifySuiteInProject(id, projectId);

    if (data.parentId !== undefined && data.parentId !== null) {
      await this.verifySuiteInProject(data.parentId, projectId);
    }

    return this.prisma.testSuite.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });
  }

  async softDelete(projectId: string, id: string) {
    await this.verifySuiteInProject(id, projectId);

    const descendantIds = await this.collectDescendantIds(id);
    const allIds = [id, ...descendantIds];

    const result = await this.prisma.testSuite.updateMany({
      where: { id: { in: allIds } },
      data: { deletedAt: new Date() },
    });

    return { deleted: result.count };
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
  }

  private async collectDescendantIds(parentId: string): Promise<string[]> {
    const children = await this.prisma.testSuite.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true },
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      const grandchildren = await this.collectDescendantIds(child.id);
      ids.push(...grandchildren);
    }
    return ids;
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `pnpm --filter backend test -- --testPathPattern=test-suites.service.spec`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/test-suites/test-suites.service.ts apps/backend/src/test-suites/test-suites.service.spec.ts
git commit -m "feat(backend): add TestSuitesService with TDD

CRUD + soft-delete cascade for hierarchical test suites.
Validates project and parent suite existence.

Closes #4"
```

---

### Task 6: Test-drive the TestSuitesController

**Files:**
- Create: `apps/backend/src/test-suites/test-suites.controller.spec.ts`
- Create: `apps/backend/src/test-suites/test-suites.controller.ts`

- [ ] **Step 1: Write failing tests for the controller**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TestSuitesController } from './test-suites.controller';
import { TestSuitesService } from './test-suites.service';

const PROJECT_ID = 'proj-1';

const mockSuite = {
  id: 'suite-1',
  name: 'Login Tests',
  description: null,
  projectId: PROJECT_ID,
  parentId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TestSuitesController', () => {
  let controller: TestSuitesController;

  const mockService = {
    create: jest.fn(),
    findAllByProject: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestSuitesController],
      providers: [{ provide: TestSuitesService, useValue: mockService }],
    }).compile();
    controller = module.get<TestSuitesController>(TestSuitesController);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockSuite);

    const result = await controller.create(PROJECT_ID, { name: 'Login Tests' });

    expect(mockService.create).toHaveBeenCalledWith(PROJECT_ID, { name: 'Login Tests' });
    expect(result).toEqual(mockSuite);
  });

  it('findAll delegates to service', async () => {
    mockService.findAllByProject.mockResolvedValue([mockSuite]);

    const result = await controller.findAll(PROJECT_ID);

    expect(mockService.findAllByProject).toHaveBeenCalledWith(PROJECT_ID);
    expect(result).toEqual([mockSuite]);
  });

  it('update delegates to service', async () => {
    const updated = { ...mockSuite, name: 'Renamed' };
    mockService.update.mockResolvedValue(updated);

    const result = await controller.update(PROJECT_ID, 'suite-1', { name: 'Renamed' });

    expect(mockService.update).toHaveBeenCalledWith(PROJECT_ID, 'suite-1', { name: 'Renamed' });
    expect(result).toEqual(updated);
  });

  it('remove delegates to service', async () => {
    mockService.softDelete.mockResolvedValue({ deleted: 1 });

    const result = await controller.remove(PROJECT_ID, 'suite-1');

    expect(mockService.softDelete).toHaveBeenCalledWith(PROJECT_ID, 'suite-1');
    expect(result).toEqual({ deleted: 1 });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `pnpm --filter backend test -- --testPathPattern=test-suites.controller.spec`
Expected: FAIL — `TestSuitesController` not found

- [ ] **Step 3: Implement TestSuitesController**

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
import { TestSuitesService } from './test-suites.service';
import { CreateTestSuiteDto } from './dto/create-test-suite.dto';
import { UpdateTestSuiteDto } from './dto/update-test-suite.dto';

@ApiTags('test-suites')
@Controller('projects/:projectId/suites')
export class TestSuitesController {
  constructor(private readonly testSuitesService: TestSuitesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Create a test suite (root or nested)' })
  @ApiResponse({ status: 201, description: 'Suite created' })
  @ApiResponse({ status: 404, description: 'Project or parent suite not found' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTestSuiteDto,
  ) {
    return this.testSuitesService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all suites for a project (flat list for client-side tree building)' })
  @ApiResponse({ status: 200, description: 'Array of suites' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findAll(@Param('projectId') projectId: string) {
    return this.testSuitesService.findAllByProject(projectId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LEAD, Role.TESTER)
  @ApiOperation({ summary: 'Update a test suite (rename, move, change description)' })
  @ApiResponse({ status: 200, description: 'Suite updated' })
  @ApiResponse({ status: 404, description: 'Suite or parent not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTestSuiteDto,
  ) {
    return this.testSuitesService.update(projectId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Soft-delete a suite and all its descendants' })
  @ApiResponse({ status: 200, description: 'Suite(s) deleted' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.testSuitesService.softDelete(projectId, id);
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `pnpm --filter backend test -- --testPathPattern=test-suites.controller.spec`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/test-suites/test-suites.controller.ts apps/backend/src/test-suites/test-suites.controller.spec.ts
git commit -m "feat(backend): add TestSuitesController with nested route

Routes: POST/GET /projects/:projectId/suites, PATCH/DELETE .../suites/:id
Thin controller delegates to TestSuitesService.

Closes #4"
```

---

### Task 7: Create module + register in app

**Files:**
- Create: `apps/backend/src/test-suites/test-suites.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create TestSuitesModule**

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestSuitesController } from './test-suites.controller';
import { TestSuitesService } from './test-suites.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestSuitesController],
  providers: [TestSuitesService],
  exports: [TestSuitesService],
})
export class TestSuitesModule {}
```

- [ ] **Step 2: Register in AppModule**

Add import and register `TestSuitesModule` in `app.module.ts`:

```typescript
import { TestSuitesModule } from './test-suites/test-suites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TestSuitesModule,
  ],
  // ...
})
```

- [ ] **Step 3: Run all backend tests**

Run: `pnpm --filter backend test`
Expected: ALL PASS

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/test-suites/test-suites.module.ts apps/backend/src/app.module.ts
git commit -m "feat(backend): register TestSuitesModule in app

Closes #4"
```

---

## Chunk 3: Frontend — API Client, Hook, Tree Utils

### Task 8: Create API client for test suites

**Files:**
- Create: `apps/frontend/lib/api/test-suites.ts`

- [ ] **Step 1: Create API client**

```typescript
import type { TestSuiteDto, CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';
import { apiFetch } from './client';

export const testSuitesApi = {
  listByProject: (projectId: string) =>
    apiFetch<TestSuiteDto[]>(`/projects/${projectId}/suites`),

  create: (projectId: string, data: CreateTestSuiteInput) =>
    apiFetch<TestSuiteDto>(`/projects/${projectId}/suites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, id: string, data: UpdateTestSuiteInput) =>
    apiFetch<TestSuiteDto>(`/projects/${projectId}/suites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (projectId: string, id: string) =>
    apiFetch<{ deleted: number }>(`/projects/${projectId}/suites/${id}`, {
      method: 'DELETE',
    }),
};
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/lib/api/test-suites.ts
git commit -m "feat(frontend): add API client for test suite endpoints

Closes #4"
```

---

### Task 9: Test-drive tree utility (flat → nested)

**Files:**
- Create: `apps/frontend/lib/test-suites/tree-utils.test.ts`
- Create: `apps/frontend/lib/test-suites/tree-utils.ts`

- [ ] **Step 1: Write failing tests for tree builder**

```typescript
import { describe, it, expect } from 'vitest';
import { buildTree, type TreeNode } from './tree-utils';
import type { TestSuiteDto } from '@app/shared';

const makeSuite = (overrides: Partial<TestSuiteDto>): TestSuiteDto => ({
  id: 'id-1',
  projectId: 'proj-1',
  name: 'Suite',
  description: null,
  parentId: null,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('buildTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('returns root nodes with empty children', () => {
    const suites = [makeSuite({ id: 'a', name: 'A' })];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('a');
    expect(tree[0].children).toEqual([]);
  });

  it('nests children under their parent', () => {
    const suites = [
      makeSuite({ id: 'parent', name: 'Parent' }),
      makeSuite({ id: 'child', name: 'Child', parentId: 'parent' }),
    ];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('child');
  });

  it('handles multiple levels of nesting', () => {
    const suites = [
      makeSuite({ id: 'root', name: 'Root' }),
      makeSuite({ id: 'mid', name: 'Mid', parentId: 'root' }),
      makeSuite({ id: 'leaf', name: 'Leaf', parentId: 'mid' }),
    ];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe('leaf');
  });

  it('sorts siblings alphabetically by name', () => {
    const suites = [
      makeSuite({ id: 'b', name: 'Bravo' }),
      makeSuite({ id: 'a', name: 'Alpha' }),
      makeSuite({ id: 'c', name: 'Charlie' }),
    ];
    const tree = buildTree(suites);

    expect(tree.map((n) => n.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('handles multiple root nodes', () => {
    const suites = [
      makeSuite({ id: 'a', name: 'A' }),
      makeSuite({ id: 'b', name: 'B' }),
    ];
    const tree = buildTree(suites);

    expect(tree).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `pnpm --filter frontend test -- --run tree-utils`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tree-utils**

```typescript
import type { TestSuiteDto } from '@app/shared';

export interface TreeNode extends TestSuiteDto {
  children: TreeNode[];
}

export function buildTree(suites: TestSuiteDto[]): TreeNode[] {
  const map = new Map<string, TreeNode>();

  for (const suite of suites) {
    map.set(suite.id, { ...suite, children: [] });
  }

  const roots: TreeNode[] = [];

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByName = (a: TreeNode, b: TreeNode) => a.name.localeCompare(b.name);

  function sortRecursive(nodes: TreeNode[]) {
    nodes.sort(sortByName);
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  }

  sortRecursive(roots);
  return roots;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `pnpm --filter frontend test -- --run tree-utils`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/lib/test-suites/tree-utils.ts apps/frontend/lib/test-suites/tree-utils.test.ts
git commit -m "feat(frontend): add buildTree utility to convert flat suites to nested tree

Pure function with alphabetical sorting. Tested with vitest.

Closes #4"
```

---

### Task 10: Create useTestSuites hook

**Files:**
- Create: `apps/frontend/lib/test-suites/useTestSuites.ts`

- [ ] **Step 1: Implement the hook**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTestSuiteInput, UpdateTestSuiteInput } from '@app/shared';
import { testSuitesApi } from '../api/test-suites';
import { buildTree } from './tree-utils';

export function testSuitesQueryKey(projectId: string) {
  return ['projects', projectId, 'suites'] as const;
}

export function useTestSuites(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = testSuitesQueryKey(projectId);

  const { data: suites, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => testSuitesApi.listByProject(projectId),
    enabled: !!projectId,
  });

  const tree = suites ? buildTree(suites) : [];

  const createSuite = useMutation({
    mutationFn: (data: CreateTestSuiteInput) => testSuitesApi.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSuite = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestSuiteInput }) =>
      testSuitesApi.update(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteSuite = useMutation({
    mutationFn: (id: string) => testSuitesApi.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    suites: suites ?? [],
    tree,
    isLoading,
    error,
    createSuite,
    updateSuite,
    deleteSuite,
  };
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/lib/test-suites/useTestSuites.ts
git commit -m "feat(frontend): add useTestSuites hook with Tanstack Query

Fetches flat list, builds tree client-side. CRUD mutations with cache invalidation.

Closes #4"
```

---

## Chunk 4: Frontend — UI Components

### Task 11: Install required shadcn/ui components

Before building UI, install any missing shadcn/ui components needed for the tree and context menu.

- [ ] **Step 1: Check which shadcn/ui components exist**

Run: `ls apps/frontend/components/ui/`

- [ ] **Step 2: Install missing components**

Install needed components (context-menu, dialog, input, dropdown-menu, scroll-area) if not already present. Use the shadcn CLI:

```bash
cd apps/frontend && pnpm dlx shadcn@latest add context-menu dialog input dropdown-menu scroll-area
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/components/ui/
git commit -m "chore(frontend): add shadcn/ui components for suite tree

context-menu, dialog, input, dropdown-menu, scroll-area

Closes #4"
```

---

### Task 12: Create SuiteFormDialog component

**Files:**
- Create: `apps/frontend/components/test-suites/SuiteFormDialog.tsx`

- [ ] **Step 1: Implement the dialog**

A dialog with a form for creating/renaming suites. Uses React Hook Form + Zod.

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTestSuiteSchema, type CreateTestSuiteInput } from '@app/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SuiteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTestSuiteInput) => void;
  isPending: boolean;
  defaultValues?: { name: string; description?: string };
  title: string;
}

export function SuiteFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultValues,
  title,
}: SuiteFormDialogProps) {
  const values = defaultValues ?? { name: '', description: '' };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTestSuiteInput>({
    resolver: zodResolver(CreateTestSuiteSchema),
    // key prop on Dialog forces remount, but also reset when values change
    values,
  });

  const handleFormSubmit = (data: CreateTestSuiteInput) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Suite name" {...register('name')} />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="Description (optional)" {...register('description')} />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/components/test-suites/SuiteFormDialog.tsx
git commit -m "feat(frontend): add SuiteFormDialog for create/rename suite

React Hook Form + Zod validation from @app/shared.

Closes #4"
```

---

### Task 13: Create SuiteTree component with context menu

**Files:**
- Create: `apps/frontend/components/test-suites/SuiteTree.tsx`
- Create: `apps/frontend/components/test-suites/SuiteTree.test.tsx`

- [ ] **Step 1: Write failing tests for SuiteTree**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiteTree } from './SuiteTree';
import type { TreeNode } from '@/lib/test-suites/tree-utils';

const makeNode = (overrides: Partial<TreeNode>): TreeNode => ({
  id: 'id-1',
  projectId: 'proj-1',
  name: 'Suite',
  description: null,
  parentId: null,
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  children: [],
  ...overrides,
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('SuiteTree', () => {
  const mockOnCreate = vi.fn();
  const mockOnRename = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders suite names', () => {
    const tree = [
      makeNode({ id: 'a', name: 'Alpha' }),
      makeNode({ id: 'b', name: 'Bravo' }),
    ];

    renderWithProviders(
      <SuiteTree
        tree={tree}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
  });

  it('renders nested children', () => {
    const tree = [
      makeNode({
        id: 'parent',
        name: 'Parent',
        children: [makeNode({ id: 'child', name: 'Child', parentId: 'parent' })],
      }),
    ];

    renderWithProviders(
      <SuiteTree
        tree={tree}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('toggles children visibility on click', async () => {
    const user = userEvent.setup();
    const tree = [
      makeNode({
        id: 'parent',
        name: 'Parent',
        children: [makeNode({ id: 'child', name: 'Child', parentId: 'parent' })],
      }),
    ];

    renderWithProviders(
      <SuiteTree
        tree={tree}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    // Children visible by default
    expect(screen.getByText('Child')).toBeInTheDocument();

    // Click toggle to collapse
    const toggle = screen.getByRole('button', { name: /toggle parent/i });
    await user.click(toggle);

    // Child should be removed from DOM (conditional rendering)
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('shows empty state when tree is empty', () => {
    renderWithProviders(
      <SuiteTree
        tree={[]}
        onCreateChild={mockOnCreate}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/no suites/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `pnpm --filter frontend test -- --run SuiteTree`
Expected: FAIL — module not found

- [ ] **Step 3: Implement SuiteTree**

@ `react-best-practices` — follow when writing this component
@ `frontend-design` — invoke for UI decisions

```typescript
'use client';

import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { TreeNode } from '@/lib/test-suites/tree-utils';

interface SuiteTreeProps {
  tree: TreeNode[];
  onCreateChild: (parentId: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

export function SuiteTree({ tree, onCreateChild, onRename, onDelete }: SuiteTreeProps) {
  if (tree.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-muted-foreground">
        No suites yet. Right-click to create one.
      </p>
    );
  }

  return (
    <ul role="tree" className="space-y-0.5">
      {tree.map((node) => (
        <SuiteTreeNode
          key={node.id}
          node={node}
          depth={0}
          onCreateChild={onCreateChild}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

interface SuiteTreeNodeProps {
  node: TreeNode;
  depth: number;
  onCreateChild: (parentId: string) => void;
  onRename: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

function SuiteTreeNode({ node, depth, onCreateChild, onRename, onDelete }: SuiteTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li role="treeitem">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent cursor-pointer"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                aria-label={`Toggle ${node.name}`}
              >
                <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
            ) : (
              <span className="h-5 w-5 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateChild(node.id)}>
            Add child suite
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRename(node)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onDelete(node)}
            className="text-destructive"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {hasChildren && expanded && (
        <ul role="group" className="space-y-0.5">
          {node.children.map((child) => (
            <SuiteTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `pnpm --filter frontend test -- --run SuiteTree`
Expected: ALL PASS (may need to adjust for context-menu mocking — see notes below)

**Note:** If context-menu triggers don't work in JSDOM, mock the context-menu components or simplify the test assertions to focus on rendering and toggle behavior.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/test-suites/SuiteTree.tsx apps/frontend/components/test-suites/SuiteTree.test.tsx
git commit -m "feat(frontend): add SuiteTree component with context menu

Recursive collapsible tree with right-click actions (create child, rename, delete).

Closes #4"
```

---

## Chunk 5: Frontend — Integrate into Project Detail Page

### Task 14: Update project detail page with suite sidebar

**Files:**
- Modify: `apps/frontend/app/(dashboard)/projects/[id]/page.tsx`
- Create: `apps/frontend/app/(dashboard)/projects/[id]/page.test.tsx`

- [ ] **Step 1: Write failing tests for updated page**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'proj-1' }),
}));

vi.mock('@/lib/api/projects', () => ({
  projectsApi: {
    getById: vi.fn(),
  },
}));

vi.mock('@/lib/api/test-suites', () => ({
  testSuitesApi: {
    listByProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { projectsApi } from '@/lib/api/projects';
import { testSuitesApi } from '@/lib/api/test-suites';

const mockGetById = projectsApi.getById as ReturnType<typeof vi.fn>;
const mockListSuites = testSuitesApi.listByProject as ReturnType<typeof vi.fn>;

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ProjectDetailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders project name and suite sidebar', async () => {
    mockGetById.mockResolvedValue({
      id: 'proj-1',
      name: 'My Project',
      description: null,
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('My Project')).toBeInTheDocument();
    });
    expect(screen.getByText(/no suites/i)).toBeInTheDocument();
  });

  it('renders suites in the sidebar', async () => {
    mockGetById.mockResolvedValue({
      id: 'proj-1',
      name: 'My Project',
      description: null,
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    mockListSuites.mockResolvedValue([
      {
        id: 'suite-1',
        projectId: 'proj-1',
        name: 'Login Tests',
        description: null,
        parentId: null,
        deletedAt: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Login Tests')).toBeInTheDocument();
    });
  });

  it('shows create suite button', async () => {
    mockGetById.mockResolvedValue({
      id: 'proj-1',
      name: 'My Project',
      description: null,
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    mockListSuites.mockResolvedValue([]);

    renderWithProviders(<ProjectDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new suite/i })).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `pnpm --filter frontend test -- --run "projects/\\[id\\]/page"`
Expected: FAIL (page doesn't have suite components yet)

- [ ] **Step 3: Update the project detail page**

Replace the existing page with a split-pane layout:

```typescript
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';
import { useTestSuites } from '@/lib/test-suites/useTestSuites';
import { SuiteTree } from '@/components/test-suites/SuiteTree';
import { SuiteFormDialog } from '@/components/test-suites/SuiteFormDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TreeNode } from '@/lib/test-suites/tree-utils';
import type { CreateTestSuiteInput } from '@app/shared';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  const { tree, isLoading: suitesLoading, createSuite, updateSuite, deleteSuite } =
    useTestSuites(id);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    parentId?: string;
    node?: TreeNode;
  }>({ open: false, mode: 'create' });

  const handleCreateRoot = () => {
    setDialogState({ open: true, mode: 'create' });
  };

  const handleCreateChild = (parentId: string) => {
    setDialogState({ open: true, mode: 'create', parentId });
  };

  const handleRename = (node: TreeNode) => {
    setDialogState({
      open: true,
      mode: 'rename',
      node,
    });
  };

  const handleDelete = (node: TreeNode) => {
    if (window.confirm(`Delete "${node.name}" and all its children?`)) {
      deleteSuite.mutate(node.id);
    }
  };

  const handleDialogSubmit = (data: CreateTestSuiteInput) => {
    if (dialogState.mode === 'create') {
      createSuite.mutate(
        { ...data, ...(dialogState.parentId && { parentId: dialogState.parentId }) },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    } else if (dialogState.node) {
      updateSuite.mutate(
        { id: dialogState.node.id, data: { name: data.name, description: data.description } },
        { onSuccess: () => setDialogState({ open: false, mode: 'create' }) },
      );
    }
  };

  if (projectLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (projectError || !project) {
    return <div className="p-6">Project not found.</div>;
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — Suite Tree */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-semibold">Suites</h2>
          <Button size="sm" variant="ghost" onClick={handleCreateRoot}>
            + New Suite
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {suitesLoading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <SuiteTree
              tree={tree}
              onCreateChild={handleCreateChild}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )}
        </ScrollArea>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-muted-foreground">{project.description}</p>
        )}
        <div className="mt-8 text-muted-foreground">
          Select a suite from the sidebar to view its test cases.
        </div>
      </main>

      {/* Create / Rename dialog */}
      <SuiteFormDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) setDialogState({ open: false, mode: 'create' });
        }}
        onSubmit={handleDialogSubmit}
        isPending={createSuite.isPending || updateSuite.isPending}
        title={dialogState.mode === 'create' ? 'Create Suite' : 'Rename Suite'}
        defaultValues={
          dialogState.mode === 'rename' && dialogState.node
            ? { name: dialogState.node.name, description: dialogState.node.description ?? '' }
            : undefined
        }
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `pnpm --filter frontend test -- --run "projects/\\[id\\]/page"`
Expected: ALL PASS

- [ ] **Step 5: Run full test suite + typecheck + lint**

Run:
```bash
pnpm test && pnpm typecheck && pnpm lint
```
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/app/\(dashboard\)/projects/\[id\]/page.tsx apps/frontend/app/\(dashboard\)/projects/\[id\]/page.test.tsx
git commit -m "feat(frontend): add suite tree sidebar to project detail page

Split-pane layout with collapsible tree sidebar (left) + content area (right).
Create/rename via dialog, delete via context menu with confirmation.

Closes #4"
```

---

## Chunk 6: Final Verification

### Task 15: Full verification pass

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: Zero errors

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: Zero errors

- [ ] **Step 4: Manual sanity check of the acceptance criteria**

Verify each item from issue #4:
- [x] Prisma: `TestSuite` model with `name`, `description`, `parentId`, `projectId`, `deletedAt`
- [x] `POST /projects/:projectId/suites` — create suite
- [x] `GET /projects/:projectId/suites` — return flat list (client builds tree)
- [x] `PATCH /projects/:projectId/suites/:id` — rename / move
- [x] `DELETE /projects/:projectId/suites/:id` — soft delete + cascade
- [x] Frontend: collapsible sidebar tree
- [x] Frontend: create/rename/delete via context menu
- [x] All endpoints covered by unit tests
- [x] `pnpm test`, `pnpm typecheck`, `pnpm lint` all pass
