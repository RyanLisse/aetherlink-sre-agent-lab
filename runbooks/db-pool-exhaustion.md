# Runbook: DB connection pool exhaustion (checkout-api)

## Signals
- Log: `timeout acquiring db connection from pool`
- Metric: `db_pool_in_use` flat at the pool maximum while `rps` rises
- Postgres itself is healthy (`active` far below `max_connections`)

## Diagnose (read-only)
1. Compare `DB_POOL_MAX` in the latest `config loaded` log line with the previous deploy.
2. Check `get_deploys` for a config change in the window before the alert.

## Proposed actions (a human executes; the agent only proposes)
- A. Roll back the config change (preferred if a deploy changed the pool size). Owner: on-call.
- B. Raise `DB_POOL_MAX` back to 20 via PR to `config/prod.env`. Needs a named approver.
- Never: restart postgres, kill connections, change prod directly.
