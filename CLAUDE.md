# Qamelot — Test Management Platform

## WHY
Qamelot is an internal test management webapp (TestRail / HP ALM-like) for company use.
Colleagues discover and access the app over the local network via this machine's IP.

## WHAT
- **Monorepo**: pnpm workspaces
- **Backend**: `apps/backend` — NestJS + Prisma ORM + PostgreSQL (Homebrew)
- **Frontend**: `apps/frontend` — Next.js 16 App Router + shadcn/ui + Tailwind v4
- **Shared**: `packages/shared` — TypeScript types, DTOs, Zod schemas (used by both apps)
- **Network**: Backend binds `0.0.0.0:5002` · Frontend binds `0.0.0.0:5003`

## HOW — Key Commands
```bash
brew services start postgresql@16   # start local DB
pnpm install                        # ALWAYS use pnpm — never npm or yarn
pnpm dev                            # start all apps concurrently
pnpm --filter backend dev           # backend only
pnpm --filter frontend dev          # frontend only
pnpm test                           # run all tests
pnpm typecheck                      # tsc --noEmit across all apps
pnpm lint                           # eslint across all apps
```

## CRITICAL: Backend-Frontend Integration Rules

### Rule 1: ALWAYS verify backend API before building frontend
Before writing ANY frontend API client code or React Query hook:
1. Read the actual backend controller (`apps/backend/src/<module>/<module>.controller.ts`) to see EVERY endpoint
2. Read the backend DTO (`apps/backend/src/<module>/dto/`) to see request/response shapes
3. Read the backend service to understand business logic and error cases
4. Cross-reference with `packages/shared` types to ensure the frontend types match

**Why:** We had missing API methods (step CRUD, case copy/move) because the frontend was built from old templates without checking the actual backend. This caused features to silently not work.

### Rule 2: ALWAYS check database migration state before and after schema changes
Before starting work that touches the database:
```bash
cd apps/backend && npx prisma migrate status
```
If there are pending or mismatched migrations, fix them FIRST. After any schema change:
```bash
npx prisma migrate dev --name <description>
npx prisma generate
```
**Why:** We had a 500 error because `TestRun.configLabel` column was in the Prisma schema but missing from the actual database. The migration was recorded as applied but the ALTER TABLE never ran.

### Rule 3: ALWAYS test the actual API call, not just the type
When building a frontend feature that calls the backend:
1. Verify the backend is running (`curl http://localhost:5002/health`)
2. Check that the endpoint actually works with a manual test or the Swagger docs at `/api/docs`
3. Check backend terminal logs for errors after testing

**Why:** Type-checking passes even when the database is missing columns, the API sends wrong parameters, or the backend throws unhandled errors.

### Rule 4: Frontend API client must cover ALL backend endpoints
When creating or updating `lib/api/*.ts` files, cross-reference the backend controller to ensure 100% coverage. Use this checklist:
- [ ] Every `@Get`, `@Post`, `@Patch`, `@Delete` in the controller has a matching frontend method
- [ ] Sub-resource endpoints (e.g., steps under cases) are included
- [ ] Query parameters match what the backend expects
- [ ] Request body shape matches the backend DTO

### Rule 5: Database commands reference
```bash
# Check migration status
cd apps/backend && npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name <description>

# Force-sync schema to DB (dev only, bypasses migrations)
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (DB browser)
npx prisma studio
```

## IMPORTANT: Workflow — Read Before Any Task
YOU MUST follow the GitHub Issues workflow defined below. No task begins without a GitHub issue.

@.claude/rules/workflow.md
@.claude/rules/git.md
@.claude/rules/code-style.md
@.claude/rules/testing.md
@.claude/rules/security.md
