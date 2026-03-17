# Playwright Automation Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Qamelot test cases to be linked to Playwright automated tests, with a custom reporter that creates test runs and submits results automatically via a dedicated API.

**Architecture:** New `ApiKey` model for machine auth. New `automation` NestJS module exposes endpoints that accept API key auth (not JWT). A local monorepo package `packages/playwright-reporter` implements the Playwright `Reporter` interface and calls these endpoints. Existing TestCase/TestRun/TestResult models gain automation-specific fields.

**Tech Stack:** NestJS, Prisma, Playwright Reporter API, pnpm workspaces, TypeScript

**Issue:** Closes #35

---

## File Map

### Schema & Migrations
- Modify: `apps/backend/prisma/schema.prisma` — Add enums (`AutomationStatus`, `ExecutionType`), fields on `TestCase`/`TestRun`/`TestResult`, new `ApiKey` model

### Shared Package
- Modify: `packages/shared/src/types/index.ts` — Add new enums, DTOs
- Create: `packages/shared/src/schemas/automation.ts` — Zod schemas for automation input
- Create: `packages/shared/src/schemas/api-key.ts` — Zod schemas for API key management
- Modify: `packages/shared/src/index.ts` — Export new schemas

### Backend — API Key Auth
- Create: `apps/backend/src/auth/guards/api-key-auth.guard.ts` — Custom guard extracting `X-API-Key` header
- Create: `apps/backend/src/auth/decorators/api-key-auth.decorator.ts` — `@ApiKeyAuth()` decorator

### Backend — API Keys Module
- Create: `apps/backend/src/api-keys/api-keys.module.ts`
- Create: `apps/backend/src/api-keys/api-keys.controller.ts`
- Create: `apps/backend/src/api-keys/api-keys.service.ts`
- Create: `apps/backend/src/api-keys/api-keys.service.spec.ts`
- Create: `apps/backend/src/api-keys/api-keys.controller.spec.ts`
- Create: `apps/backend/src/api-keys/dto/create-api-key.dto.ts`

### Backend — Automation Module
- Create: `apps/backend/src/automation/automation.module.ts`
- Create: `apps/backend/src/automation/automation.controller.ts`
- Create: `apps/backend/src/automation/automation.service.ts`
- Create: `apps/backend/src/automation/automation.service.spec.ts`
- Create: `apps/backend/src/automation/automation.controller.spec.ts`
- Create: `apps/backend/src/automation/dto/create-automation-run.dto.ts`
- Create: `apps/backend/src/automation/dto/submit-automation-result.dto.ts`

### Backend — Registration
- Modify: `apps/backend/src/app.module.ts` — Register `ApiKeysModule` + `AutomationModule`

### Playwright Reporter Package
- Create: `packages/playwright-reporter/package.json`
- Create: `packages/playwright-reporter/tsconfig.json`
- Create: `packages/playwright-reporter/src/index.ts` — Main export
- Create: `packages/playwright-reporter/src/reporter.ts` — Reporter class
- Create: `packages/playwright-reporter/src/client.ts` — HTTP client for Qamelot API
- Create: `packages/playwright-reporter/src/types.ts` — Config & internal types

### Frontend — API & Hooks
- Create: `apps/frontend/lib/api/api-keys.ts` — API key CRUD client
- Create: `apps/frontend/lib/api/automation.ts` — Automation API client
- Create: `apps/frontend/lib/api-keys/useApiKeys.ts` — React Query hooks
- Modify: `apps/frontend/lib/api/test-cases.ts` — Add automation filter params
- Modify: `apps/frontend/lib/test-cases/useTestCases.ts` — Add automation filter

### Frontend — UI Updates
- Modify: `apps/frontend/components/test-cases/CaseEditor.tsx` — Add automation section
- Modify: `apps/frontend/components/test-cases/CaseListPanel.tsx` — Add automation badge & filter
- Create: `apps/frontend/app/(dashboard)/settings/api-keys/page.tsx` — API key management page

---

## Chunk 1: Data Model & Shared Types

### Task 1: Prisma Schema — New Enums and Fields

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Add new enums to schema**

Add after the `TemplateType` enum (line 76):

```prisma
enum AutomationStatus {
  NOT_AUTOMATED
  AUTOMATED
  NEEDS_UPDATE
}

enum ExecutionType {
  MANUAL
  AUTOMATED
}
```

- [ ] **Step 2: Add automation fields to TestCase**

Add to the `TestCase` model after the `references` field (line 137):

```prisma
  automationId       String?           // unique test identifier: "file.spec.ts > describe > test"
  automationFilePath String?           // path to spec file
  automationStatus   AutomationStatus  @default(NOT_AUTOMATED)
```

Add index after existing indexes:
```prisma
  @@index([automationStatus])
```

- [ ] **Step 3: Add automation fields to TestRun**

Add to the `TestRun` model after `sourceRunId` (line 212):

```prisma
  executionType ExecutionType @default(MANUAL)
  ciJobUrl      String?
```

- [ ] **Step 4: Add automation fields to TestResult**

Add to the `TestResult` model after `elapsed` (line 253):

```prisma
  automationLog String?  // stdout/stderr from automated test
```

- [ ] **Step 5: Add ApiKey model**

Add at the end of the schema:

```prisma
model ApiKey {
  id          String    @id @default(cuid())
  name        String    // human-readable label, e.g. "CI Pipeline Key"
  keyHash     String    @unique // SHA-256 hash of the actual key
  keyPrefix   String    // first 8 chars for display: "qam_abc1..."
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([keyHash])
  @@index([projectId])
}
```

Also add relation fields to `Project` and `User`:
- In `Project` model: `apiKeys ApiKey[]`
- In `User` model: `apiKeys ApiKey[]`

- [ ] **Step 6: Run migration**

```bash
cd apps/backend && npx prisma migrate dev --name add-automation-fields-and-api-keys
```

Expected: Migration created and applied. Prisma client regenerated.

- [ ] **Step 7: Verify migration**

```bash
cd apps/backend && npx prisma migrate status
```

Expected: All migrations applied, no drift.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(db): add automation fields and ApiKey model

Adds AutomationStatus and ExecutionType enums.
Adds automationId, automationFilePath, automationStatus to TestCase.
Adds executionType, ciJobUrl to TestRun.
Adds automationLog to TestResult.
Adds ApiKey model for machine-to-machine auth.

Closes #35"
```

---

### Task 2: Shared Types — New Enums and DTOs

**Files:**
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Add new enums**

Add after the existing enum definitions:

```typescript
export enum AutomationStatus {
  NOT_AUTOMATED = 'NOT_AUTOMATED',
  AUTOMATED = 'AUTOMATED',
  NEEDS_UPDATE = 'NEEDS_UPDATE',
}

export enum ExecutionType {
  MANUAL = 'MANUAL',
  AUTOMATED = 'AUTOMATED',
}
```

- [ ] **Step 2: Update TestCaseDto**

Add to the `TestCaseDto` interface:

```typescript
  automationId: string | null;
  automationFilePath: string | null;
  automationStatus: AutomationStatus;
