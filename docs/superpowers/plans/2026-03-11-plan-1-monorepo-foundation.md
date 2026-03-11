# Monorepo Foundation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the complete pnpm monorepo with NestJS backend, Next.js 16 frontend, and packages/shared so that `pnpm dev` starts both apps and `pnpm test` passes a smoke test suite.

**Architecture:** Three workspace packages share a single pnpm lockfile. `packages/shared` is a TypeScript library imported by both apps as `@app/shared`. The backend is a NestJS app connected to a local PostgreSQL database via Prisma (User model only in this plan). The frontend is a Next.js 16 App Router app with Tailwind v4 and shadcn/ui bootstrapped.

**Tech Stack:** pnpm workspaces · NestJS 10 · Prisma 5 · PostgreSQL 16 (Homebrew) · Next.js 16 · Tailwind v4 · shadcn/ui · TypeScript 5 · Jest (backend) · Vitest + Testing Library (frontend)

> **GitHub Issue:** This plan implements Issue #1 — all commits reference `Closes #1`.

---

## Chunk 1: Root Scaffold + Shared Package + Backend

### Task 1: Root monorepo scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `.prettierrc`
- Create: `.nvmrc`

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "qamelot",
  "version": "0.0.1",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "concurrently \"pnpm --filter backend dev\" \"pnpm --filter frontend dev\"",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Create `.prettierrc`**

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 5: Create `.nvmrc`**

```
20
```

- [ ] **Step 6: Install root dependencies**

```bash
pnpm install
```

Expected: `node_modules` created at root, no errors.

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .prettierrc .nvmrc pnpm-lock.yaml
git commit -m "chore: root monorepo scaffold

Adds pnpm workspace config, root scripts, shared tsconfig base,
and prettier config.

Closes #1"
```

---

### Task 2: `packages/shared` scaffold

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants/index.ts`

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@app/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  },
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/shared/src/types/index.ts`**

```typescript
// Role enum — shared between backend guards and frontend UI
export enum Role {
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  TESTER = 'TESTER',
  VIEWER = 'VIEWER',
}

// Base entity fields present on every DB record
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Minimal user shape returned by API (no password hash)
export interface UserDto extends BaseEntity {
  email: string;
  name: string;
  role: Role;
}
```

- [ ] **Step 4: Create `packages/shared/src/constants/index.ts`**

Note: No env vars here — `NEXT_PUBLIC_API_URL` is Next.js-only and lives in the frontend.

```typescript
export const ROLES_KEY = 'roles';
```

- [ ] **Step 5: Create `packages/shared/src/index.ts`**

```typescript
export * from './types/index';
export * from './constants/index';
```

- [ ] **Step 6: Install and build shared package**

```bash
pnpm install
pnpm --filter @app/shared build
```

Expected: `packages/shared/dist/` created. Verify:

```bash
ls packages/shared/dist/
```

Expected output: `index.d.ts  index.js  index.js.map  types/  constants/`

- [ ] **Step 7: Commit**

```bash
git add packages/
git commit -m "feat(shared): scaffold @app/shared package with base types

Adds Role enum, BaseEntity, UserDto, and ROLES_KEY constant.
NEXT_PUBLIC_API_URL lives in apps/frontend — not in shared.

