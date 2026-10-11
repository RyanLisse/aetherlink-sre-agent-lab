# Verdict: VERIFIED

Claim: `npm run eval` rejects a diagnosis that cites a non-existent log id.
- Baseline: `evals/fixtures/inc-001.good.json` → PASS.
- Treatment: same file with one `log_id` changed to `L9999` → REJECTED (`invented evidence L9999`).
The test can fail, so it is evidence.