```

- [ ] **Step 3: Update TestRunDto**

Add to the `TestRunDto` interface:

```typescript
  executionType: ExecutionType;
  ciJobUrl: string | null;
```

- [ ] **Step 4: Update TestResultDto**

Add to the `TestResultDto` interface:

```typescript
  automationLog: string | null;
```

- [ ] **Step 5: Add ApiKeyDto**

```typescript
export interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string;
  createdById: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreatedDto extends ApiKeyDto {
  rawKey: string; // Only returned once at creation time
}
```

- [ ] **Step 6: Add AutomationRunDto and AutomationResultDto**

```typescript
export interface AutomationCaseMapDto {
  testCaseId: string;
  automationId: string;
  title: string;
  suiteId: string;
}

export interface AutomationSyncResultDto {
  matched: number;
  created: number;
  stale: number;
  unmatched: string[]; // automationIds not found in Qamelot
}
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add automation and API key types

Adds AutomationStatus, ExecutionType enums.
Updates TestCaseDto, TestRunDto, TestResultDto with automation fields.
Adds ApiKeyDto, AutomationCaseMapDto, AutomationSyncResultDto.

Closes #35"
```

---

### Task 3: Shared Schemas — Automation Zod Schemas

**Files:**
- Create: `packages/shared/src/schemas/automation.ts`
- Create: `packages/shared/src/schemas/api-key.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create automation schemas**

File: `packages/shared/src/schemas/automation.ts`

```typescript
import { z } from 'zod';

export const CreateAutomationRunSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  name: z.string().min(1).max(200, 'Run name must be under 200 characters'),
  automationIds: z
    .array(z.string().min(1))
    .min(1, 'At least one automation ID required')
    .max(5000, 'Cannot exceed 5000 tests per run'),
  ciJobUrl: z.string().url().max(2000).optional(),
});

export type CreateAutomationRunInput = z.infer<typeof CreateAutomationRunSchema>;

export const SubmitAutomationResultSchema = z.object({
  automationId: z.string().min(1, 'Automation ID is required'),
  status: z.enum(['PASSED', 'FAILED', 'BLOCKED']),
  duration: z.number().int().min(0).optional(), // milliseconds
  error: z.string().max(10000).optional(),
  log: z.string().max(50000).optional(),
  retryCount: z.number().int().min(0).default(0),
});

export type SubmitAutomationResultInput = z.infer<typeof SubmitAutomationResultSchema>;

export const BulkSubmitAutomationResultsSchema = z.object({
  results: z
    .array(SubmitAutomationResultSchema)
    .min(1)
    .max(1000, 'Cannot submit more than 1000 results at once'),
});

export type BulkSubmitAutomationResultsInput = z.infer<typeof BulkSubmitAutomationResultsSchema>;

export const SyncAutomationTestsSchema = z.object({
  projectId: z.string().min(1),
  tests: z
    .array(
      z.object({
        automationId: z.string().min(1).max(500),
        title: z.string().min(1).max(300),
        filePath: z.string().min(1).max(500),
      }),
    )
    .min(1)
    .max(10000),
});

export type SyncAutomationTestsInput = z.infer<typeof SyncAutomationTestsSchema>;
```

- [ ] **Step 2: Create API key schemas**

File: `packages/shared/src/schemas/api-key.ts`

```typescript
import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  projectId: z.string().min(1, 'Project ID is required'),
  expiresAt: z.string().datetime().optional(), // ISO 8601
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
```

- [ ] **Step 3: Export from index**

Add to `packages/shared/src/index.ts`:

```typescript
export * from './schemas/automation';
export * from './schemas/api-key';
```

- [ ] **Step 4: Build shared package and verify**

```bash
cd packages/shared && pnpm build
```

Expected: Compiles without errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add automation and API key Zod schemas

Adds CreateAutomationRunSchema, SubmitAutomationResultSchema,
BulkSubmitAutomationResultsSchema, SyncAutomationTestsSchema,
and CreateApiKeySchema with full validation.

