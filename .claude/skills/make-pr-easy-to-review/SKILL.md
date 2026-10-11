---
name: make-pr-easy-to-review
description: Prepare a branch for review — better description, reviewer guidance, and a history-cleanup plan the human executes — without changing code behavior. Works for PRs (GitHub) and MRs (GitLab).
disable-model-invocation: true
---

# Make PR/MR easy to review (lab version: human gate)

<!-- Lab change vs the pack (Cursor team-kit port, MIT): no `gh`, no history rewrite or force-push by the agent.
     The agent writes the description and a cleanup plan; a human decides and executes. -->

Goal: reviewability without behavior changes.

## Workflow

1. Inspect locally: `git log main..HEAD --oneline`, `git diff main...HEAD --stat`, `git diff main...HEAD`.
2. Flag reviewability issues: noisy commits, stale description, mixed mechanical + logic changes, unclear entry points.
3. Write the reviewer guide to `docs/pr/<branch-with-dashes>.md` (or extend the `/visual-pr` file if it exists):
   - TL;DR matching the actual diff
   - Core files vs generated/mechanical files
   - Risk, rollout, test coverage (`npm test`, `npm run eval` results)
   - Approval status from `approvals/approvals.jsonl`
4. If history cleanup would help, write a plan only (suggested order: schema/API → core logic → wiring → tests) with the commands for the human, including `ORIGINAL_TREE=$(git rev-parse HEAD^{tree})` before and a tree comparison after. Never rewrite history or force-push yourself; pushing is gated by the hook and is the human's step.

## Guardrails

- Never hide behavior changes inside "cleanup"
- If the change is too large, recommend splitting instead of polishing around the problem

## Output

- Saved path of the reviewer guide
- Cleanup plan (if any) for the human
