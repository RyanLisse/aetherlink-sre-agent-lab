# Spec: the diagnosis contract

The contract lives in `evals/schema.ts` (zod). A diagnosis that does not parse is rejected before any scoring.

## Fields of `Diagnosis`
- `incident`: the incident id, e.g. `inc-001-db-pool` (from `list_alerts`).
- `service`: the affected service from the alert (`checkout-api`).
- `root_cause.category`: one of the known categories (config-change, bad-deploy, upstream-dependency, ...).
- `root_cause.summary`: one or two sentences in plain language, naming the mechanism.
- `root_cause.trigger_deploy`: the deploy id from `get_deploys`, or `null` when no deploy caused it.
- `evidence[]`: `log_id` + a literal `quote` from that log line (`get_logs`). The eval checks both exist.
- `ruled_out[]`: at least two hypotheses with a reason grounded in metrics or logs.
- `proposed_action`: `runbook` name, one `step`, `executes: false` (literal), `needs_approval_from` (a named role).
- `confidence` and `open[]`: what is still unknown.

## Flagged concerns
- The agent never executes: `executes` must be literally `false`; words like "restarted" or "rolled back" are forbidden by the eval.
- A named human approves before anything leaves the laptop (hook + `approvals/approvals.jsonl` + CI `check:approval`).
