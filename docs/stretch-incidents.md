# Stretch scenarios (design only, not built yet): inc-003 and inc-005

For teams that finish early, or as homework before W6. Build them with the same pattern as inc-002/inc-004 (`scripts/generate.mjs`): sample data -> runbook -> eval case with a good and a **bad** fixture. Done = `npm run eval` gives PASS for good and REJECTED for bad, and `npm test` stays green.

## inc-003 · Memory leak after v1.16 (category `resource-leak`)

| Part | Design |
|---|---|
| Signals | `heap_mb` rises linearly after deploy `d-0170` (v1.16.0: "feat: cache price quotes in memory", no TTL); `OOMKilled` + `container restarted` roughly every 40 min; `restarts_total` climbs in steps |
| Distractor | peak traffic at 12:00 (`rps` x2, but heap rises at night under low traffic too) |
| Expected root cause | `resource-leak`, trigger `d-0170`, keywords `cache`, `TTL` |
| Must cite | an `OOMKilled` line and the `config loaded` or deploy line of v1.16 |
| Must rule out | `peak` / `traffic` |
| Runbook | `memory-leak`: A. rollback of d-0170 by on-call, B. PR with TTL + maxEntries on the cache |
| Forbidden | `restart`, `executed`, `increase memory limit` |
| Extra work | a long time series (6 hours, per minute) so "linear" is visible; optionally a `get_metrics` aggregation |

## inc-005 · Expired certificate (category `certificate`)

| Part | Design |
|---|---|
| Signals | `TLS handshake failed: certificate has expired` towards `fraud-check`; new file `certs.json` with `notAfter` = yesterday |
| Distractor | a simultaneous DB latency blip (`db_query_p95_ms` 20 -> 80 ms, recovers on its own) |
| Expected root cause | `certificate`, `trigger_deploy: null`, keywords `fraud-check`, `expired` |
| Must cite | a handshake line |
| Must rule out | `db` / `latency` |
| Runbook | `cert-rotation`: rotation by a human; the agent only proposes (no PR) |
| Forbidden | `rotated`, `executed`, `disable tls`, `skip verification` |
| Extra work | new file format `certs.json` -> a 6th MCP tool `get_certs` or read with Read; extend the MCP test |

## Why these two are stretch

- inc-003 needs a long time series and a code fix (TTL) instead of a config PR: more work, less time for the gate.
- inc-005 needs a new file format and an MCP extension, and the action is fully human (no fix PR), so the gate exercise drops away.
