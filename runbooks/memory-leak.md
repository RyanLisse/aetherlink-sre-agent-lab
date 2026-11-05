# Runbook: memory leak after a deploy (checkout-api)

## Signals
- Log: `OOMKilled` with `heap_mb` at `limit_mb`, then `container restarted`.
- Metric: `heap_mb` rises in a straight line after a deploy and drops only at a restart; `restarts_total` climbs in steps.
- The rise does not follow `rps`: heap also grows when traffic is low.

## Diagnose (read-only)
1. Find the first deploy before the first rise of `heap_mb` (`get_deploys`, `get_metrics`).
2. Read the `config loaded` line of that deploy: look for caches or buffers without a limit (no TTL, no max entries).
3. Compare the heap slope at low and at peak traffic. Same slope = a leak, not load.

## Proposed actions (a human executes; the agent only proposes)
- A. Roll back the deploy that started the leak. Owner: on-call.
- B. PR/MR that adds a TTL and a maximum size to the cache. Needs a named approver.
- Never: raise the memory limit to hide the leak, restart pods on a timer, change prod directly.
