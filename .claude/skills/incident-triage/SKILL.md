---
name: incident-triage
description: Incident triage policy. Use whenever diagnosing an alert, reading logs/metrics/deploys, or proposing a fix or runbook step for checkout-api.
---
# Incident triage policy (owner: SRE lead)

1. Start from the alert (`mcp__sre__list_alerts`), then logs, metrics and deploys for the alert window and 30 minutes before it.
2. Every claim cites a log line id (`L0021`) with a verbatim quote, or a metric name + timestamp. No citation = write it under `open`.
3. Rule out at least two other hypotheses, with the evidence that rules them out.
4. Propose one step from a runbook in `runbooks/`. Never execute it; set `executes: false` and name who must approve.
5. Output: `docs/diagnoses/<incident>.json` matching `evals/schema.ts`, plus a 5-line human summary in `docs/diagnoses/<incident>.md`.
6. Before you report done, run `npm run eval -- docs/diagnoses/<incident>.json` and paste the result.
