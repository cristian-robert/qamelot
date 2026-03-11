# Security Rules

## Authentication
- JWT stored in **httpOnly cookies only** — NEVER localStorage or sessionStorage
- Access token TTL: **15 minutes**
- Refresh token TTL: **7 days**
- All routes protected by `JwtAuthGuard` by default
- Public routes must be explicitly decorated with `@Public()`
- Role hierarchy: `ADMIN` > `LEAD` > `TESTER` > `VIEWER`
- Role enforcement via `RolesGuard` — NEVER inline role checks in services

## Input Validation
- ALL incoming DTOs validated with `class-validator` (NestJS `ValidationPipe` global)
- ALL frontend form inputs validated with Zod schemas from `@app/shared`
- NEVER trust client-provided IDs without verifying ownership in the service layer

## NEVER
- NEVER commit `.env`, `.env.local`, or any secrets to git
- NEVER log passwords, tokens, API keys, or PII — ever
- NEVER return password hashes in API responses
- NEVER use `eval()`, `new Function()`, or dynamic `require()`
- NEVER disable CORS globally — configure allowed origins explicitly
- NEVER skip `ValidationPipe` on any controller
- NEVER store sensitive data in Next.js `localStorage` or cookies without `httpOnly`

## Secrets Management
- All secrets in `.env` files — these are gitignored
- `.env.example` committed with placeholder values only — never real values
- Database URL pattern: `postgresql://user:password@localhost:5432/testtrack_dev`
- Reference env vars via `process.env.VAR_NAME` — never hardcode

## Dependency Safety
- Run `pnpm audit` when adding new dependencies
- NEVER add a dependency without understanding what it does
