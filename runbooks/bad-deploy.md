# Runbook: bad deploy / feature flag (checkout-api)

## Signals
- Errors start within minutes after a deploy (`deploy finished` log line, `get_deploys`).
- The errors are limited to one segment (currency, route, path such as `fast-checkout`) while the rest stays 200.
- A flag or code path changed in that deploy (`config loaded` shows the new flag value).

## Diagnose (read-only)
1. Line up the first error with the deploy time and the `config loaded` line.
2. Compare the failing segment with the healthy one (e.g. `http_5xx_rate_eur` vs `http_5xx_rate_usd`).
3. Rule out noise that was already there before the deploy (cron warnings, known slow jobs).

## Proposed actions (a human executes; the agent only proposes)
- A. Turn the flag off via PR/MR to `config/prod.env` (preferred when a flag guards the new path). Needs a named approver.
- B. Roll back the deploy. Owner: on-call.
- Never: hot-patch prod, restart services to "see if it helps", disable flags directly in prod.
