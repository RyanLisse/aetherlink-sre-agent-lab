# Review instructions (AI pass + human gate)

## Passes
- Correctness: root cause follows from cited evidence; ruled-out hypotheses are real.
- Safety: no execution, no network, no secrets, writes only in allowed paths, approval present for any push.
- Compliance: matches incident-triage skill, runbook style, intent.md boundary.

## Important vs nit
Important = would mislead on-call, execute something, or leak data. Wording is a nit (max 5).

## The gate
Findings never approve. A named human approves via branch protection and `scripts/approve.sh`.
