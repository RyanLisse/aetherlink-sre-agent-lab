---
name: fix-ci
description: Reproduce failing CI checks locally, find the first actionable error and apply focused fixes until the local CI commands are green. Use when CI is red on the current branch or PR/MR.
disable-model-invocation: true
---

# Fix CI (lab version: local only)

<!-- Lab change vs the pack (Cursor team-kit port, MIT): no `gh pr checks` / remote logs (network), no push.
     The CI in this repo is fully offline, so it is reproduced locally with the same commands. A human can paste a
     remote log into docs/ci/<name>.log if the failure only shows up in CI. -->

## Context

- The CI commands (same in `.github/workflows/ci.yml` and `.gitlab-ci.yml`): `npm test`, `npm run test:hooks`, `npm run eval`, `npm run check:approval`
- If the user saved a CI log under `docs/ci/`, read it first.

## Workflow

1. Run the CI commands in order; stop at the first failure.
2. Extract the first actionable error (test name, assertion, file:line).
3. Apply the smallest safe fix. Never weaken an eval or a hook test to make it pass ("fix the diagnosis, not the eval").
4. Re-run, repeat until green or blocked on human input.
5. `check:approval` failing on a `fix/*` branch is not a code bug: a named human must run `npm run approve`. Say so and stop.
6. Do not push. The human pushes after the gate; CI then re-runs.

## Guardrails

- One actionable failure at a time
- Prefer low-risk fixes before refactors
- Never bypass or edit hooks, `.claude/` or `approvals/`

## Output

- Primary failing command + root error
- Fixes applied (iteration order)
- Current local status + next action (and who does it)