Closes #35"
```

---

## Chunk 2: API Key Authentication

### Task 4: API Key Guard

**Files:**
- Create: `apps/backend/src/auth/guards/api-key-auth.guard.ts`
- Create: `apps/backend/src/auth/decorators/api-key-auth.decorator.ts`

- [ ] **Step 1: Write test for API key guard**

File: `apps/backend/src/auth/guards/api-key-auth.guard.spec.ts`

```typescript
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  const mockPrisma = {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ApiKeyAuthGuard(mockPrisma as unknown as PrismaService);
  });

  const mockContext = (apiKey?: string): ExecutionContext => {
    const req = {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    };
    return {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('throws UnauthorizedException when no X-API-Key header', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when key not found', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(mockContext('qam_bad_key'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when key is revoked', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      revokedAt: new Date(),
      expiresAt: null,
      projectId: 'proj-1',
    });
    await expect(guard.canActivate(mockContext('qam_valid'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when key is expired', async () => {
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      revokedAt: null,
      expiresAt: new Date('2020-01-01'),
      projectId: 'proj-1',
    });
    await expect(guard.canActivate(mockContext('qam_valid'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows valid non-expired, non-revoked key and sets req.apiKey', async () => {
    const rawKey = 'qam_test_key_abc123';
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    mockPrisma.apiKey.findUnique.mockResolvedValue({
      id: 'key-1',
      revokedAt: null,
      expiresAt: null,
      projectId: 'proj-1',
    });
    mockPrisma.apiKey.update.mockResolvedValue({});

    const ctx = mockContext(rawKey);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { keyHash },
    });
    const req = ctx.switchToHttp().getRequest();
    expect((req as Record<string, unknown>).apiKey).toEqual({
      id: 'key-1',
      projectId: 'proj-1',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest src/auth/guards/api-key-auth.guard.spec.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement API key guard**

File: `apps/backend/src/auth/guards/api-key-auth.guard.ts`

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    const headers = req.headers as Record<string, string | undefined>;
    const rawKey = headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.revokedAt) {
      throw new UnauthorizedException('API key has been revoked');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last-used timestamp (fire-and-forget)
    this.prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch((err: Error) =>
        this.logger.warn(`Failed to update lastUsedAt: ${err.message}`),
      );

    // Attach key info to request for downstream use
    req.apiKey = { id: apiKey.id, projectId: apiKey.projectId };
    return true;
  }
}
```

- [ ] **Step 4: Create ApiKeyAuth decorator**

File: `apps/backend/src/auth/decorators/api-key-auth.decorator.ts`

```typescript
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../guards/api-key-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Marks an endpoint as using API key auth instead of JWT.
 * Bypasses JWT guard (via @Public) and applies ApiKeyAuthGuard.
 */
export const ApiKeyAuth = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true), // bypass JWT guard
    UseGuards(ApiKeyAuthGuard),
  );
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd apps/backend && npx jest src/auth/guards/api-key-auth.guard.spec.ts --no-coverage
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/auth/
git commit -m "feat(auth): add API key authentication guard

Implements ApiKeyAuthGuard that validates X-API-Key header against
hashed keys in the database. Supports expiry and revocation checks.
Adds @ApiKeyAuth() decorator that bypasses JWT and uses key auth.

Closes #35"
```

---

### Task 5: API Keys Module — Service

**Files:**
- Create: `apps/backend/src/api-keys/api-keys.service.ts`
- Create: `apps/backend/src/api-keys/api-keys.service.spec.ts`

- [ ] **Step 1: Write service tests**

File: `apps/backend/src/api-keys/api-keys.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  const mockPrisma = {
    apiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    project: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  describe('create', () => {
    it('creates an API key and returns rawKey only once', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      mockPrisma.apiKey.create.mockResolvedValue({
        id: 'key-1',
        name: 'CI Key',
        keyPrefix: 'qam_abcd',
        keyHash: 'hashed',
        projectId: 'proj-1',
        createdById: 'user-1',
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await service.create(
        { name: 'CI Key', projectId: 'proj-1' },
        'user-1',
      );

      expect(result.rawKey).toBeDefined();
      expect(result.rawKey).toMatch(/^qam_/);
      expect(result.name).toBe('CI Key');
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Key', projectId: 'bad' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByProject', () => {
    it('returns all non-revoked keys for a project', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([
        { id: 'key-1', name: 'CI', keyPrefix: 'qam_abcd' },
      ]);

      const result = await service.listByProject('proj-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', revokedAt: null },
        }),
      );
    });
  });

  describe('revoke', () => {
    it('revokes an existing key', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({
        id: 'key-1',
        projectId: 'proj-1',
        revokedAt: null,
      });
      mockPrisma.apiKey.update.mockResolvedValue({
        id: 'key-1',
        revokedAt: new Date(),
      });

      const result = await service.revoke('key-1', 'proj-1');
      expect(result.revokedAt).toBeDefined();
    });

    it('throws NotFoundException when key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null);
      await expect(service.revoke('bad', 'proj-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest src/api-keys/api-keys.service.spec.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement service**

File: `apps/backend/src/api-keys/api-keys.service.ts`

```typescript
import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateApiKeyInput, ApiKeyCreatedDto, ApiKeyDto } from '@app/shared';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Pick<CreateApiKeyInput, 'name' | 'projectId'> & { expiresAt?: string },
    userId: string,
  ): Promise<ApiKeyCreatedDto> {
    await this.verifyProject(data.projectId);

    const rawKey = `qam_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        keyPrefix,
        projectId: data.projectId,
        createdById: userId,
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
      },
    });

    this.logger.log(`API key "${data.name}" created for project ${data.projectId}`);

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      projectId: apiKey.projectId,
      createdById: apiKey.createdById,
      lastUsedAt: null,
      expiresAt: apiKey.expiresAt?.toISOString() ?? null,
      revokedAt: null,
      createdAt: apiKey.createdAt.toISOString(),
      rawKey,
    };
  }

  async listByProject(projectId: string): Promise<ApiKeyDto[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { projectId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      projectId: k.projectId,
      createdById: k.createdById,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      revokedAt: k.revokedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async revoke(keyId: string, projectId: string): Promise<ApiKeyDto> {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, projectId, revokedAt: null },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`API key "${key.name}" revoked`);

    return {
      id: updated.id,
      name: updated.name,
      keyPrefix: updated.keyPrefix,
      projectId: updated.projectId,
      createdById: updated.createdById,
      lastUsedAt: updated.lastUsedAt?.toISOString() ?? null,
      expiresAt: updated.expiresAt?.toISOString() ?? null,
      revokedAt: updated.revokedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  private async verifyProject(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/backend && npx jest src/api-keys/api-keys.service.spec.ts --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/api-keys/
git commit -m "feat(backend): add API keys service with create, list, revoke

Generates secure qam_ prefixed keys with SHA-256 hashing.
Raw key returned only once at creation. Supports expiry and revocation.

Closes #35"
```

---

### Task 6: API Keys Module — Controller & Module Registration

**Files:**
- Create: `apps/backend/src/api-keys/dto/create-api-key.dto.ts`
- Create: `apps/backend/src/api-keys/api-keys.controller.ts`
- Create: `apps/backend/src/api-keys/api-keys.controller.spec.ts`
- Create: `apps/backend/src/api-keys/api-keys.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create DTO**

File: `apps/backend/src/api-keys/dto/create-api-key.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'CI Pipeline Key', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
```

- [ ] **Step 2: Write controller tests**

File: `apps/backend/src/api-keys/api-keys.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  const mockService = {
    create: jest.fn(),
    listByProject: jest.fn(),
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [{ provide: ApiKeysService, useValue: mockService }],
    }).compile();
    controller = module.get<ApiKeysController>(ApiKeysController);
  });

  it('create delegates to service with user id', async () => {
    mockService.create.mockResolvedValue({ id: 'key-1', rawKey: 'qam_abc' });
    const req = { user: { id: 'user-1' } };
    const result = await controller.create(
      { name: 'CI Key', projectId: 'proj-1' },
      req as any,
    );
    expect(mockService.create).toHaveBeenCalledWith(
      { name: 'CI Key', projectId: 'proj-1' },
      'user-1',
    );
    expect(result.rawKey).toBe('qam_abc');
  });

  it('list delegates to service', async () => {
    mockService.listByProject.mockResolvedValue([]);
    const result = await controller.list('proj-1');
    expect(mockService.listByProject).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual([]);
  });

  it('revoke delegates to service', async () => {
    mockService.revoke.mockResolvedValue({ id: 'key-1', revokedAt: 'now' });
    const result = await controller.revoke('proj-1', 'key-1');
    expect(mockService.revoke).toHaveBeenCalledWith('key-1', 'proj-1');
    expect(result.revokedAt).toBe('now');
  });
});
```

- [ ] **Step 3: Implement controller**

File: `apps/backend/src/api-keys/api-keys.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Role } from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@Controller('projects/:projectId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Create an API key for a project' })
  @ApiResponse({ status: 201, description: 'API key created — raw key in response (shown only once)' })
  create(
    @Body() dto: CreateApiKeyDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.apiKeysService.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'List active API keys for a project' })
  @ApiResponse({ status: 200, description: 'List of API keys (no raw keys)' })
  list(@Param('projectId') projectId: string) {
    return this.apiKeysService.listByProject(projectId);
  }

  @Delete(':keyId')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  revoke(
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.apiKeysService.revoke(keyId, projectId);
  }
}
```

- [ ] **Step 4: Create module**

File: `apps/backend/src/api-keys/api-keys.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
```

- [ ] **Step 5: Register in AppModule**

Add `ApiKeysModule` to imports in `apps/backend/src/app.module.ts`:

```typescript
import { ApiKeysModule } from './api-keys/api-keys.module';

// In @Module imports array:
ApiKeysModule,
```

- [ ] **Step 6: Run all API key tests**

```bash
cd apps/backend && npx jest src/api-keys/ src/auth/guards/api-key-auth.guard.spec.ts --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/api-keys/ apps/backend/src/app.module.ts
git commit -m "feat(backend): add API keys controller and module

Endpoints: POST /projects/:id/api-keys, GET /projects/:id/api-keys,
DELETE /projects/:id/api-keys/:keyId. Admin/Lead role required.

Closes #35"
```

---

## Chunk 3: Automation Backend API

### Task 7: Automation Service

**Files:**
- Create: `apps/backend/src/automation/automation.service.ts`
- Create: `apps/backend/src/automation/automation.service.spec.ts`

- [ ] **Step 1: Write service tests**

File: `apps/backend/src/automation/automation.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AutomationService', () => {
  let service: AutomationService;
  const mockPrisma = {
    testPlan: { findFirst: jest.fn() },
    testCase: { findMany: jest.fn(), updateMany: jest.fn() },
    testRun: { create: jest.fn() },
    testRunCase: { findFirst: jest.fn() },
    testResult: { create: jest.fn() },
  };

  const mockRunEventsService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'RunEventsService', useValue: mockRunEventsService },
      ],
    }).compile();
    service = module.get<AutomationService>(AutomationService);
  });

  describe('createRun', () => {
    it('creates an automated test run with matched cases', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue({
        id: 'plan-1',
        projectId: 'proj-1',
      });
      mockPrisma.testCase.findMany.mockResolvedValue([
        { id: 'case-1', automationId: 'tests/login.spec.ts > should login' },
        { id: 'case-2', automationId: 'tests/signup.spec.ts > should signup' },
      ]);
      mockPrisma.testRun.create.mockResolvedValue({
        id: 'run-1',
        name: 'CI Run',
        executionType: 'AUTOMATED',
        status: 'PENDING',
        testRunCases: [
          { id: 'trc-1', testCaseId: 'case-1' },
          { id: 'trc-2', testCaseId: 'case-2' },
        ],
      });

      const result = await service.createRun(
        {
          projectId: 'proj-1',
          planId: 'plan-1',
          name: 'CI Run',
          automationIds: [
            'tests/login.spec.ts > should login',
            'tests/signup.spec.ts > should signup',
          ],
        },
        'proj-1',
      );

      expect(result.id).toBe('run-1');
      expect(result.executionType).toBe('AUTOMATED');
      expect(mockPrisma.testRun.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue(null);
      await expect(
        service.createRun(
          {
            projectId: 'proj-1',
            planId: 'bad',
            name: 'Run',
            automationIds: ['x'],
          },
          'proj-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when no cases match automationIds', async () => {
      mockPrisma.testPlan.findFirst.mockResolvedValue({
        id: 'plan-1',
        projectId: 'proj-1',
      });
      mockPrisma.testCase.findMany.mockResolvedValue([]);
      await expect(
        service.createRun(
          {
            projectId: 'proj-1',
            planId: 'plan-1',
            name: 'Run',
            automationIds: ['no-match'],
          },
          'proj-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listAutomatedCases', () => {
    it('returns cases with automation IDs', async () => {
      mockPrisma.testCase.findMany.mockResolvedValue([
        {
          id: 'case-1',
          automationId: 'test.spec.ts > should work',
          title: 'Login test',
          suiteId: 'suite-1',
        },
      ]);

      const result = await service.listAutomatedCases('proj-1');
      expect(result).toHaveLength(1);
      expect(result[0].automationId).toBe('test.spec.ts > should work');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx jest src/automation/automation.service.spec.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement service**

File: `apps/backend/src/automation/automation.service.ts`

```typescript
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunEventsService } from '../run-events/run-events.service';
import type {
  CreateAutomationRunInput,
  SubmitAutomationResultInput,
  AutomationCaseMapDto,
} from '@app/shared';
import { TestResultStatus, TestRunStatus } from '@app/shared';

const RESULT_STATUS_MAP: Record<string, TestResultStatus> = {
  PASSED: TestResultStatus.PASSED,
  FAILED: TestResultStatus.FAILED,
  BLOCKED: TestResultStatus.BLOCKED,
};

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RunEventsService')
    private readonly runEvents: RunEventsService,
  ) {}

  async createRun(data: CreateAutomationRunInput, apiKeyProjectId: string) {
    // Verify plan exists and belongs to the API key's project
    const plan = await this.prisma.testPlan.findFirst({
      where: {
        id: data.planId,
        projectId: apiKeyProjectId,
        deletedAt: null,
      },
    });
    if (!plan) throw new NotFoundException('Test plan not found');

    // Find cases matching the provided automation IDs
    const cases = await this.prisma.testCase.findMany({
      where: {
        projectId: apiKeyProjectId,
        automationId: { in: data.automationIds },
        deletedAt: null,
      },
      select: { id: true, automationId: true },
    });

    if (cases.length === 0) {
      throw new BadRequestException(
        'No test cases found matching the provided automation IDs',
      );
    }

    this.logger.log(
      `Creating automated run: ${cases.length}/${data.automationIds.length} cases matched`,
    );

    const run = await this.prisma.testRun.create({
      data: {
        name: data.name,
        testPlanId: data.planId,
        projectId: apiKeyProjectId,
        executionType: 'AUTOMATED',
        ciJobUrl: data.ciJobUrl,
        testRunCases: {
          create: cases.map((c) => ({ testCaseId: c.id })),
        },
      },
      include: {
        testRunCases: {
          include: {
            testCase: {
              select: { id: true, title: true, automationId: true },
            },
          },
        },
      },
    });

    return {
      ...run,
      unmatchedIds: data.automationIds.filter(
        (aid) => !cases.some((c) => c.automationId === aid),
      ),
    };
  }

  async submitResult(
    runId: string,
    data: SubmitAutomationResultInput,
    apiKeyProjectId: string,
  ) {
    // Find the test run case by automation ID
    const testRunCase = await this.prisma.testRunCase.findFirst({
      where: {
        testRunId: runId,
        testCase: {
          automationId: data.automationId,
          projectId: apiKeyProjectId,
        },
      },
      include: { testRun: { select: { status: true } } },
    });

    if (!testRunCase) {
      this.logger.warn(
        `No matching case for automationId "${data.automationId}" in run ${runId}`,
      );
      return null; // Skip unmatched — don't fail the reporter
    }

    // Auto-transition run to IN_PROGRESS on first result
    if (testRunCase.testRun.status === 'PENDING') {
      await this.prisma.testRun.update({
        where: { id: runId },
        data: { status: TestRunStatus.IN_PROGRESS },
      });
    }

    const status = RESULT_STATUS_MAP[data.status] ?? TestResultStatus.FAILED;

    const result = await this.prisma.testResult.create({
      data: {
        testRunCaseId: testRunCase.id,
        testRunId: runId,
        executedById: 'system', // Will need a system user or nullable
        status,
        elapsed: data.duration ? Math.round(data.duration / 1000) : null,
        comment: data.error ?? null,
        automationLog: data.log ?? null,
      },
    });

    return result;
  }

  async completeRun(runId: string, apiKeyProjectId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: {
        id: runId,
        projectId: apiKeyProjectId,
        deletedAt: null,
      },
    });

    if (!run) throw new NotFoundException('Test run not found');

    const updated = await this.prisma.testRun.update({
      where: { id: runId },
      data: { status: TestRunStatus.COMPLETED },
    });

    this.logger.log(`Automated run ${runId} completed`);
    return updated;
  }

  async listAutomatedCases(projectId: string): Promise<AutomationCaseMapDto[]> {
    const cases = await this.prisma.testCase.findMany({
      where: {
        projectId,
        automationId: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        automationId: true,
        title: true,
        suiteId: true,
      },
    });

    return cases.map((c) => ({
      testCaseId: c.id,
      automationId: c.automationId!,
      title: c.title,
      suiteId: c.suiteId,
    }));
  }

  async syncTests(
    projectId: string,
    tests: Array<{ automationId: string; title: string; filePath: string }>,
  ) {
    const existing = await this.prisma.testCase.findMany({
      where: { projectId, automationId: { not: null }, deletedAt: null },
      select: { id: true, automationId: true },
    });

    const existingMap = new Map(existing.map((c) => [c.automationId, c.id]));
    const incomingIds = new Set(tests.map((t) => t.automationId));

    // Update file paths for matched cases
    const matched = tests.filter((t) => existingMap.has(t.automationId));
    for (const t of matched) {
      await this.prisma.testCase.updateMany({
        where: { automationId: t.automationId, projectId },
        data: {
          automationFilePath: t.filePath,
          automationStatus: 'AUTOMATED',
        },
      });
    }

    // Mark stale (in DB but not in incoming)
    const staleIds = existing
      .filter((e) => e.automationId && !incomingIds.has(e.automationId))
      .map((e) => e.id);

    if (staleIds.length > 0) {
      await this.prisma.testCase.updateMany({
        where: { id: { in: staleIds } },
        data: { automationStatus: 'NEEDS_UPDATE' },
      });
    }

    // Unmatched (in incoming but not in DB)
    const unmatched = tests
      .filter((t) => !existingMap.has(t.automationId))
      .map((t) => t.automationId);

    return {
      matched: matched.length,
      created: 0, // We don't auto-create cases — just report unmatched
      stale: staleIds.length,
      unmatched,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/backend && npx jest src/automation/automation.service.spec.ts --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/automation/
git commit -m "feat(backend): add automation service

Creates automated test runs by matching automationIds to cases.
Submits results, completes runs, lists automated cases, and syncs
test discovery data.

Closes #35"
```

---

### Task 8: Automation Controller & Module

**Files:**
- Create: `apps/backend/src/automation/dto/create-automation-run.dto.ts`
- Create: `apps/backend/src/automation/dto/submit-automation-result.dto.ts`
- Create: `apps/backend/src/automation/automation.controller.ts`
- Create: `apps/backend/src/automation/automation.controller.spec.ts`
- Create: `apps/backend/src/automation/automation.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create DTOs**

File: `apps/backend/src/automation/dto/create-automation-run.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateAutomationRunDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiProperty({ example: 'clxyz456' })
  @IsString()
  @MinLength(1)
  planId!: string;

  @ApiProperty({ example: 'CI Run #42' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: ['tests/login.spec.ts > should login'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @IsString({ each: true })
  automationIds!: string[];

  @ApiPropertyOptional({ example: 'https://ci.example.com/jobs/42' })
  @IsUrl()
  @IsOptional()
  ciJobUrl?: string;
}
```

File: `apps/backend/src/automation/dto/submit-automation-result.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAutomationResultDto {
  @ApiProperty({ example: 'tests/login.spec.ts > should login' })
  @IsString()
  @MinLength(1)
  automationId!: string;

  @ApiProperty({ enum: ['PASSED', 'FAILED', 'BLOCKED'] })
  @IsEnum(['PASSED', 'FAILED', 'BLOCKED'] as const)
  status!: 'PASSED' | 'FAILED' | 'BLOCKED';

  @ApiPropertyOptional({ example: 1500, description: 'Duration in ms' })
  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: 'Expected 200 but got 404' })
  @IsString()
  @MaxLength(10000)
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({ description: 'stdout/stderr log' })
  @IsString()
  @MaxLength(50000)
  @IsOptional()
  log?: string;
}

export class BulkSubmitAutomationResultsDto {
  @ApiProperty({ type: [SubmitAutomationResultDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => SubmitAutomationResultDto)
  results!: SubmitAutomationResultDto[];
}

export class SyncAutomationTestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  automationId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  filePath!: string;
}

export class SyncAutomationTestsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiProperty({ type: [SyncAutomationTestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10000)
  @ValidateNested({ each: true })
  @Type(() => SyncAutomationTestDto)
  tests!: SyncAutomationTestDto[];
}
```

- [ ] **Step 2: Write controller tests**

File: `apps/backend/src/automation/automation.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

describe('AutomationController', () => {
  let controller: AutomationController;
  const mockService = {
    createRun: jest.fn(),
    submitResult: jest.fn(),
    completeRun: jest.fn(),
    listAutomatedCases: jest.fn(),
    syncTests: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomationController],
      providers: [{ provide: AutomationService, useValue: mockService }],
    }).compile();
    controller = module.get<AutomationController>(AutomationController);
  });

  const mockReq = { apiKey: { id: 'key-1', projectId: 'proj-1' } };

  it('createRun delegates to service with apiKey projectId', async () => {
    mockService.createRun.mockResolvedValue({ id: 'run-1' });
    const dto = {
      projectId: 'proj-1',
      planId: 'plan-1',
      name: 'CI Run',
      automationIds: ['test-1'],
    };
    const result = await controller.createRun(dto, mockReq as any);
    expect(mockService.createRun).toHaveBeenCalledWith(dto, 'proj-1');
    expect(result.id).toBe('run-1');
  });

  it('submitResults delegates each result to service', async () => {
    mockService.submitResult.mockResolvedValue({ id: 'result-1' });
    const dto = {
      results: [
        { automationId: 'test-1', status: 'PASSED' as const },
      ],
    };
    const result = await controller.submitResults('run-1', dto, mockReq as any);
    expect(mockService.submitResult).toHaveBeenCalledWith(
      'run-1',
      dto.results[0],
      'proj-1',
    );
    expect(result.submitted).toBe(1);
  });

  it('completeRun delegates to service', async () => {
    mockService.completeRun.mockResolvedValue({ id: 'run-1', status: 'COMPLETED' });
    const result = await controller.completeRun('run-1', mockReq as any);
    expect(mockService.completeRun).toHaveBeenCalledWith('run-1', 'proj-1');
    expect(result.status).toBe('COMPLETED');
  });

  it('listCases delegates to service', async () => {
    mockService.listAutomatedCases.mockResolvedValue([]);
    const result = await controller.listCases('proj-1', mockReq as any);
    expect(mockService.listAutomatedCases).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Implement controller**

File: `apps/backend/src/automation/automation.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ApiKeyAuth } from '../auth/decorators/api-key-auth.decorator';
import { AutomationService } from './automation.service';
import { CreateAutomationRunDto } from './dto/create-automation-run.dto';
import {
  BulkSubmitAutomationResultsDto,
  SyncAutomationTestsDto,
} from './dto/submit-automation-result.dto';

@ApiTags('automation')
@Controller('automation')
@ApiHeader({ name: 'X-API-Key', required: true, description: 'Project API key' })
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('runs')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Create an automated test run' })
  @ApiResponse({ status: 201, description: 'Automated run created' })
  createRun(
    @Body() dto: CreateAutomationRunDto,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    return this.automationService.createRun(dto, req.apiKey.projectId);
  }

  @Post('runs/:runId/results')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Submit automation results in bulk' })
  @ApiResponse({ status: 201, description: 'Results submitted' })
  async submitResults(
    @Param('runId') runId: string,
    @Body() dto: BulkSubmitAutomationResultsDto,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    let submitted = 0;
    for (const result of dto.results) {
      const saved = await this.automationService.submitResult(
        runId,
        result,
        req.apiKey.projectId,
      );
      if (saved) submitted++;
    }
    return { submitted, total: dto.results.length };
  }

  @Post('runs/:runId/complete')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Mark automated run as completed' })
  @ApiResponse({ status: 200, description: 'Run marked complete' })
  completeRun(
    @Param('runId') runId: string,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    return this.automationService.completeRun(runId, req.apiKey.projectId);
  }

  @Get('cases/:projectId')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'List test cases with automation IDs' })
  @ApiResponse({ status: 200, description: 'List of automated case mappings' })
  listCases(
    @Param('projectId') projectId: string,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    return this.automationService.listAutomatedCases(projectId);
  }

  @Post('sync')
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Sync Playwright test discovery with Qamelot cases' })
  @ApiResponse({ status: 200, description: 'Sync results' })
  sync(
    @Body() dto: SyncAutomationTestsDto,
    @Req() req: { apiKey: { id: string; projectId: string } },
  ) {
    return this.automationService.syncTests(dto.projectId, dto.tests);
  }
}
```

- [ ] **Step 4: Create module**

File: `apps/backend/src/automation/automation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RunEventsModule } from '../run-events/run-events.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

