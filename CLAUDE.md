# Qamelot — Test Management Platform

## WHY
Qamelot is an internal test management webapp (TestRail / HP ALM-like) for company use.
Colleagues discover and access the app over the local network via this machine's IP.

## WHAT
- **Monorepo**: pnpm workspaces
- **Backend**: `apps/backend` — NestJS + Prisma ORM + PostgreSQL (Homebrew)
- **Frontend**: `apps/frontend` — Next.js 16 App Router + shadcn/ui + Tailwind v4
- **Shared**: `packages/shared` — TypeScript types, DTOs, Zod schemas (used by both apps)
- **Network**: Backend binds `0.0.0.0:3001` · Frontend binds `0.0.0.0:3000`

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

## IMPORTANT: Workflow — Read Before Any Task
YOU MUST follow the GitHub Issues workflow defined below. No task begins without a GitHub issue.

@.claude/rules/workflow.md
@.claude/rules/git.md
@.claude/rules/code-style.md
@.claude/rules/testing.md
@.claude/rules/security.md
