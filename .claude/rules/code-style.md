---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "apps/backend/src/**"
  - "apps/frontend/app/**"
  - "packages/shared/src/**"
---

# Code Style

## TypeScript
- Strict mode always (`"strict": true` in every tsconfig)
- NEVER use `any` — use `unknown` with type guards, or a proper type
- All shared domain types → `packages/shared/src/types/`
- All Zod schemas → `packages/shared/src/schemas/`
- Import shared types as: `import { TestCase } from '@app/shared'`
- Prefer `const` over `let`; never use `var`

## NestJS (`apps/backend`)
- One module per domain entity: `controller` + `service` + `module` file
- Controllers are thin — no business logic, only call service methods
- Services own ALL business logic
- DTOs use `class-validator` decorators (`@IsString()`, `@IsEnum()`, etc.)
- ALL endpoints documented with `@ApiOperation()` + `@ApiResponse()` (Swagger)
- Auth via Guards (`JwtAuthGuard`, `RolesGuard`) — never inline role checks
- NEVER put business logic in controllers or modules
- Use NestJS `Logger` — NEVER `console.log`

## Next.js 16 (`apps/frontend`)
- App Router only — never touch `pages/` directory
- Server Components by default — only add `'use client'` when required
- `'use client'` is required for: event handlers, browser APIs, hooks, Tanstack Query
- Data fetching → Server Components via `fetch()` with explicit cache options
- Mutations → Tanstack Query `useMutation` — never raw `fetch` inside components
- Forms → React Hook Form + Zod schema imported from `@app/shared`
- Invoke `react-best-practices` skill when editing any `.tsx` file
- Invoke `frontend-design` skill when building any UI — pages, layouts, or components
- Invoke `nextjs` skill for routing, layouts, or Server Component patterns

## General
- Max file length: **300 lines** — split into focused modules if larger
- Max function length: **50 lines** — extract helpers if larger
- NEVER leave `console.log` in committed code
- NEVER hardcode URLs, ports, DB credentials — always use env vars
- NEVER duplicate types — define once in `packages/shared`, import everywhere
