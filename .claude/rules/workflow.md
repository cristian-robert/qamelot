# Development Workflow

## IMPORTANT: Every task MUST start from a GitHub issue. No exceptions.

---

## Trigger: "start working on issue X"

YOU MUST follow these steps in order:

### 1. Read the issue
```bash
gh issue view X
```
Understand description, acceptance criteria checklist, labels, and milestone.

### 2. Create isolated branch — invoke `superpowers:using-git-worktrees`
Branch off `main`. Name per `.claude/rules/git.md`.

### 3. Write implementation plan — invoke `superpowers:writing-plans`
Save to `docs/plans/issue-X-slug.md` and commit before writing any code.

### 4. Develop — invoke `superpowers:executing-plans`
- Independent subtasks → invoke `superpowers:dispatching-parallel-agents`
- Complex multi-file features → invoke `superpowers:subagent-driven-development`
- Tests FIRST → invoke `superpowers:test-driven-development`
- If blocked → invoke `superpowers:systematic-debugging` then `bug-detective:bug-detective`
- Library docs → ALWAYS invoke `context7-plugin:docs` before assuming any API

### 5. Domain skills — invoke when entering these areas:
| Area | Skill |
|---|---|
| Any `.tsx` file | `react-best-practices` |
| Next.js routing / Server Components | `nextjs` |
| New UI components | `shadcn-ui-expert` |
| New UI screens / design | `frontend-design` or `ui-ux-pro-max:ui-ux-pro-max` |
| Tailwind setup / config | `tailwind-v4-shadcn` |
| Database schema changes | `postgresql-table-design` + `postgresql-expert` |
| New NestJS module | `backend-architect:backend-architect` |
| Third-party API integration | `api-integration-specialist` |

### 6. Pre-review gate — YOU MUST do this before claiming done
1. Invoke `superpowers:verification-before-completion` — run `pnpm test` + `pnpm typecheck` + `pnpm lint`, confirm output
2. Invoke `simplify` — review changed code for quality and redundancy
3. NEVER claim work is complete without evidence from these two steps

### 7. Code review
1. Invoke `superpowers:requesting-code-review`
2. Invoke `code-review:code-review`
3. Apply feedback → invoke `superpowers:receiving-code-review`
4. Re-run pre-review gate if changes were made

### 8. Finish branch
1. Invoke `superpowers:finishing-a-development-branch`
2. Invoke `commit-commands:commit-push-pr`

---

## Trigger: "add issue: [description]" or "I found a new issue"

Create GitHub issue immediately — do not defer:
```bash
gh issue create \
  --title "..." \
  --body $'## Description\n...\n\n## Acceptance Criteria\n- [ ] ...\n\n## Technical Notes\n...' \
  --label "..." \
  --milestone "..."
```

**Labels**: `frontend` · `backend` · `database` · `auth` · `bug` · `enhancement` · `chore`

---

## Trigger: New project area / major new feature

YOU MUST invoke `superpowers:brainstorming` FIRST.
No design, no code, no plan until brainstorming is complete and design is approved.
Then invoke `superpowers:writing-plans`, then create GitHub issues from the plan.

---

## Trigger: Research needed

ALWAYS invoke `context7-plugin:docs` before assuming how any library works.
NEVER guess at API signatures, configuration options, or library behavior.
