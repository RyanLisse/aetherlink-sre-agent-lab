# Plan: diagnose inc-001 (accepted in plan mode)

## Files
- read: `incidents/inc-001-db-pool/*` via the `sre` MCP tools, `runbooks/db-pool-exhaustion.md`
- write: `docs/diagnoses/inc-001.json`, `docs/diagnoses/inc-001.md`

## Order
1. `list_alerts` → pick inc-001. 2. `get_deploys` → deploys in the window. 3. `get_logs` around the alert. 4. `get_metrics` for pool, PSP and Postgres. 5. Write the diagnosis. 6. `npm run eval -- docs/diagnoses/inc-001.json`.

## Risks
Blaming the PSP (it is noisy) or Postgres; citing a log id that does not exist.

## Proof (1 command per step)
`npm run eval -- docs/diagnoses/inc-001.json` → PASS.

## Rollback
Nothing to roll back: the agent only writes files under `docs/diagnoses/`.
