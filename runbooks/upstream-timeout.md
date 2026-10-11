# Runbook: upstream timeout / retry storm (checkout-api → psp-sandbox)

## Signals
- Log: `upstream timeout` with `after_ms` equal to `PSP_TIMEOUT_MS`, followed by `retrying psp call`.
- Metric: `psp_latency_p95_ms` jumps; `psp_requests_per_s` rises to a multiple of `rps` (retries amplify load).
- Our own resources are healthy (`db pool ok`, `db_pool_in_use` flat).

## Diagnose (read-only)
1. Find the first degraded upstream signal (health probe, p95) and the first timeout.
2. Check every deploy in the window: did it change runtime config or code? A docs-only deploy is not a cause.
3. Compare `rps` (incoming) with `psp_requests_per_s` (outgoing) to see the retry multiplier.

## Proposed actions (a human executes; the agent only proposes)
- A. PR/MR: `PSP_CIRCUIT_BREAKER=true` and `PSP_RETRIES=1` in `config/prod.env`. Needs a named approver.
- B. On-call informs the PSP vendor (human, outside the lab).
- Never: roll back an unrelated deploy, raise timeouts blindly, restart checkout-api.
