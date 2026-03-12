# Project Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full CRUD for the Project entity — the top-level container to which test suites, plans, and runs belong — with soft-delete, role-based access, and a frontend project list page with create dialog and a project detail shell page.

**Architecture:** Backend adds a `projects` NestJS module (controller + service) backed by a new Prisma `Project` model with `deletedAt` for soft delete. All list queries filter `deletedAt: null`. Create/update restricted to ADMIN/LEAD; archive restricted to ADMIN. Frontend adds an API client, a `useProjects` Tanstack Query hook, a project list page at `/(dashboard)/projects`, and a detail page at `/(dashboard)/projects/[id]`. Shared package gets `ProjectDto`, `CreateProjectInput`, `UpdateProjectInput` types and Zod schemas.

**Tech Stack:** NestJS, Prisma, PostgreSQL (backend); Next.js 16 App Router, Tanstack Query, React Hook Form, Zod, shadcn/ui (frontend); all already installed.

---

## pnpm alias

If `pnpm` is not on PATH in your shell, define a shell function that invokes `node` and the `pnpm.cjs` binary directly. All `pnpm` commands in this plan assume pnpm is available.

---

## File Structure

**Shared — modify:**
- `packages/shared/src/types/index.ts` — add `ProjectDto` interface
- `packages/shared/src/schemas/project.ts` — create: Zod schemas (`CreateProjectSchema`, `UpdateProjectSchema`)
- `packages/shared/src/index.ts` — re-export project schemas

**Backend — create:**
- `apps/backend/src/projects/projects.module.ts` — ProjectsModule (imports PrismaModule)
- `apps/backend/src/projects/projects.service.ts` — CRUD + soft-delete business logic
- `apps/backend/src/projects/projects.service.spec.ts` — unit tests for service
- `apps/backend/src/projects/projects.controller.ts` — thin REST controller with guards + Swagger
- `apps/backend/src/projects/projects.controller.spec.ts` — controller unit tests
- `apps/backend/src/projects/dto/create-project.dto.ts` — class-validator DTO
- `apps/backend/src/projects/dto/update-project.dto.ts` — class-validator DTO

**Backend — modify:**
- `apps/backend/prisma/schema.prisma` — add `Project` model
- `apps/backend/src/app.module.ts` — import `ProjectsModule`

**Frontend — create:**
- `apps/frontend/lib/api/projects.ts` — typed fetch client for project endpoints
- `apps/frontend/lib/projects/useProjects.ts` — Tanstack Query hook (list, create, update, delete)
- `apps/frontend/lib/projects/useProjects.test.ts` — hook tests
- `apps/frontend/app/(dashboard)/projects/page.tsx` — project list page + create dialog
- `apps/frontend/app/(dashboard)/projects/page.test.tsx` — page tests
- `apps/frontend/app/(dashboard)/projects/[id]/page.tsx` — project detail shell page

---

## Chunk 1: Shared types + Prisma schema + Backend service

### Task 1: Add shared types and schemas

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/schemas/project.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add ProjectDto to shared types**

In `packages/shared/src/types/index.ts`, add after the existing `UserDto` interface:

```typescript
export interface ProjectDto extends BaseEntity {
  name: string;
  description: string | null;
  deletedAt: Date | null;
}
```

- [ ] **Step 2: Create project Zod schemas**

Create `packages/shared/src/schemas/project.ts`:

```typescript
import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
```

- [ ] **Step 3: Export from shared index**

In `packages/shared/src/index.ts`, add:

```typescript
export * from './schemas/project';
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm --filter shared typecheck`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add ProjectDto type and Zod schemas

Closes #3"
```

---

### Task 2: Add Prisma Project model and run migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Add Project model to Prisma schema**

In `apps/backend/prisma/schema.prisma`, add after the `User` model:

```prisma
model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

- [ ] **Step 2: Generate migration**

Run from `apps/backend`:

```bash
npx prisma migrate dev --name add_project_model
```

Expected: Migration created and applied successfully. Prisma Client regenerated.

- [ ] **Step 3: Verify Prisma Client has Project model**

Run: `pnpm --filter backend typecheck`
Expected: zero errors (Prisma Client types now include `Project`).

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(db): add Project model with soft delete