@Module({
  imports: [PrismaModule, RunEventsModule],
  controllers: [AutomationController],
  providers: [AutomationService],
})
export class AutomationModule {}
```

- [ ] **Step 5: Register in AppModule**

Add `AutomationModule` to imports in `apps/backend/src/app.module.ts`:

```typescript
import { AutomationModule } from './automation/automation.module';

// In @Module imports array:
AutomationModule,
```

- [ ] **Step 6: Run all automation tests**

```bash
cd apps/backend && npx jest src/automation/ --no-coverage
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/automation/ apps/backend/src/app.module.ts
git commit -m "feat(backend): add automation API controller and module

Endpoints: POST /automation/runs, POST /automation/runs/:id/results,
POST /automation/runs/:id/complete, GET /automation/cases/:projectId,
POST /automation/sync. All use API key auth via X-API-Key header.

Closes #35"
```

---

## Chunk 4: Playwright Reporter Package

### Task 9: Package Setup

**Files:**
- Create: `packages/playwright-reporter/package.json`
- Create: `packages/playwright-reporter/tsconfig.json`

- [ ] **Step 1: Create package.json**

File: `packages/playwright-reporter/package.json`

```json
{
  "name": "@app/playwright-reporter",
  "version": "0.1.0",
  "private": true,
  "description": "Playwright reporter that sends results to Qamelot",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@app/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@playwright/test": "^1.40.0"
  },
  "peerDependencies": {
    "@playwright/test": ">=1.30.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

File: `packages/playwright-reporter/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /path/to/worktree && pnpm install
```

Expected: Dependencies installed, workspace link created.

- [ ] **Step 4: Commit**

```bash
git add packages/playwright-reporter/package.json packages/playwright-reporter/tsconfig.json pnpm-lock.yaml
git commit -m "chore(shared): scaffold playwright-reporter package

Adds @app/playwright-reporter workspace package with Playwright
peer dependency and shared types.

Closes #35"
```

---

### Task 10: Reporter HTTP Client

**Files:**
- Create: `packages/playwright-reporter/src/types.ts`
- Create: `packages/playwright-reporter/src/client.ts`

- [ ] **Step 1: Create types**

File: `packages/playwright-reporter/src/types.ts`

```typescript
export interface QamelotReporterConfig {
  /** Qamelot backend URL, e.g. http://localhost:5002 */
  baseUrl: string;
  /** API key (starts with qam_) */
  apiKey: string;
  /** Qamelot project ID */
  projectId: string;
  /** Qamelot test plan ID */
  planId: string;
  /** Optional run name — defaults to "Playwright Run <timestamp>" */
  runName?: string;
  /** Optional CI job URL */
  ciJobUrl?: string;
  /** Request timeout in ms — defaults to 30000 */
  timeout?: number;
}

export interface CreateRunResponse {
  id: string;
  name: string;
  executionType: string;
  unmatchedIds: string[];
}

export interface SubmitResultsResponse {
  submitted: number;
  total: number;
}

export interface AutomationResult {
  automationId: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  duration?: number;
  error?: string;
  log?: string;
}
```

- [ ] **Step 2: Create HTTP client**

File: `packages/playwright-reporter/src/client.ts`

```typescript
import type {
  QamelotReporterConfig,
  CreateRunResponse,
  SubmitResultsResponse,
  AutomationResult,
} from './types';

export class QamelotClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: QamelotReporterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30_000;
  }

  async createRun(data: {
    projectId: string;
    planId: string;
    name: string;
    automationIds: string[];
    ciJobUrl?: string;
  }): Promise<CreateRunResponse> {
    return this.post<CreateRunResponse>('/automation/runs', data);
  }

  async submitResults(
    runId: string,
    results: AutomationResult[],
  ): Promise<SubmitResultsResponse> {
    return this.post<SubmitResultsResponse>(
      `/automation/runs/${runId}/results`,
      { results },
    );
  }

  async completeRun(runId: string): Promise<void> {
    await this.post(`/automation/runs/${runId}/complete`, {});
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Qamelot API ${res.status}: ${text}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/playwright-reporter/src/
git commit -m "feat(shared): add Qamelot reporter types and HTTP client

QamelotClient wraps the automation API with typed methods for
createRun, submitResults, and completeRun. Uses native fetch.

Closes #35"
```

---

### Task 11: Reporter Implementation

**Files:**
- Create: `packages/playwright-reporter/src/reporter.ts`
- Create: `packages/playwright-reporter/src/index.ts`

- [ ] **Step 1: Implement the reporter**

File: `packages/playwright-reporter/src/reporter.ts`

```typescript
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { QamelotClient } from './client';
import type { QamelotReporterConfig, AutomationResult } from './types';

export class QamelotReporter implements Reporter {
  private client: QamelotClient;
  private config: QamelotReporterConfig;
  private runId: string | null = null;
  private resultBuffer: AutomationResult[] = [];
  private automationIds: string[] = [];
  private flushPromise: Promise<void> = Promise.resolve();
  private readonly BATCH_SIZE = 50;

  constructor(config: QamelotReporterConfig) {
    this.config = config;
    this.client = new QamelotClient(config);
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    // Collect all test automation IDs
    this.automationIds = this.collectTestIds(suite);

    if (this.automationIds.length === 0) {
      console.warn('[qamelot] No tests found to report');
      return;
    }

    // Create run asynchronously — results will queue until ready
    const runName =
      this.config.runName ??
      `Playwright Run ${new Date().toISOString().slice(0, 19)}`;

    this.flushPromise = this.client
      .createRun({
        projectId: this.config.projectId,
        planId: this.config.planId,
        name: runName,
        automationIds: this.automationIds,
        ciJobUrl: this.config.ciJobUrl,
      })
      .then((run) => {
        this.runId = run.id;
        if (run.unmatchedIds.length > 0) {
          console.warn(
            `[qamelot] ${run.unmatchedIds.length} test(s) not linked in Qamelot`,
          );
        }
        console.log(
          `[qamelot] Run created: ${run.id} (${this.automationIds.length} tests)`,
        );
      })
      .catch((err: Error) => {
        console.error(`[qamelot] Failed to create run: ${err.message}`);
      });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // Only report the final retry
    if (result.retry > 0 && result.status === 'passed') {
      // This is a retry that passed — report it
    } else if (result.retry > 0) {
      // Intermediate retry that didn't pass — skip, wait for final
      return;
    }

    const automationId = this.buildTestId(test);
    const mappedStatus = this.mapStatus(result.status);

    this.resultBuffer.push({
      automationId,
      status: mappedStatus,
      duration: result.duration,
      error: result.error?.message,
      log: result.error?.stack,
    });

    // Flush when batch is full
    if (this.resultBuffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    // Wait for run creation to complete
    await this.flushPromise;

    if (!this.runId) {
      console.error('[qamelot] No run ID — skipping result submission');
      return;
    }

    // Flush remaining results
    await this.flush();
    await this.flushPromise;

    // Complete the run
    try {
      await this.client.completeRun(this.runId);
      console.log(`[qamelot] Run ${this.runId} completed`);
    } catch (err) {
      console.error(
        `[qamelot] Failed to complete run: ${(err as Error).message}`,
      );
    }
  }

  private flush(): void {
    if (this.resultBuffer.length === 0 || !this.runId) return;

    const batch = this.resultBuffer.splice(0, this.resultBuffer.length);
    const runId = this.runId;

    // Chain flush promises to maintain order
    this.flushPromise = this.flushPromise
      .then(() => this.client.submitResults(runId, batch))
      .then((res) => {
        if (res.submitted < res.total) {
          console.warn(
            `[qamelot] ${res.total - res.submitted} result(s) had no matching case`,
          );
        }
      })
      .catch((err: Error) => {
        console.error(`[qamelot] Failed to submit results: ${err.message}`);
      });
  }

  private collectTestIds(suite: Suite): string[] {
    const ids: string[] = [];
    for (const test of suite.allTests()) {
      ids.push(this.buildTestId(test));
    }
    return ids;
  }

  private buildTestId(test: TestCase): string {
    // Format: "relative/path/to/file.spec.ts > Suite Name > Test Name"
    const filePath = test.location.file;
    const titlePath = test.titlePath().slice(1); // Remove root suite
    // First element is the file-level suite (often empty), rest are describes + test
    return `${filePath} > ${titlePath.join(' > ')}`;
  }

  private mapStatus(
    status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted',
  ): 'PASSED' | 'FAILED' | 'BLOCKED' {
    switch (status) {
      case 'passed':
        return 'PASSED';
      case 'failed':
      case 'timedOut':
      case 'interrupted':
        return 'FAILED';
      case 'skipped':
        return 'BLOCKED';
    }
  }
}
```

- [ ] **Step 2: Create main export**

File: `packages/playwright-reporter/src/index.ts`

```typescript
export { QamelotReporter } from './reporter';
export { QamelotClient } from './client';
export type { QamelotReporterConfig, AutomationResult } from './types';

// Default export for Playwright config: reporter: [['@app/playwright-reporter', { ... }]]
export default QamelotReporter;
```

- [ ] **Step 3: Build and verify**

```bash
cd packages/playwright-reporter && pnpm build
```

Expected: Compiles without errors, dist/ created.

- [ ] **Step 4: Commit**

```bash
git add packages/playwright-reporter/
git commit -m "feat(shared): implement Playwright reporter for Qamelot

Custom Playwright reporter that creates automated test runs,
batches and submits results, and completes runs. Maps Playwright
test status to Qamelot enums. Graceful degradation on API failure.

Usage in playwright.config.ts:
  reporter: [['@app/playwright-reporter', { baseUrl, apiKey, projectId, planId }]]

Closes #35"
```

---

## Chunk 5: Frontend — API Client & Automation UI

### Task 12: Frontend API Clients

**Files:**
- Create: `apps/frontend/lib/api/api-keys.ts`
- Create: `apps/frontend/lib/api/automation.ts`
- Create: `apps/frontend/lib/api-keys/useApiKeys.ts`

- [ ] **Step 1: Create API keys client**

File: `apps/frontend/lib/api/api-keys.ts`

```typescript
import type { ApiKeyDto, ApiKeyCreatedDto } from '@app/shared';
import { apiFetch } from './client';

export const apiKeysApi = {
  list(projectId: string): Promise<ApiKeyDto[]> {
    return apiFetch(`/projects/${projectId}/api-keys`);
  },

  create(
    projectId: string,
    data: { name: string; expiresAt?: string },
  ): Promise<ApiKeyCreatedDto> {
    return apiFetch(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ ...data, projectId }),
    });
  },

  revoke(projectId: string, keyId: string): Promise<ApiKeyDto> {
    return apiFetch(`/projects/${projectId}/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  },
};
```

- [ ] **Step 2: Create automation client**

File: `apps/frontend/lib/api/automation.ts`

```typescript
import type { AutomationCaseMapDto, AutomationSyncResultDto } from '@app/shared';
import { apiFetch } from './client';

