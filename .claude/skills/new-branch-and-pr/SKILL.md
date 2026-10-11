---
name: new-branch-and-pr
description: Create a fresh fix/* branch from local main, finish the work, commit, then hand over to the human gate for push and PR (GitHub) or MR (GitLab).
argument-hint: "[branch-slug or short goal]"
disable-model-invocation: true
---

# New branch and PR/MR (lab version: human gate)

<!-- Lab change vs the pack (Cursor team-kit port, MIT): no `gh`, no `git fetch/pull`, no push, no PR creation by the
     agent. Works for GitHub (PR) and GitLab (MR): a named human approves, pushes and opens it. -->

Goal / hint: $ARGUMENTS

## Workflow

1. Ensure the working tree is clean (`git status --short`) or ask the user how to handle changes.
2. Create a descriptive branch from local main: `git switch -c fix/<slug>` (the user updates main themselves if needed).
3. Complete implementation and tests. Edits in `app/` ask for confirmation; that is expected.
4. Run `npm test`, `npm run test:hooks` and `npm run eval`; all must pass.
5. Commit focused changes (the commit asks for confirmation).
6. Stop. Do not push and do not open a PR/MR. Hand over with the exact steps for the human:
   - approval (own terminal, not via Claude): `npm run approve -- <name> fix/<slug> "<reason>"`
   - `git add -f approvals/approvals.jsonl approvals/audit.jsonl && git commit -m "approval: fix/<slug> by <name>"`
   - `git push -u origin fix/<slug>`
   - GitHub: `gh pr create --fill` · GitLab: `glab mr create --fill` (or use `/visual-pr` for the description)

## Guardrails

- One change set per branch
- Include verification notes (commands + results) in the handover
- Author commits as the repo's configured user; never invent co-authors

## Output

- Branch name
- PR/MR summary + test notes
- The human's next commands (above)
