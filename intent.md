# Intent: SRE triage agent for checkout-api (sample)
Author: Team Demo (facilitator example). Status: accepted after PR review.

## Problem
On-call spends the first 20 minutes of every page collecting logs, metrics and deploys before they can start thinking about the cause.

## Proposed outcome
Within 2 minutes of an alert, a diagnosis is ready for a human: root cause category, the triggering deploy (or none), at least two cited log lines with literal quotes, two ruled-out hypotheses, and exactly one proposed runbook step.
Success checks: `npm run eval` PASSes on every built incident; a diagnosis that cites a non-existent log id is REJECTED.

## Affected users and systems
On-call engineers and the reviewer who approves the fix. Systems: checkout-api (demo) and its sample incidents, read through the local read-only `sre` MCP server.

## Constraints
- Read-only: the agent never executes a runbook step, never pushes, never merges (`executes: false` is a type, not a promise).
- No network and no secrets; sample data only.
- Any push or PR/MR needs a named human approval (`npm run approve`), enforced by the guard hook.
- Control loop: set point = cited diagnosis within 2 minutes; sensor = MCP tools; actuator = a human with a PR/MR; dampener = evals in CI + the hook.

## Open questions
- OPEN: how many incident types must pass before we trust it on a new one?