export const automationApi = {
  listCases(projectId: string): Promise<AutomationCaseMapDto[]> {
    return apiFetch(`/automation/cases/${projectId}`);
  },

  syncTests(
    projectId: string,
    tests: Array<{ automationId: string; title: string; filePath: string }>,
  ): Promise<AutomationSyncResultDto> {
    return apiFetch('/automation/sync', {
      method: 'POST',
      body: JSON.stringify({ projectId, tests }),
    });
  },
};
```

- [ ] **Step 3: Create React Query hooks for API keys**

File: `apps/frontend/lib/api-keys/useApiKeys.ts`

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '../api/api-keys';

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: ['api-keys', projectId],
    queryFn: () => apiKeysApi.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: { name: string; expiresAt?: string };
    }) => apiKeysApi.create(projectId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['api-keys', variables.projectId],
      });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      keyId,
    }: {
      projectId: string;
      keyId: string;
    }) => apiKeysApi.revoke(projectId, keyId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['api-keys', variables.projectId],
      });
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/lib/api/api-keys.ts apps/frontend/lib/api/automation.ts apps/frontend/lib/api-keys/
git commit -m "feat(frontend): add API key and automation API clients + hooks

API client for CRUD on API keys and automation case listing/sync.
React Query hooks with proper cache invalidation.

Closes #35"
```

