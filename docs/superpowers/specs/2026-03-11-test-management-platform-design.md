# Design Spec: Qamelot — Test Management Platform
**Date**: 2026-03-11
**Status**: Approved

---

## 1. Project Overview

Qamelot is an internal test management web application (TestRail / HP ALM-like) for company use. Colleagues access it over the local network via the developer's MacBook IP. Future deployment target: Google Cloud Run.

### Goals
- Write and manage test plans, test suites, test cases, and test runs
- Track test execution results (Pass / Fail / Blocked / Retest / Untested)
- Milestone and defect tracking
- Reports: coverage, progress, activity
- Role-based access control for team members
- Real-time test run progress (nice to have — SSE)

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Monorepo | pnpm workspaces | Single repo, shared types, unified scripts |
| Backend | NestJS (TypeScript) | Type cohesion with frontend, fast DX, Swagger, SSE built-in |
| Backend Tests | Jest | NestJS-native, TestingModule support, broad ecosystem |
| ORM | Prisma | Type-safe queries, migration history, Cloud SQL compatible |
| Database | PostgreSQL (Homebrew) | Full ACID, concurrent users, production-ready locally |
| Frontend | Next.js 16 App Router | Server Components, latest features, App Router patterns |
| Frontend Tests | Vitest + Testing Library | Fast, Vite-native, compatible with Next.js 16 |
| UI Components | shadcn/ui + Tailwind v4 | High-quality accessible components, consistent design |
| Shared Types | packages/shared | Single TS domain model shared by backend + frontend |
| State (client) | Tanstack Query | Server state management, cache invalidation |
| Forms | React Hook Form + Zod | Validation from shared schemas |
| Charts | Recharts | Coverage + progress reports |
| Auth | JWT (httpOnly cookies) | Secure, stateless, no external provider needed for MVP |
| Real-time | SSE (Server-Sent Events) | Lightweight, sufficient for test run progress updates |
| Deployment (MVP) | Local (0.0.0.0) | Accessible on company network, no infra needed |
| Deployment (prod) | Google Cloud Run | Containers, auto-scale, Cloud SQL, low ops overhead |

---

## 3. Monorepo Structure

```
project-root/
├── apps/
│   ├── backend/                    NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── projects/
│   │   │   │   ├── test-suites/
│   │   │   │   ├── test-cases/
│   │   │   │   ├── test-plans/
│   │   │   │   ├── test-runs/
│   │   │   │   ├── test-results/
│   │   │   │   ├── milestones/
│   │   │   │   ├── defects/
│   │   │   │   └── reports/
│   │   │   └── sse/
│   │   └── prisma/
│   └── frontend/                   Next.js 16 (port 3000)
│       └── app/
│           ├── (auth)/
│           └── (dashboard)/
│               ├── projects/
│               ├── test-suites/
│               ├── test-runs/
│               └── reports/
├── packages/
│   └── shared/                     Shared TS types + Zod schemas
├── docs/
├── scripts/
│   └── setup.sh                    brew install + createdb
├── CLAUDE.md
├── .claude/
│   ├── rules/
│   └── settings.json
└── pnpm-workspace.yaml
```

---

## 4. Domain Model

```
User
  role: ADMIN | LEAD | TESTER | VIEWER

Project
  ├── Milestone[]
  ├── TestSuite[] (hierarchical tree)
  │   └── TestCase[]
  │       ├── steps: Json[]          [{action, expected}]
  │       ├── priority: CRITICAL | HIGH | MEDIUM | LOW
  │       ├── type: FUNCTIONAL | REGRESSION | SMOKE | ACCEPTANCE | EXPLORATORY
  │       └── automationFlag: Boolean
  └── TestPlan[]
      └── TestRun[]
          ├── assignedTo: User
          ├── milestone: Milestone?
          └── TestResult[]
              ├── status: PASSED | FAILED | BLOCKED | RETEST | UNTESTED
              ├── comment: String
              ├── elapsed: Int (seconds)
              └── defects: Defect[]
```

**Prisma notes:**
- Soft deletes (`deletedAt`) on Project, TestSuite, TestCase
- `@@index` on `projectId`, `runId`, `assignedTo` for query performance
- `createdAt` / `updatedAt` on all entities

---

## 5. Backend Design

- **REST API** with Swagger auto-docs at `/api/docs`
- **SSE endpoint**: `GET /runs/:id/stream` — live test result updates
- **Auth**: JWT access (15min) + refresh (7d) in httpOnly cookies
- **Guards**: `JwtAuthGuard` (global default) + `RolesGuard` per route
- **Validation**: Global `ValidationPipe` on all incoming DTOs
- **Module pattern**: thin controller → service (all logic) → Prisma repository

