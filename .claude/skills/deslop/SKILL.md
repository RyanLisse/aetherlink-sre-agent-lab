---
name: deslop
description: Remove AI-generated code slop and clean up style in the current branch diff. Use for deslop, unslop, clean AI cruft, or tighten a diff without changing behavior.
disable-model-invocation: true
---

# Deslop / unslop (lab version)

<!-- Lab change vs the pack (Cursor team-kit port, MIT): no `!` context lines and no `git fetch`. The diff is taken
     against the LOCAL main branch, so nothing touches the network. -->

Clean AI-generated slop from the branch diff against the local `main`. Prefer behavior-preserving edits.

## Context (run these yourself)

- `git diff main...HEAD` (fall back to `git diff HEAD` on main)
- `git status --short`

## Focus

- Comments that restate the code or mismatch local style
- Defensive try/catch or null checks abnormal for trusted paths
- `any` / type escapes used only to silence the compiler
- Deep nesting that should be early returns
- Patterns inconsistent with neighboring code

## Guardrails

- Keep behavior unchanged unless fixing a clear bug
- Minimal focused edits; no drive-by rewrites
- Run `npm test` and `npm run eval` after editing; both must stay green
- Summarize in 1–3 sentences when done

## Output

- Files touched
- What slop was removed
- Anything left intentionally (with reason)
