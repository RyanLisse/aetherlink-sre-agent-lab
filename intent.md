# Intent: SRE triage agent for checkout-api (sample)
Author: <team>. Status: draft.
## Problem
On-call spends the first 20 minutes of every page collecting logs, metrics and deploys before thinking.
## Proposed outcome
Within 2 minutes of an alert, a diagnosis with cited evidence and one proposed runbook step is ready for a human.
## Affected users and systems
On-call engineers; checkout-api (demo); sample incidents only.
## Constraints
Read-only. No network, no secrets. Never executes; any push needs a named human approval.
## Open questions
How many scenarios must pass before we trust it on a new incident type?
