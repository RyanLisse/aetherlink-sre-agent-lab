# fix: restore DB_POOL_MAX=20 (inc-001)

**Why:** deploy d-0142 cut the DB pool from 20 to 5, which caused the 503s in inc-001.

**Note:** approved by `facilitator-example` in `approvals/approvals.jsonl`; `npm run eval` PASS for `docs/diagnoses/inc-001.json`.

```diff
-DB_POOL_MAX=5
+DB_POOL_MAX=20
```
