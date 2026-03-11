# Git Rules

## Branch Naming Convention
```
feat/issue-{N}-{short-slug}    # new features
fix/issue-{N}-{short-slug}     # bug fixes
chore/issue-{N}-{short-slug}   # maintenance, deps, config
refactor/issue-{N}-{short-slug}
```
Example: `feat/issue-42-test-run-execution`

---

## Commit Format — Conventional Commits
```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

Closes #<issue-number>
```

**Types**: `feat` · `fix` · `chore` · `refactor` · `test` · `docs`
**Scopes**: `backend` · `frontend` · `shared` · `db` · `auth`

Example:
```
feat(backend): add test run execution endpoint

Implements POST /runs/:id/start and GET /runs/:id/stream (SSE)
for live result updates during test execution.

Closes #42
```

---

## NEVER
- NEVER push directly to `main` or `master` — always use a PR
- NEVER force push to `main` or `master`
- NEVER commit without a linked GitHub issue number in the message
- NEVER use `--no-verify` to skip hooks — fix the underlying issue
- NEVER commit `.env`, `.env.local`, or any file containing secrets
- NEVER amend published commits — create a new commit instead
- NEVER merge your own PR without a code review pass

---

## Pull Request Rules
- **Title format**: `[#N] Short imperative description`
- **Body must include**: Summary bullets, test plan checklist, `Closes #N`
- ALWAYS use `commit-commands:commit-push-pr` skill — never raw `gh pr create`
- PR must pass `pnpm test` + `pnpm typecheck` + `pnpm lint` before review
- Squash merge preferred to keep `main` history clean