Closes #3"
```

---

### Task 3: Create ProjectsService with tests (TDD)

**Files:**
- Create: `apps/backend/src/projects/projects.service.ts`
- Create: `apps/backend/src/projects/projects.service.spec.ts`

- [ ] **Step 1: Write the failing test file**

Create `apps/backend/src/projects/projects.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockPrisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const testProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('creates a project and returns it', async () => {
      mockPrisma.project.create.mockResolvedValue(testProject);

      const result = await service.create({ name: 'Test Project', description: 'A test project' });

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: { name: 'Test Project', description: 'A test project' },
      });
      expect(result).toEqual(testProject);
    });
  });

  describe('findAll', () => {
    it('returns only active projects (deletedAt is null)', async () => {
      mockPrisma.project.findMany.mockResolvedValue([testProject]);

      const result = await service.findAll();

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([testProject]);
    });
  });

  describe('findOne', () => {
    it('returns project when found and not deleted', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(testProject);

      const result = await service.findOne('proj-1');

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
      expect(result).toEqual(testProject);
    });

    it('throws NotFoundException when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project is soft-deleted', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...testProject,
        deletedAt: new Date(),
      });

      await expect(service.findOne('proj-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the project', async () => {
      const updated = { ...testProject, name: 'Updated Name' };
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue(updated);

      const result = await service.update('proj-1', { name: 'Updated Name' });

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt timestamp on the project', async () => {
      const deleted = { ...testProject, deletedAt: new Date() };
      mockPrisma.project.findUnique.mockResolvedValue(testProject);
      mockPrisma.project.update.mockResolvedValue(deleted);

      const result = await service.softDelete('proj-1');

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter backend test -- --testPathPattern=projects.service.spec`
Expected: FAIL — `Cannot find module './projects.service'`

- [ ] **Step 3: Implement ProjectsService**

Create `apps/backend/src/projects/projects.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectInput, UpdateProjectInput } from '@app/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectInput) {
    return this.prisma.project.create({ data });
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async update(id: string, data: UpdateProjectInput) {
    await this.findOne(id);
    return this.prisma.project.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter backend test -- --testPathPattern=projects.service.spec`
Expected: ALL PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/projects/projects.service.ts apps/backend/src/projects/projects.service.spec.ts
git commit -m "feat(backend): add ProjectsService with CRUD and soft-delete

TDD — tests written first, then implementation.

Closes #3"
```

---

### Task 4: Create DTOs with class-validator

**Files:**
- Create: `apps/backend/src/projects/dto/create-project.dto.ts`
- Create: `apps/backend/src/projects/dto/update-project.dto.ts`

- [ ] **Step 1: Create CreateProjectDto**

Create `apps/backend/src/projects/dto/create-project.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Project', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Project description', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
```

- [ ] **Step 2: Create UpdateProjectDto**

Create `apps/backend/src/projects/dto/update-project.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Updated Name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', maxLength: 500, nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;
}
```

- [ ] **Step 3: Verify DTOs compile**

Run: `pnpm --filter backend typecheck`
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/projects/dto/
git commit -m "feat(backend): add project DTOs with class-validator decorators

Closes #3"
```

---

### Task 5: Create ProjectsController with tests (TDD)

**Files:**
- Create: `apps/backend/src/projects/projects.controller.ts`
- Create: `apps/backend/src/projects/projects.controller.spec.ts`

- [ ] **Step 1: Write the failing controller test**

Create `apps/backend/src/projects/projects.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const testProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  describe('create', () => {
    it('calls service.create and returns the result', async () => {
      mockService.create.mockResolvedValue(testProject);

      const result = await controller.create({ name: 'Test Project', description: 'A test project' });

      expect(mockService.create).toHaveBeenCalledWith({ name: 'Test Project', description: 'A test project' });
      expect(result).toEqual(testProject);
    });
  });

  describe('findAll', () => {
    it('calls service.findAll and returns the result', async () => {
      mockService.findAll.mockResolvedValue([testProject]);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual([testProject]);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with the id', async () => {
      mockService.findOne.mockResolvedValue(testProject);

      const result = await controller.findOne('proj-1');

      expect(mockService.findOne).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(testProject);
    });
  });

  describe('update', () => {
    it('calls service.update with id and dto', async () => {
      const updated = { ...testProject, name: 'Updated' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('proj-1', { name: 'Updated' });

      expect(mockService.update).toHaveBeenCalledWith('proj-1', { name: 'Updated' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('calls service.softDelete with the id', async () => {
      const deleted = { ...testProject, deletedAt: new Date() };
      mockService.softDelete.mockResolvedValue(deleted);

      const result = await controller.remove('proj-1');

      expect(mockService.softDelete).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual(deleted);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter backend test -- --testPathPattern=projects.controller.spec`
Expected: FAIL — `Cannot find module './projects.controller'`

- [ ] **Step 3: Implement ProjectsController**

Create `apps/backend/src/projects/projects.controller.ts`:

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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active projects' })
  @ApiResponse({ status: 200, description: 'Array of active projects' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'The project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LEAD)
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN or LEAD role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Archive (soft delete) a project' })
  @ApiResponse({ status: 200, description: 'Project archived' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string) {
    return this.projectsService.softDelete(id);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter backend test -- --testPathPattern=projects.controller.spec`
Expected: ALL PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/projects/projects.controller.ts apps/backend/src/projects/projects.controller.spec.ts
git commit -m "feat(backend): add ProjectsController with role-based guards

TDD — tests written first, then implementation.
POST/PATCH restricted to ADMIN/LEAD, DELETE restricted to ADMIN.

Closes #3"
```

---

### Task 6: Create ProjectsModule and wire into AppModule

**Files:**
- Create: `apps/backend/src/projects/projects.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create ProjectsModule**

Create `apps/backend/src/projects/projects.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

- [ ] **Step 2: Import ProjectsModule in AppModule**

In `apps/backend/src/app.module.ts`, add to the imports array:

```typescript
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,  // ← add this
  ],
  // ...
})
export class AppModule {}
```

- [ ] **Step 3: Run all backend tests**

Run: `pnpm --filter backend test`
Expected: ALL PASS (all auth tests + all project tests).

- [ ] **Step 4: Run typecheck**

Run: `pnpm --filter backend typecheck`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/projects/projects.module.ts apps/backend/src/app.module.ts
git commit -m "feat(backend): wire ProjectsModule into AppModule

Closes #3"
```

---

## Chunk 2: Frontend — API client, hook, pages

### Task 7: Create frontend API client for projects

**Files:**
- Create: `apps/frontend/lib/api/projects.ts`

- [ ] **Step 1: Create the projects API client**

Create `apps/frontend/lib/api/projects.ts`, following the same `apiFetch` pattern from `lib/api/auth.ts`:

```typescript
import type { ProjectDto, CreateProjectInput, UpdateProjectInput } from '@app/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const projectsApi = {
  list: () => apiFetch<ProjectDto[]>('/projects'),

  getById: (id: string) => apiFetch<ProjectDto>(`/projects/${id}`),

  create: (data: CreateProjectInput) =>
    apiFetch<ProjectDto>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProjectInput) =>
    apiFetch<ProjectDto>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    apiFetch<ProjectDto>(`/projects/${id}`, { method: 'DELETE' }),
};
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter frontend typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/lib/api/projects.ts
git commit -m "feat(frontend): add projects API client

Typed fetch wrapper for all project CRUD endpoints.

Closes #3"
```

---

### Task 8: Create useProjects hook with tests (TDD)

**Files:**
- Create: `apps/frontend/lib/projects/useProjects.ts`
- Create: `apps/frontend/lib/projects/useProjects.test.ts`

- [ ] **Step 1: Write the failing hook test**

Create `apps/frontend/lib/projects/useProjects.test.ts`:

```typescript
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects } from './useProjects';

vi.mock('../api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { projectsApi } from '../api/projects';

const mockList = projectsApi.list as ReturnType<typeof vi.fn>;
const mockCreate = projectsApi.create as ReturnType<typeof vi.fn>;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns projects', async () => {
    const projects = [
      { id: 'p1', name: 'Project 1', description: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockList.mockResolvedValue(projects);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.projects).toEqual(projects);
    });

    expect(mockList).toHaveBeenCalled();
  });

  it('exposes isLoading state', () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('provides a create mutation', async () => {
    mockList.mockResolvedValue([]);
    const newProject = { id: 'p2', name: 'New', description: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
    mockCreate.mockResolvedValue(newProject);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.createProject.mutate({ name: 'New' });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ name: 'New' });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter frontend test -- --run useProjects.test`
Expected: FAIL — `Cannot find module './useProjects'`

- [ ] **Step 3: Implement useProjects hook**

Create `apps/frontend/lib/projects/useProjects.ts`:

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, UpdateProjectInput } from '@app/shared';
import { projectsApi } from '../api/projects';

export const PROJECTS_QUERY_KEY = ['projects'] as const;

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: projectsApi.list,
  });

  const createProject = useMutation({
    mutationFn: (data: CreateProjectInput) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });

  return {
    projects: projects ?? [],
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter frontend test -- --run useProjects.test`
Expected: ALL PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/lib/projects/
git commit -m "feat(frontend): add useProjects hook with Tanstack Query

TDD — tests written first, then implementation.
Provides list query + create/update/delete mutations.

Closes #3"
```

---

### Task 9: Create project list page with create dialog

**Files:**
- Create: `apps/frontend/app/(dashboard)/projects/page.tsx`
- Create: `apps/frontend/app/(dashboard)/projects/page.test.tsx`

> **Note:** Invoke `frontend-design` and `react-best-practices` skills when implementing this task.

- [ ] **Step 1: Write the failing page test**

Create `apps/frontend/app/(dashboard)/projects/page.test.tsx`:

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsPage from './page';

vi.mock('@/lib/api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { projectsApi } from '@/lib/api/projects';

const mockList = projectsApi.list as ReturnType<typeof vi.fn>;
const mockCreate = projectsApi.create as ReturnType<typeof vi.fn>;

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project list heading', async () => {
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectsPage));

    expect(screen.getByRole('heading', { name: /projects/i })).toBeInTheDocument();
  });

  it('displays projects from the API', async () => {
    mockList.mockResolvedValue([
      { id: 'p1', name: 'Alpha', description: 'First project', deletedAt: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'p2', name: 'Beta', description: null, deletedAt: null, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
    ]);

    renderWithProviders(React.createElement(ProjectsPage));

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  it('shows empty state when no projects exist', async () => {
    mockList.mockResolvedValue([]);

    renderWithProviders(React.createElement(ProjectsPage));

    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
  });

  it('opens create dialog when clicking New Project button', async () => {
    mockList.mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithProviders(React.createElement(ProjectsPage));

    const newButton = await screen.findByRole('button', { name: /new project/i });
    await user.click(newButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    });
  });

  it('submits create form and calls API', async () => {
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'p3', name: 'Gamma', description: null, deletedAt: null, createdAt: '2026-01-03', updatedAt: '2026-01-03' });
    const user = userEvent.setup();

    renderWithProviders(React.createElement(ProjectsPage));

    const newButton = await screen.findByRole('button', { name: /new project/i });
    await user.click(newButton);

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Gamma');

    const submitButton = screen.getByRole('button', { name: /create$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gamma' }));
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter frontend test -- --run projects/page.test`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement the projects list page**

Create `apps/frontend/app/(dashboard)/projects/page.tsx`.

This is a `'use client'` page containing:
- A heading "Projects" with a "New Project" button
- A project list rendering cards for each project (name, description, createdAt)
- Each card links to `/projects/{id}`
- An empty state message when no projects exist
- A dialog/modal for creating a new project (name field required, description optional)
- Uses `useProjects` hook for data and mutations
- Uses React Hook Form + Zod (`CreateProjectSchema` from `@app/shared`) for the create form
- Uses shadcn/ui components where available (Button already exists)

> The exact UI design will be determined when invoking `frontend-design` skill during implementation. The test defines the contract: heading, project names visible, "New Project" button, create dialog with "Project name" label, and a "Create" submit button.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter frontend test -- --run projects/page.test`
Expected: ALL PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/\(dashboard\)/projects/
git commit -m "feat(frontend): add project list page with create dialog

Displays all active projects, empty state, and inline create form.
Uses useProjects hook + React Hook Form + Zod validation.

Closes #3"
```

---

### Task 10: Create project detail shell page

**Files:**
- Create: `apps/frontend/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Create the detail page**

Create `apps/frontend/app/(dashboard)/projects/[id]/page.tsx`:

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { PROJECTS_QUERY_KEY } from '@/lib/projects/useProjects';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error || !project) {
    return <div className="p-6">Project not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      {project.description && (
        <p className="mt-2 text-muted-foreground">{project.description}</p>
      )}
      <div className="mt-8 text-muted-foreground">
        Test suites and runs will appear here in future issues.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter frontend typecheck`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/\(dashboard\)/projects/\[id\]/
git commit -m "feat(frontend): add project detail shell page

Shows project name and description. Test suites/runs placeholder for future issues.

Closes #3"
```

---

## Chunk 3: Integration verification + cleanup

### Task 11: Full test / typecheck / lint pass

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS across backend and frontend.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: zero errors across all packages.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: zero errors.

- [ ] **Step 4: Fix any issues found and commit fixes**

If any test/type/lint errors, fix and commit with:
```bash
git commit -m "fix(backend|frontend): resolve [description]

Closes #3"
```

---

### Task 12: Final review and PR

- [ ] **Step 1: Invoke `superpowers:verification-before-completion`**

Confirm all three checks pass with evidence.

- [ ] **Step 2: Invoke `simplify`**

Review changed code for quality, reuse, and redundancy.

- [ ] **Step 3: Invoke `superpowers:requesting-code-review`**

- [ ] **Step 4: Invoke `code-review:code-review`**

- [ ] **Step 5: Apply any feedback, re-run pre-review gate if needed**

- [ ] **Step 6: Invoke `commit-commands:commit-push-pr`**

Push branch and create PR with title `[#3] Add project management CRUD`.
