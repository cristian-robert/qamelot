---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/*.spec.tsx"
  - "**/*.test.tsx"
  - "apps/backend/test/**"
---

# Testing Rules

## YOU MUST: Tests before implementation
Invoke `superpowers:test-driven-development` at the start of every feature or bugfix.
Write the failing test first. Then implement. Then make it pass.

---

## Backend — NestJS (Jest)
- Unit tests: `*.spec.ts` co-located alongside source file
- E2E tests: `apps/backend/test/*.e2e-spec.ts`
- Test every service method — mock Prisma client with `jest.fn()`
- Test every controller endpoint — use NestJS `TestingModule`
- Minimum coverage target: **80%** (enforced in Jest config)
- Use `beforeEach` to reset mocks — never share mutable state between tests

## Frontend — Next.js (Vitest + Testing Library)
- Test every custom hook with `renderHook`
- Test critical user flows: test run execution, case editor, login
- NEVER test implementation details — test what the user sees and does
- Use `screen.getByRole` and accessible queries — never `getByTestId` as first choice

---

## NEVER
- NEVER skip writing tests to "save time" — it costs more time later
- NEVER use `test.skip` or `it.skip` without a comment explaining the blocker
- NEVER mock the thing you are testing
- NEVER assert on implementation details (internal state, private methods)

## Before claiming done
YOU MUST run and confirm passing output for:
```bash
pnpm test           # all tests pass
pnpm typecheck      # zero type errors
pnpm lint           # zero lint errors
```
NEVER invoke `superpowers:verification-before-completion` without evidence of passing output.