---

### Task 13: Update Test Case Editor — Automation Section

**Files:**
- Modify: `apps/frontend/components/test-cases/CaseEditor.tsx`

- [ ] **Step 1: Read the current CaseEditor.tsx to understand its structure**

Read `apps/frontend/components/test-cases/CaseEditor.tsx` fully before making changes.

- [ ] **Step 2: Add automation fields section**

Add a collapsible "Automation" section to the case editor below the existing fields. This section should display:
- `automationId` (read-only text field — set by sync/API)
- `automationFilePath` (read-only text field)
- `automationStatus` badge (NOT_AUTOMATED / AUTOMATED / NEEDS_UPDATE)

The automation fields are informational — they are set by the sync API, not manually edited.

```tsx
// Add inside the editor form, after existing fields:
<div className="space-y-3 rounded-lg border p-4">
  <h4 className="text-sm font-medium text-muted-foreground">Automation</h4>
  {testCase.automationStatus === 'NOT_AUTOMATED' ? (
    <p className="text-sm text-muted-foreground">
      Not linked to any automated test.
    </p>
  ) : (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={testCase.automationStatus === 'AUTOMATED' ? 'default' : 'destructive'}>
          {testCase.automationStatus}
        </Badge>
      </div>
      {testCase.automationId && (
        <div>
          <span className="text-xs text-muted-foreground">Automation ID</span>
          <p className="font-mono text-xs break-all">{testCase.automationId}</p>
        </div>
      )}
      {testCase.automationFilePath && (
        <div>
          <span className="text-xs text-muted-foreground">File</span>
          <p className="font-mono text-xs break-all">{testCase.automationFilePath}</p>
        </div>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/components/test-cases/CaseEditor.tsx
git commit -m "feat(frontend): show automation info in case editor

Displays automation status badge, automation ID, and file path
in a read-only section of the test case editor.

Closes #35"
```

