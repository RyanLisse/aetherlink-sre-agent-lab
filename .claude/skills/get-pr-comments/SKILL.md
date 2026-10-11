---
name: get-pr-comments
description: Summarize review comments on the active pull request (GitHub) or merge request (GitLab) into a prioritized action list, from a file the human exported.
disable-model-invocation: true
---

# Get PR/MR comments (lab version: no network)

<!-- Lab change vs the pack (Cursor team-kit port, MIT): the agent does not call `gh api` / `glab api` (network).
     The human exports the comments to a local file; the skill only reads that file. -->

## Context

Ask the human to export the comments first (in their own terminal), if `docs/pr/comments.md` does not exist yet:
- GitHub: `gh pr view --comments > docs/pr/comments.md`
- GitLab: `glab mr view --comments > docs/pr/comments.md`

## Workflow

1. Read `docs/pr/comments.md`.
2. Group comments by severity (correctness, safety, compliance, nits) using `REVIEW.md`.
3. Return a concise action list. Do not reply on the PR/MR and do not resolve threads: that is the human's call.

## Output

- Grouped feedback summary
- Action list (priority order)
- Open questions still needing clarification
