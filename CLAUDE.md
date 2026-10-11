# SRE agent lab (sample data only)

@intent.md

## Commands
- Test MCP + evals + skill scanner: `npm test` (all green)
- Guard + progress hooks: `npm run test:hooks` (all ok)
- Evals: `npm run eval` (every good fixture PASS, every bad fixture REJECTED); one diagnosis: `npm run eval -- docs/diagnoses/<incident>.json`
- Incidents built: inc-001-db-pool, inc-002-bad-deploy, inc-004-upstream-timeout (inc-003, inc-005 = stretch, see docs/stretch-incidents.md)

## Rules
- Data comes only from the `sre` MCP server (sample files). No network. No secrets.
- You diagnose and propose. You never execute a runbook, restart, deploy, push, merge or approve. A push needs a named human approval (`approvals/`), and the human does the push and the PR (GitHub) or MR (GitLab).
- Write only to `docs/diagnoses/`, `docs/verify/`, `docs/show-me/` and `docs/pr/` (and `app/` on a `fix/*` branch, as a PR/MR). SDLC artefacts (intent, spec, plan, eval cases) need a human confirmation per edit.
- The progress hook exclusively updates the `AUTO:START` to `AUTO:END` block in `progress.md`. Do not edit that block. The participant appends verified historical entries to the Build log.

## Verifying your work
Run `npm run eval -- docs/diagnoses/<incident>.json` before reporting; paste the output. If it fails, fix the diagnosis, not the eval.