---

### Task 14: Automation Badge in Case List

**Files:**
- Modify: `apps/frontend/components/test-cases/CaseListPanel.tsx`

- [ ] **Step 1: Read the current CaseListPanel.tsx**

Read `apps/frontend/components/test-cases/CaseListPanel.tsx` fully before making changes.

- [ ] **Step 2: Add automation status badge**

Add a small indicator (icon or badge) next to each case in the list to show automation status:
- `AUTOMATED` → green bot/zap icon
- `NEEDS_UPDATE` → yellow warning icon
- `NOT_AUTOMATED` → no icon (default, no visual noise)

```tsx
// In the case row, after the title:
{c.automationStatus === 'AUTOMATED' && (
  <Zap className="h-3 w-3 text-green-500" />
)}
{c.automationStatus === 'NEEDS_UPDATE' && (
  <AlertTriangle className="h-3 w-3 text-yellow-500" />
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/components/test-cases/CaseListPanel.tsx
git commit -m "feat(frontend): show automation status icons in case list

Displays green zap icon for AUTOMATED cases and yellow warning
for NEEDS_UPDATE. No icon for NOT_AUTOMATED (default).

Closes #35"
```

---

### Task 15: API Keys Management Page

**Files:**
- Create: `apps/frontend/app/(dashboard)/settings/api-keys/page.tsx`