---

## 6. Frontend Design

- **App Router** — no Pages Router
- **Server Components** for initial data fetching (no loading spinners on first paint)
- **Client Components** only for interactivity (run execution, live SSE updates)
- **Tanstack Query** for mutations and cache invalidation
- **Key screens**:
  - Suite Tree + Case Editor (split-pane, TestRail-style)
  - Run Execution (table + Pass/Fail/Blocked buttons + SSE live updates)
  - Dashboard (open runs, pass rate, milestone countdown)
  - Reports (Recharts bar/pie + CSV export)

---

## 7. Development Workflow

### GitHub Issues → Branch → Dev → Review → PR

0. New feature area or project start → invoke `superpowers:brainstorming` FIRST
1. All work starts from a GitHub issue
2. Branch created via `superpowers:using-git-worktrees`
3. Implementation plan written via `superpowers:writing-plans`
4. Development via `superpowers:executing-plans` + domain skills
5. TDD enforced via `superpowers:test-driven-development`
6. Pre-review gate: `superpowers:verification-before-completion` + `simplify`
7. Code review: `superpowers:requesting-code-review` + `code-review:code-review` + `superpowers:receiving-code-review`
8. Merge: `superpowers:finishing-a-development-branch` + `commit-commands:commit-push-pr`

### 4-Layer Enforcement
| Layer | Mechanism | Scope |
|---|---|---|
| CLAUDE.md | Advisory, always loaded | Project-wide orientation |
| .claude/rules/ | Advisory, scoped by file path | Domain-specific guardrails |
| .claude/settings.json hooks | **Hard enforcement** | Blocks/runs on tool events |
| Skills | On-demand workflows | Task-specific depth |

### Hooks (hard enforcement)
- **Block**: direct push to main/master
- **Block**: `--no-verify` on commits
- **Block**: npm/yarn (enforce pnpm)
- **Auto-run**: prettier on `.ts/.tsx` after edit
- **Auto-run**: `tsc --noEmit` after editing source `.ts` files
- **Warn**: `console.log` found in staged files

---

## 8. Infrastructure

### Local (MVP)
- PostgreSQL via `brew services start postgresql@16`
- `scripts/setup.sh` responsibilities:
  1. `brew install postgresql@16`
  2. `brew services start postgresql@16`
  3. `createdb testtrack_dev`
  4. `pnpm install`
  5. `pnpm --filter backend exec prisma migrate deploy`
  6. `pnpm --filter backend exec prisma db seed` (optional)
- Apps bind to `0.0.0.0` — colleagues reach via `http://<mac-ip>:3000`

### Environment Variables
Required in `.env` (gitignored). Commit `.env.example` with placeholder values only:
```
DATABASE_URL=postgresql://user:password@localhost:5432/testtrack_dev
JWT_SECRET=your-access-token-secret
REFRESH_SECRET=your-refresh-token-secret
PORT=3001
FRONTEND_URL=http://localhost:3000
```
CORS `allowedOrigins` is set from `FRONTEND_URL` — never use `*` in production.

### Production (GCP — future)
- Cloud Run for backend + frontend containers
- Cloud SQL (PostgreSQL) — same Prisma schema, connection string swap
- Secret Manager for env vars
- Load Balancer + HTTPS

---

## 9. Skills Inventory (active for this project)

| Workflow stage | Skills |
|---|---|
| Research & design | `superpowers:brainstorming`, `context7-plugin:docs` |
| Planning | `superpowers:writing-plans` |
| Branch setup | `superpowers:using-git-worktrees` |
| Execution | `superpowers:executing-plans`, `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents` |
| TDD | `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `bug-detective:bug-detective` |
| Frontend | `nextjs`, `react-best-practices`, `shadcn-ui-expert`, `tailwind-v4-shadcn`, `frontend-design`, `ui-ux-pro-max:ui-ux-pro-max` |
| Backend/DB | `backend-architect:backend-architect`, `postgresql-expert`, `postgresql-table-design`, `api-integration-specialist` |
| Review | `superpowers:verification-before-completion`, `simplify`, `superpowers:requesting-code-review`, `code-review:code-review`, `superpowers:receiving-code-review` |
| Commit/PR | `superpowers:finishing-a-development-branch`, `commit-commands:commit-push-pr` |
| Safety | `hookify:hookify`, `analyze-codebase:analyze-codebase` |