Closes #1"
```

---

### Task 3: NestJS backend scaffold

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/tsconfig.build.json`
- Create: `apps/backend/nest-cli.json`
- Create: `apps/backend/jest.config.js`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/app.controller.ts`
- Create: `apps/backend/src/app.controller.spec.ts`
- Create: `apps/backend/src/app.service.ts`

- [ ] **Step 1: Create `apps/backend/package.json`**

```json
{
  "name": "backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\" --ext .ts",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@app/shared": "workspace:*",
    "@nestjs/common": "^10.3.8",
    "@nestjs/core": "^10.3.8",
    "@nestjs/platform-express": "^10.3.8",
    "@nestjs/swagger": "^7.3.1",
    "@nestjs/config": "^3.2.2",
    "@prisma/client": "^5.14.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.1",
    "@nestjs/testing": "^10.3.8",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.2",
    "jest": "^29.7.0",
    "prisma": "^5.14.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Create `apps/backend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "paths": {
      "@app/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["src", "test"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/backend/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Create `apps/backend/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: Create `apps/backend/jest.config.js`**

```js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@app/shared(.*)$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
};
```

- [ ] **Step 6: Install backend dependencies**

```bash
pnpm install
```

Expected: `apps/backend/node_modules` populated, no errors.

- [ ] **Step 7: Write failing test — `apps/backend/src/app.controller.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return status ok', () => {
      expect(appController.health()).toEqual({ status: 'ok', app: 'qamelot' });
    });
  });
});
```

- [ ] **Step 8: Run test — verify it fails**

```bash
pnpm --filter backend test
```

Expected: FAIL — `Cannot find module './app.controller'`

- [ ] **Step 9: Create `apps/backend/src/app.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; app: string } {
    return { status: 'ok', app: 'qamelot' };
  }
}
```

- [ ] **Step 10: Create `apps/backend/src/app.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'App is running' })
  health(): { status: string; app: string } {
    return this.appService.getHealth();
  }
}
```

- [ ] **Step 11: Create `apps/backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 12: Create `apps/backend/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  app.enableCors({ origin: frontendUrl, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Qamelot API')
    .setDescription('Test Management Platform API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend running on http://0.0.0.0:${port}`);
  logger.log(`Swagger docs at http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
```

- [ ] **Step 13: Run test — verify it passes**

```bash
pnpm --filter backend test
```

Expected: PASS — `health should return status ok ✓`

- [ ] **Step 14: Commit**

```bash
git add apps/backend/
git commit -m "feat(backend): scaffold NestJS app with health endpoint

Adds NestJS app with ConfigModule, global ValidationPipe,
CORS (from FRONTEND_URL env), Swagger at /api/docs, health check.
Test passes.

Closes #1"
```

---

### Task 4: Prisma setup (User model)

**Files:**
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/src/prisma/prisma.service.ts`
- Create: `apps/backend/src/prisma/prisma.service.spec.ts`
- Create: `apps/backend/src/prisma/prisma.module.ts`

- [ ] **Step 1: Create `apps/backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  LEAD
  TESTER
  VIEWER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(TESTER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Write failing test — `apps/backend/src/prisma/prisma.service.spec.ts`**

Mocks `$connect` and `$disconnect` so the test never touches the real database.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Prevent real DB connection in unit tests
    jest.spyOn(service, '$connect').mockResolvedValue();
    jest.spyOn(service, '$disconnect').mockResolvedValue();
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test — verify it fails**

```bash
pnpm --filter backend test
```

Expected: FAIL — `Cannot find module './prisma.service'`

- [ ] **Step 4: Create `apps/backend/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
```

- [ ] **Step 5: Create `apps/backend/src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: Add PrismaModule to AppModule**

Replace `apps/backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 7: Run test — verify it passes**

```bash
pnpm --filter backend test
```

Expected: PASS — both `AppController` and `PrismaService` tests pass, no DB connection attempted.

- [ ] **Step 8: Generate Prisma client**

Make sure PostgreSQL is running:

```bash
brew services start postgresql@16
```

Generate client only (no migration yet — migration runs via `setup.sh` and CI):

```bash
pnpm --filter backend exec prisma generate
```

Expected: `✔ Generated Prisma Client` — no migration SQL yet.

Create the first migration:

```bash
cd apps/backend && pnpm exec prisma migrate dev --name init && cd ../..
```

Expected: `prisma/migrations/20260311000000_init/migration.sql` created and applied.
`✔ Generated Prisma Client`

- [ ] **Step 9: Commit**

```bash
git add apps/backend/prisma/ apps/backend/src/prisma/
git commit -m "feat(db): add Prisma setup with User model

Adds PrismaService (global module), User schema with Role enum,
initial migration. Unit test mocks DB connection — no real DB
required to run the test suite.

Closes #1"
```

---

## Chunk 2: Frontend + Tooling + Scripts + Smoke Tests

### Task 5: Next.js 16 frontend scaffold

**Files:**
- Create: `apps/frontend/package.json`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/next.config.ts`
- Create: `apps/frontend/vitest.config.ts`
- Create: `apps/frontend/vitest.setup.ts`
- Create: `apps/frontend/app/layout.tsx`
- Create: `apps/frontend/app/page.tsx`
- Create: `apps/frontend/app/globals.css`
- Create: `apps/frontend/app/page.test.tsx`

- [ ] **Step 1: Create `apps/frontend/package.json`**

```json
{
  "name": "frontend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@app/shared": "workspace:*",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.45.1",
    "react-hook-form": "^7.52.1",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.6.0",
    "recharts": "^2.12.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.395.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.4.6",
    "jsdom": "^24.1.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/frontend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@app/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/frontend/next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@app/shared'],
};

export default nextConfig;
```

- [ ] **Step 4: Create `apps/frontend/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@app/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
```

- [ ] **Step 5: Create `apps/frontend/vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 6: Install frontend dependencies**

```bash
pnpm install
```

Expected: `apps/frontend/node_modules` populated, no errors.

- [ ] **Step 7: Write failing test — `apps/frontend/app/page.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('renders the app name', () => {
    render(<Home />);
    expect(screen.getByText(/qamelot/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run test — verify it fails**

```bash
pnpm --filter frontend test
```

Expected: FAIL — `Cannot find module './page'` (page.tsx not yet created)

- [ ] **Step 9: Create `apps/frontend/app/globals.css`**

```css
@import "tailwindcss";
```

(Tailwind v4 full theme added in Task 6 after shadcn init)

- [ ] **Step 10: Create `apps/frontend/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Qamelot',
  description: 'Test Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 11: Create `apps/frontend/app/page.tsx`**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Qamelot</h1>
      <p className="mt-4 text-lg text-muted-foreground">Test Management Platform</p>
    </main>
  );
}
```

- [ ] **Step 12: Run test — verify it passes**

```bash
pnpm --filter frontend test
```

Expected: PASS — `renders the app name ✓`

- [ ] **Step 13: Commit**

```bash
git add apps/frontend/
git commit -m "feat(frontend): scaffold Next.js 16 app with smoke test

Adds Next.js 16 App Router with Vitest + Testing Library.
Config created before test to ensure correct failure mode.
Home page renders 'Qamelot'. Test passes.

Closes #1"
```

---

### Task 6: Tailwind v4 + shadcn/ui setup

**Files:**
- Create: `apps/frontend/postcss.config.mjs`
- Modify: `apps/frontend/app/globals.css`
- Create: `apps/frontend/components/ui/button.tsx` (via shadcn CLI)
- Create: `apps/frontend/lib/utils.ts`

- [ ] **Step 1: Install Tailwind v4 and PostCSS**

```bash
pnpm --filter frontend add tailwindcss@next @tailwindcss/postcss@next
pnpm --filter frontend add -D postcss
```

- [ ] **Step 2: Create `apps/frontend/postcss.config.mjs`**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 3: Run `shadcn init` FIRST — before writing custom CSS**

shadcn init generates its own `globals.css` and `components.json`. Run it first so we can override afterwards.

```bash
cd apps/frontend
pnpm dlx shadcn@latest init --defaults
cd ../..
```

When prompted (if not using `--defaults`): choose `Default` style, `slate` base color, CSS variables: yes.

Expected: `components.json`, `lib/utils.ts`, and a fresh `app/globals.css` are created/updated by shadcn.

- [ ] **Step 4: Overwrite `apps/frontend/app/globals.css` with Tailwind v4 + CSS variables**

Replace the shadcn-generated `globals.css` with the Tailwind v4 `@theme inline` pattern:

```css
@import "tailwindcss";

@theme inline {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
  }
}
```

- [ ] **Step 5: Verify `apps/frontend/lib/utils.ts` exists (created by shadcn init)**

```bash
cat apps/frontend/lib/utils.ts
```

Expected to contain `cn()` helper using `clsx` + `tailwind-merge`. If missing, create it:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Add Button component via shadcn CLI**

```bash
cd apps/frontend && pnpm dlx shadcn@latest add button && cd ../..
```

Expected: `apps/frontend/components/ui/button.tsx` created.

- [ ] **Step 7: Run frontend test — verify still passes**

```bash
pnpm --filter frontend test
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/
git commit -m "feat(frontend): add Tailwind v4 and shadcn/ui

shadcn init first, then Tailwind v4 @theme inline CSS variables override.
Button component added. Tests still passing.

Closes #1"
```

---

### Task 7: Environment files + `scripts/setup.sh`

**Files:**
- Create: `.env.example` (root, committed)
- Create: `apps/backend/.env` (gitignored — do not commit)
- Create: `apps/frontend/.env.local` (gitignored — do not commit)
- Create: `scripts/setup.sh`

- [ ] **Step 1: Create `.env.example` at repo root**

```bash
# Database (backend only)
DATABASE_URL=postgresql://YOUR_MAC_USERNAME@localhost:5432/testtrack_dev

# JWT secrets — change in production!
JWT_SECRET=change-me-access-secret
REFRESH_SECRET=change-me-refresh-secret

# Backend server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 2: Create `apps/frontend/.env.example`**

```bash
# Frontend public env vars (safe to expose in browser)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 3: Create local env files (never commit these)**

```bash
# Backend env
cp .env.example apps/backend/.env
# Replace YOUR_MAC_USERNAME with actual username:
sed -i '' "s/YOUR_MAC_USERNAME/$(whoami)/" apps/backend/.env

# Frontend env
cp apps/frontend/.env.example apps/frontend/.env.local
```

- [ ] **Step 4: Verify `.env` and `.env.local` are gitignored**

```bash
git check-ignore -v apps/backend/.env apps/frontend/.env.local
```

Expected: both files listed as ignored. If not, check root `.gitignore`.

- [ ] **Step 5: Create `scripts/setup.sh`**

```bash
#!/usr/bin/env bash
set -e

echo "🏰 Setting up Qamelot development environment..."

# 1. Check for Homebrew
if ! command -v brew &>/dev/null; then
  echo "❌ Homebrew not found. Install from https://brew.sh first."
  exit 1
fi

# 2. Install and start PostgreSQL
echo "📦 Installing PostgreSQL 16..."
brew install postgresql@16 2>/dev/null || true
brew services start postgresql@16
sleep 2  # Give postgres a moment to start
echo "✅ PostgreSQL started"

# 3. Create database (idempotent)
echo "🗄️  Creating database testtrack_dev..."
createdb testtrack_dev 2>/dev/null || echo "   Database already exists, skipping."

# 4. Copy env files if not present
if [ ! -f apps/backend/.env ]; then
  cp .env.example apps/backend/.env
  sed -i '' "s/YOUR_MAC_USERNAME/$(whoami)/" apps/backend/.env
  echo "📝 Created apps/backend/.env"
fi
if [ ! -f apps/frontend/.env.local ]; then
  cp apps/frontend/.env.example apps/frontend/.env.local
  echo "📝 Created apps/frontend/.env.local"
fi

# 5. Install dependencies
echo "📦 Installing pnpm dependencies..."
pnpm install

# 6. Build shared package
echo "🔨 Building @app/shared..."
pnpm --filter @app/shared build

# 7. Run Prisma migrations
# Note: uses 'migrate deploy' (applies existing SQL files).
# On a FRESH clone with no migration files yet, run:
#   cd apps/backend && pnpm exec prisma migrate dev --name init && cd ../..
echo "🗄️  Applying database migrations..."
pnpm --filter backend exec prisma migrate deploy

echo ""
echo "✅ Qamelot is ready! Run: pnpm dev"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API docs: http://localhost:3001/api/docs"
```

- [ ] **Step 6: Make setup.sh executable**

```bash
chmod +x scripts/setup.sh
```

- [ ] **Step 7: Commit**

```bash
git add .env.example apps/frontend/.env.example scripts/setup.sh
git commit -m "chore: add env examples and setup.sh

setup.sh bootstraps local dev: PostgreSQL via Homebrew, creates DB,
installs deps, runs migrations. Frontend and backend env vars separated.

Closes #1"
```

---

### Task 8: Root ESLint + final verification

**Files:**
- Create: `.eslintrc.js` (root)

- [ ] **Step 1: Create root `.eslintrc.js`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': 'error',
  },
  ignorePatterns: [
    'dist/',
    '.next/',
    'node_modules/',
    'coverage/',
    '**/*.config.js',
    '**/*.config.mjs',
  ],
};
```

- [ ] **Step 2: Install root ESLint dependencies**

```bash
pnpm add -D -w @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint
```

- [ ] **Step 3: Run typecheck across all workspaces**

```bash
pnpm typecheck
```

Expected: Zero type errors. Fix any that appear before continuing.

- [ ] **Step 4: Run lint**

```bash
pnpm lint
```

Expected: Zero lint errors. Fix any that appear before continuing.

- [ ] **Step 5: Run all tests**

```bash
pnpm test
```

Expected:
- Backend (Jest): `AppController › health › should return status ok ✓`
- Backend (Jest): `PrismaService › should be defined ✓`
- Frontend (Vitest): `Home page › renders the app name ✓`

- [ ] **Step 6: Start dev servers — final smoke test**

Ensure PostgreSQL is running and `apps/backend/.env` has a valid `DATABASE_URL`, then:

```bash
pnpm dev
```

In a second terminal, verify:

```bash
# Health check (no global prefix — mounted at root)
curl http://localhost:3001/health
# Expected: {"status":"ok","app":"qamelot"}

# Swagger UI
open http://localhost:3001/api/docs

# Frontend
open http://localhost:3000
# Expected: page renders "Qamelot" heading
```

Stop dev server with `Ctrl+C`.

- [ ] **Step 7: Final commit**

```bash
git add .eslintrc.js package.json pnpm-lock.yaml
git commit -m "chore: add root ESLint and verify full stack

pnpm dev, pnpm test, pnpm typecheck, pnpm lint all pass.
Monorepo foundation complete.

Closes #1"
```

---

## Summary

When this plan is complete you will have:

| ✅ | What |
|---|---|
| | `pnpm dev` starts backend (`0.0.0.0:3001`) + frontend (`0.0.0.0:3000`) |
| | `GET /health` → `{"status":"ok","app":"qamelot"}` |
| | `GET /api/docs` → Swagger UI |
| | `http://localhost:3000` → renders "Qamelot" |
| | `pnpm test` → all backend + frontend tests pass |
| | `pnpm typecheck` → zero errors |
| | `pnpm lint` → zero errors |
| | Prisma connected to PostgreSQL, User model + migration committed |
| | `packages/shared` exports `Role`, `UserDto`, `BaseEntity`, `ROLES_KEY` |
| | `scripts/setup.sh` bootstraps a fresh machine |
| | `.env.example` + `apps/frontend/.env.example` committed; real `.env` files gitignored |
| | shadcn/ui + Tailwind v4 scaffolded (init first, then CSS override) |

**Next plan:** Plan 2 — Auth (JWT login/register, guards, roles, frontend auth screens)