- [ ] **Step 1: Read existing settings page structure**

Check `apps/frontend/app/(dashboard)/settings/` for existing patterns.

- [ ] **Step 2: Create API keys page**

Build a simple page with:
- Project selector dropdown
- Table listing active API keys (name, prefix, created date, last used, actions)
- "Create API Key" button → dialog with name field
- Revoke button per key (with confirmation)
- Show raw key in a copyable alert after creation (only once)

Follow existing component patterns (shadcn Dialog, Table, Button, Input).

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/(dashboard)/settings/api-keys/
git commit -m "feat(frontend): add API keys management page

Settings page to create, view, and revoke project API keys.
Raw key shown once at creation in a copyable alert.

Closes #35"
```

---

### Task 16: Update Test Case Mutation to Include Automation Fields

**Files:**
- Modify: `apps/frontend/lib/api/test-cases.ts` — Add automationStatus to query params
- Modify: `apps/backend/src/test-cases/test-cases.controller.ts` — Add automationStatus filter
- Modify: `apps/backend/src/test-cases/test-cases.service.ts` — Filter by automationStatus

- [ ] **Step 1: Add automationStatus filter to backend list endpoint**

In the test cases controller `listBySuite` method, add optional query param:

```typescript
@ApiQuery({ name: 'automationStatus', required: false, enum: ['NOT_AUTOMATED', 'AUTOMATED', 'NEEDS_UPDATE'] })
```

In the service, add the filter:

```typescript
...(automationStatus && { automationStatus }),
```

- [ ] **Step 2: Update frontend API client to pass filter**

In `apps/frontend/lib/api/test-cases.ts`, add optional `automationStatus` param to `listBySuite`.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/test-cases/ apps/frontend/lib/api/test-cases.ts
git commit -m "feat(backend,frontend): add automationStatus filter to test case list

Allows filtering test cases by automation status in both
the API and frontend client.

Closes #35"
```

---

## Chunk 6: Verification & Cleanup

### Task 17: Full Build & Test Verification

- [ ] **Step 1: Build all packages**

```bash
pnpm build
```

Expected: All packages build without errors.

- [ ] **Step 2: Type check**

```bash
pnpm typecheck
```

Expected: Zero type errors.

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 4: Lint**

```bash
pnpm lint
```

Expected: Zero lint errors.

- [ ] **Step 5: Verify migration**

```bash
cd apps/backend && npx prisma migrate status
```

Expected: All migrations applied.

---

### Task 18: Update .env.example

**Files:**
- Modify: `apps/backend/.env.example`

- [ ] **Step 1: Add any new env vars**

No new env vars needed for this feature — API keys are stored in the database, not in env.

- [ ] **Step 2: Final commit if any cleanup**

```bash
git add -A
git commit -m "chore: final cleanup for Playwright automation integration

Closes #35"
```

---

## Summary — Task Dependency Graph

```
Task 1 (Schema) ─── must complete first
   │
   ├── Task 2 (Shared Types) ── Task 3 (Shared Schemas)
   │        │                          │
   │        └─── Task 4 (API Key Guard)
   │                    │
   │        Task 5 (API Keys Service) ── Task 6 (API Keys Controller)
   │                                           │
   │        Task 7 (Automation Service) ── Task 8 (Automation Controller)
   │                                           │
   │        Task 9 (Reporter Setup) ── Task 10 (Reporter Client) ── Task 11 (Reporter)
   │                                           │
   │        Task 12 (Frontend API) ── Task 13-16 (Frontend UI)
   │                                           │
   └── Task 17 (Verification) ── Task 18 (Cleanup)
```

**Parallelizable groups (after Task 1-3):**
- Group A: Tasks 4-6 (API key auth)
- Group B: Tasks 9-11 (Playwright reporter) — independent of backend API *implementation*
- After Group A: Tasks 7-8 (Automation API)
- After Groups A+B: Tasks 12-16 (Frontend)
