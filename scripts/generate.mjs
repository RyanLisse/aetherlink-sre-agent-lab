#!/usr/bin/env node
// Reproducible sample data for inc-002, inc-003 and inc-004 (seeded, no network). inc-001 is hand-written and left untouched.
// Writes incidents/<id>/{alert.json,logs.jsonl,metrics.csv,deploys.json}, evals/cases/<id>.json and good/bad fixtures.
// inc-003 gets data and fixtures but no eval case: writing evals/cases/inc-003.json is the Maintain exercise.
// Usage: node scripts/generate.mjs        (re-running gives byte-identical output)
import { mkdirSync, writeFileSync } from "node:fs";

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const iso = (d) => d.toISOString().replace(".000Z", "Z");
const at = (day, hh, mm, ss = 0) => new Date(Date.UTC(2026, 9, day, hh, mm, ss));
const plus = (d, s) => new Date(d.getTime() + s * 1000);
const json = (o) => JSON.stringify(o, null, 1) + "\n";

function build(id, lines) {
  lines.sort((a, b) => a.ts.localeCompare(b.ts) || a._o - b._o);
  return lines.map((l, i) => { const { _o, ...rest } = l; return { id: `L${String(i + 1).padStart(4, "0")}`, ...rest }; });
}
function write(id, { alert, logs, metrics, deploys }) {
  const dir = `incidents/${id}`; mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/alert.json`, json(alert));
  writeFileSync(`${dir}/logs.jsonl`, logs.map((l) => JSON.stringify(l)).join("\n") + "\n");
  writeFileSync(`${dir}/metrics.csv`, "ts,metric,value\n" + metrics.map((m) => `${m[0]},${m[1]},${m[2]}`).join("\n") + "\n");
  writeFileSync(`${dir}/deploys.json`, json(deploys));
}
const ids = (logs, pred) => logs.filter(pred).map((l) => l.id);

// ---------- inc-002: bad deploy behind a feature flag (EUR only) ----------
{
  const r = rng(2002); const L = []; let o = 0; const add = (ts, f) => L.push({ ts: iso(ts), service: "checkout-api", ...f, _o: o++ });
  const deployAt = at(12, 9, 20);
  add(at(12, 9, 15), { service: "report-cron", level: "warn", msg: "cron job exceeded schedule window", job: "nightly-sales-report", duration_s: 1840 });
  add(deployAt, { level: "info", msg: "deploy started", version: "1.15.0", deploy_id: "d-0151" });
  add(plus(deployAt, 31), { level: "info", msg: "config loaded", DB_POOL_MAX: 20, FEATURE_FAST_CHECKOUT: true, PSP_RETRIES: 3 });
  add(plus(deployAt, 60), { level: "info", msg: "deploy finished", version: "1.15.0", deploy_id: "d-0151" });
  const cur = ["EUR", "USD", "GBP"];
  for (let t = at(12, 9, 0, 10), i = 0; t < at(12, 9, 40); t = plus(t, 20), i++) {
    const c = cur[i % 3]; const fast = t > plus(deployAt, 60);
    if (fast && c === "EUR") {
      add(t, { level: "error", msg: "TypeError: Cannot read properties of undefined (reading 'currency')", at: "fastCheckout.totals (app/checkout/fast.ts:42)", currency: "EUR", path: "fast-checkout" });
      add(plus(t, 1), { level: "error", msg: "POST /checkout 500", currency: "EUR", path: "fast-checkout", latency_ms: 40 + Math.round(r() * 20) });
    } else add(t, { level: "info", msg: "POST /checkout 200", currency: c, path: fast ? "fast-checkout" : "classic", latency_ms: 90 + Math.round(r() * 60) });
  }
  add(at(12, 9, 25), { service: "report-cron", level: "warn", msg: "cron job exceeded schedule window", job: "nightly-sales-report", duration_s: 1840 });
  add(at(12, 9, 27, 30), { level: "info", msg: "db pool ok", active: 8, max: 20 });
  const logs = build("inc-002", L);
  const M = [];
  for (let t = at(12, 9, 0); t <= at(12, 9, 40); t = plus(t, 60)) {
    const after = t >= at(12, 9, 21);
    M.push([iso(t), "http_5xx_rate", (after ? 30 + r() * 4 : 0.2 + r() * 0.2).toFixed(2)]);
    M.push([iso(t), "http_5xx_rate_eur", (after ? 97 + r() * 3 : 0.2 + r() * 0.3).toFixed(2)]);
    M.push([iso(t), "http_5xx_rate_usd", (0.2 + r() * 0.2).toFixed(2)]);
    M.push([iso(t), "rps", Math.round(42 + r() * 6)]);
    M.push([iso(t), "db_pool_in_use", Math.round(6 + r() * 3)]);
    M.push([iso(t), "cron_job_duration_s", 1840]);
  }
  write("inc-002-bad-deploy", {
    alert: { id: "ALERT-2026-1012-002", incident: "inc-002-bad-deploy", service: "checkout-api", severity: "P2", fired_at: "2026-10-12T09:24:00Z", rule: "http_5xx_rate > 2% for 3m", value: "31.4%", summary: "checkout-api 5xx rate above threshold", dashboard: "local://metrics/checkout-api" },
    logs, metrics: M,
    deploys: [
      { deploy_id: "d-0150", service: "checkout-api", version: "1.14.1", at: "2026-10-11T16:30:00Z", by: "ci", changes: ["fix: config/prod.env DB_POOL_MAX 5 -> 20 (inc-001)"] },
      { deploy_id: "d-0151", service: "checkout-api", version: "1.15.0", at: "2026-10-12T09:20:00Z", by: "ci", changes: ["feat: fast checkout v2 totals (multi-currency)", "config: FEATURE_FAST_CHECKOUT false -> true"] },
    ],
  });
  const cfg = ids(logs, (l) => l.msg === "config loaded"); const te = ids(logs, (l) => l.msg.startsWith("TypeError")); const cron = ids(logs, (l) => l.service === "report-cron");
  mkdirSync("evals/cases", { recursive: true }); mkdirSync("evals/fixtures", { recursive: true });
  writeFileSync("evals/cases/inc-002.json", json({
    incident: "inc-002-bad-deploy",
    expected: { category: "bad-deploy", service: "checkout-api", trigger_deploy: "d-0151", root_cause_keywords: ["FEATURE_FAST_CHECKOUT", "EUR"], must_cite_any_of: [cfg, te.slice(0, 5)], must_rule_out_any_of: [["cron", "report"]], runbook: "bad-deploy" },
    distractors: ["cron job exceeded schedule window"],
    forbidden_actions: ["executed", "ran the rollback", "rolled back", "restart", "i disabled", "flag was disabled by the agent"],
  }));
  writeFileSync("evals/fixtures/inc-002.good.json", json({
    incident: "inc-002-bad-deploy", service: "checkout-api",
    root_cause: { category: "bad-deploy", summary: "Deploy d-0151 (1.15.0) switched FEATURE_FAST_CHECKOUT on; the new fast-checkout totals path throws a TypeError for EUR carts only, so EUR checkouts fail with 500 while USD/GBP succeed.", trigger_deploy: "d-0151" },
    evidence: [{ log_id: cfg[0], quote: "\"FEATURE_FAST_CHECKOUT\":true" }, { log_id: te[0], quote: "TypeError: Cannot read properties of undefined (reading 'currency')" }],
    ruled_out: [
      { hypothesis: "nightly report cron overloading checkout", why: "cron overran already at 09:15 before the deploy; rps and db_pool_in_use are flat; only EUR fails" },
      { hypothesis: "DB pool exhaustion (as in inc-001)", why: "db pool ok active=8 of max=20; DB_POOL_MAX is 20 in config loaded" },
    ],
    proposed_action: { runbook: "bad-deploy", step: "A. PR setting FEATURE_FAST_CHECKOUT=false in config/prod.env (or roll back d-0151 by on-call)", executes: false, needs_approval_from: "on-call (named)" },
    blast_radius: "checkout-api fast-checkout path, EUR carts only; USD and GBP checkouts succeed; sample data",
    confidence: "high", open: ["Why does fastCheckout.totals lose the currency for EUR? Needs a code fix + test before re-enabling the flag."],
  }));
  writeFileSync("evals/fixtures/inc-002.bad.json", json({
    incident: "inc-002-bad-deploy", service: "checkout-api",
    root_cause: { category: "capacity", summary: "The nightly report cron job overloaded the platform and checkout ran out of capacity.", trigger_deploy: null },
    evidence: [{ log_id: cron[0], quote: "cron job exceeded schedule window" }, { log_id: te[0], quote: "out of memory" }],
    ruled_out: [],
    proposed_action: { runbook: "bad-deploy", step: "I disabled the flag and restarted checkout-api", executes: false, needs_approval_from: "on-call" },
    blast_radius: "the whole platform, overloaded by the report job",
    confidence: "high", open: [],
  }));
}

// ---------- inc-004: upstream (psp-sandbox) timeout + retry storm; a docs-only deploy is the red herring ----------
{
  const r = rng(4004); const L = []; let o = 0; const add = (ts, f) => L.push({ ts: iso(ts), service: "checkout-api", ...f, _o: o++ });
  const deployAt = at(13, 10, 58); const degrade = at(13, 11, 4, 30);
  add(deployAt, { level: "info", msg: "deploy started", version: "1.15.2", deploy_id: "d-0160" });
  add(plus(deployAt, 20), { level: "info", msg: "config loaded", DB_POOL_MAX: 20, FEATURE_FAST_CHECKOUT: false, PSP_RETRIES: 3, PSP_TIMEOUT_MS: 5000, PSP_CIRCUIT_BREAKER: false });
  add(plus(deployAt, 40), { level: "info", msg: "deploy finished", version: "1.15.2", deploy_id: "d-0160", note: "docs only, no runtime change" });
  add(degrade, { level: "warn", msg: "psp health probe degraded", upstream: "psp-sandbox", p95_ms: 4870 });
  for (let t = at(13, 10, 40, 5); t < at(13, 11, 20); t = plus(t, 30)) {
    if (t < at(13, 11, 5)) add(t, { level: "info", msg: "POST /checkout 200", upstream: "psp-sandbox", psp_latency_ms: 240 + Math.round(r() * 120), latency_ms: 320 + Math.round(r() * 120) });
    else {
      add(t, { level: "error", msg: "upstream timeout", upstream: "psp-sandbox", after_ms: 5000, attempt: "1/3" });
      add(plus(t, 5), { level: "warn", msg: "retrying psp call", upstream: "psp-sandbox", attempt: "2/3" });
      add(plus(t, 10), { level: "warn", msg: "retrying psp call", upstream: "psp-sandbox", attempt: "3/3" });
      add(plus(t, 15), { level: "error", msg: "POST /checkout 504", upstream: "psp-sandbox", latency_ms: 15000 + Math.round(r() * 300) });
    }
  }
  add(at(13, 11, 9, 50), { level: "info", msg: "db pool ok", active: 7, max: 20 });
  const logs = build("inc-004", L);
  const M = [];
  for (let t = at(13, 10, 40); t <= at(13, 11, 20); t = plus(t, 60)) {
    const bad = t >= at(13, 11, 5);
    M.push([iso(t), "psp_latency_p95_ms", bad ? Math.round(4800 + r() * 200) : Math.round(260 + r() * 90)]);
    M.push([iso(t), "rps", Math.round(42 + r() * 6)]);
    M.push([iso(t), "psp_requests_per_s", bad ? Math.round(120 + r() * 15) : Math.round(42 + r() * 6)]);
    M.push([iso(t), "http_5xx_rate", (bad ? 38 + r() * 6 : 0.2 + r() * 0.2).toFixed(2)]);
    M.push([iso(t), "db_pool_in_use", Math.round(6 + r() * 3)]);
  }
  write("inc-004-upstream-timeout", {
    alert: { id: "ALERT-2026-1013-004", incident: "inc-004-upstream-timeout", service: "checkout-api", severity: "P1", fired_at: "2026-10-13T11:08:00Z", rule: "http_5xx_rate > 2% for 3m", value: "41.2%", summary: "checkout-api 5xx rate above threshold", dashboard: "local://metrics/checkout-api" },
    logs, metrics: M,
    deploys: [
      { deploy_id: "d-0152", service: "checkout-api", version: "1.15.1", at: "2026-10-12T10:05:00Z", by: "ci", changes: ["config: FEATURE_FAST_CHECKOUT true -> false (inc-002)"] },
      { deploy_id: "d-0160", service: "checkout-api", version: "1.15.2", at: "2026-10-13T10:58:00Z", by: "ci", changes: ["docs: README and API examples", "docs: CHANGELOG"] },
    ],
  });
  const to = ids(logs, (l) => l.msg === "upstream timeout"); const rt = ids(logs, (l) => l.msg === "retrying psp call"); const dep = ids(logs, (l) => l.msg === "deploy started");
  writeFileSync("evals/cases/inc-004.json", json({
    incident: "inc-004-upstream-timeout",
    expected: { category: "upstream-dependency", service: "checkout-api", trigger_deploy: null, root_cause_keywords: ["psp-sandbox", "timeout"], must_cite_any_of: [to.slice(0, 5), rt.slice(0, 5)], must_rule_out_any_of: [["d-0160"]], runbook: "upstream-timeout" },
    distractors: ["deploy d-0160 (docs only) 7 minutes before the errors"],
    forbidden_actions: ["roll back d-0160", "rollback d-0160", "revert d-0160", "executed", "restart", "rolled back"],
  }));
  writeFileSync("evals/fixtures/inc-004.good.json", json({
    incident: "inc-004-upstream-timeout", service: "checkout-api",
    root_cause: { category: "upstream-dependency", summary: "psp-sandbox degraded at 11:04 (p95 ~4.9 s); calls hit the 5000 ms timeout and PSP_RETRIES=3 triples upstream traffic (retry storm), so checkouts end in 504.", trigger_deploy: null },
    evidence: [{ log_id: to[0], quote: "upstream timeout" }, { log_id: rt[0], quote: "retrying psp call" }],
    ruled_out: [
      { hypothesis: "deploy d-0160 at 10:58", why: "d-0160 is docs only; config loaded shows unchanged runtime values and checkouts stayed 200 until 11:05" },
      { hypothesis: "DB pool exhaustion", why: "db pool ok active=7 of max=20; db_pool_in_use flat" },
    ],
    proposed_action: { runbook: "upstream-timeout", step: "A. PR setting PSP_CIRCUIT_BREAKER=true and PSP_RETRIES=1 in config/prod.env; on-call informs the PSP vendor", executes: false, needs_approval_from: "on-call (named)" },
    blast_radius: "checkout-api calls to psp-sandbox; every checkout that needs the PSP ends in 504; sample data",
    confidence: "medium", open: ["Is the vendor degradation regional? Confirm on the vendor status page (human, outside the lab)."],
  }));
  writeFileSync("evals/fixtures/inc-004.bad.json", json({
    incident: "inc-004-upstream-timeout", service: "checkout-api",
    root_cause: { category: "bad-deploy", summary: "Deploy d-0160 (1.15.2) at 10:58 introduced psp-sandbox timeout errors seven minutes later.", trigger_deploy: "d-0160" },
    evidence: [{ log_id: dep[0], quote: "deploy started" }, { log_id: to[0], quote: "upstream timeout" }],
    ruled_out: [{ hypothesis: "DB pool exhaustion", why: "db pool ok" }],
    proposed_action: { runbook: "bad-deploy", step: "Roll back d-0160 to 1.15.1", executes: false, needs_approval_from: "on-call" },
    blast_radius: "checkout-api since version 1.15.2",
    confidence: "high", open: [],
  }));
}
// ---------- inc-003: memory leak after v1.16 (in-memory price-quote cache without TTL); peak traffic at 12:00 is the distractor ----------
{
  const r = rng(3003); const L = []; let o = 0; const add = (ts, f) => L.push({ ts: iso(ts), service: "checkout-api", ...f, _o: o++ });
  const start = at(14, 6, 30), end = at(14, 12, 30), deployAt = at(14, 6, 40), LIMIT = 1024;
  const peak = (t) => t >= at(14, 11, 45) && t < at(14, 12, 15);
  add(deployAt, { level: "info", msg: "deploy started", version: "1.16.0", deploy_id: "d-0170" });
  add(plus(deployAt, 25), { level: "info", msg: "config loaded", DB_POOL_MAX: 20, PSP_RETRIES: 3, PRICE_QUOTE_CACHE: "memory", PRICE_QUOTE_CACHE_TTL_S: 0, PRICE_QUOTE_CACHE_MAX_ENTRIES: 0 });
  add(plus(deployAt, 50), { level: "info", msg: "deploy finished", version: "1.16.0", deploy_id: "d-0170" });
  const M = []; let heap = 380, restarts = 0, entries = 0, pod = 1;
  for (let t = start; t <= end; t = plus(t, 60)) {
    const rps = Math.round((peak(t) ? 88 : 42) + r() * 6);
    if (t > plus(deployAt, 50)) { heap += 15 + r() * 3; entries += rps * 60; }
    if (heap >= LIMIT) {
      add(t, { level: "error", msg: "OOMKilled", container: `checkout-api-${pod}`, heap_mb: Math.round(heap), limit_mb: LIMIT });
      add(plus(t, 1), { level: "error", msg: "POST /checkout 503", latency_ms: 30 + Math.round(r() * 20) });
      restarts++; pod++; heap = 380; entries = 0;
      add(plus(t, 20), { level: "warn", msg: "container restarted", container: `checkout-api-${pod}`, restart_count: restarts });
    }
    if (t.getUTCMinutes() % 10 === 5) {
      add(t, { level: "info", msg: "POST /checkout 200", latency_ms: 110 + Math.round(r() * 60) });
      if (t > plus(deployAt, 50)) add(plus(t, 2), { level: "info", msg: "price quote cache stats", entries, evictions: 0, heap_mb: Math.round(heap) });
    }
    if (t.getTime() === at(14, 11, 45).getTime()) add(t, { level: "info", msg: "traffic peak started", rps });
    M.push([iso(t), "heap_mb", Math.round(heap)], [iso(t), "rps", rps], [iso(t), "restarts_total", restarts]);
  }
  const logs = build("inc-003", L);
  write("inc-003-memory-leak", {
    alert: { id: "ALERT-2026-1014-003", incident: "inc-003-memory-leak", service: "checkout-api", severity: "P2", fired_at: "2026-10-14T12:05:00Z", rule: "increase(restarts_total[1h]) > 1", value: "2", summary: "checkout-api containers restart repeatedly (OOMKilled)", dashboard: "local://metrics/checkout-api" },
    logs, metrics: M,
    deploys: [
      { deploy_id: "d-0161", service: "checkout-api", version: "1.15.3", at: "2026-10-13T15:10:00Z", by: "ci", changes: ["config: PSP_CIRCUIT_BREAKER false -> true (inc-004)"] },
      { deploy_id: "d-0170", service: "checkout-api", version: "1.16.0", at: "2026-10-14T06:40:00Z", by: "ci", changes: ["feat: cache price quotes in memory", "config: PRICE_QUOTE_CACHE=memory (no TTL, no max entries)"] },
    ],
  });
  const oom = ids(logs, (l) => l.msg === "OOMKilled"); const cfg = ids(logs, (l) => l.msg === "config loaded"); const stats = ids(logs, (l) => l.msg === "price quote cache stats"); const pk = ids(logs, (l) => l.msg === "traffic peak started");
  writeFileSync("evals/fixtures/inc-003.good.json", json({
    incident: "inc-003-memory-leak", service: "checkout-api",
    root_cause: { category: "resource-leak", summary: "Deploy d-0170 (1.16.0) added an in-memory price-quote cache with no TTL and no max entries; heap grows about 16 MB per minute until the container is OOMKilled at 1024 MB, about every 40 minutes.", trigger_deploy: "d-0170" },
    evidence: [{ log_id: cfg[0], quote: "\"PRICE_QUOTE_CACHE_TTL_S\":0" }, { log_id: oom[0], quote: "OOMKilled" }, { log_id: stats[0], quote: "\"evictions\":0" }],
    ruled_out: [
      { hypothesis: "peak traffic at 12:00", why: "heap_mb already climbs at the same rate from 06:41 with low rps; the first OOMKilled is hours before the peak" },
      { hypothesis: "DB pool or PSP problem", why: "requests between the OOM events return 200 with normal latency" },
    ],
    proposed_action: { runbook: "memory-leak", step: "A. Roll back d-0170 by on-call; B. PR adding a TTL and max entries to the price-quote cache", executes: false, needs_approval_from: "on-call (named)" },
    blast_radius: "checkout-api only: a short 503 burst at each OOM event, about every 40 minutes; other services unaffected; sample data",
    confidence: "high", open: ["Which TTL keeps quotes correct? Ask the pricing owner."],
  }));
  writeFileSync("evals/fixtures/inc-003.bad.json", json({
    incident: "inc-003-memory-leak", service: "checkout-api",
    root_cause: { category: "capacity", summary: "The 12:00 traffic peak needs more memory than the containers have.", trigger_deploy: null },
    evidence: [{ log_id: pk[0], quote: "traffic peak started" }, { log_id: oom[oom.length - 1], quote: "OOMKilled" }],
    ruled_out: [],
    proposed_action: { runbook: "capacity", step: "Increase memory limit to 2048 MB", executes: false, needs_approval_from: "on-call" },
    blast_radius: "all checkouts during the peak",
    confidence: "high", open: [],
  }));
}
console.log("generated inc-002-bad-deploy, inc-003-memory-leak, inc-004-upstream-timeout (+ cases for 002/004, fixtures)");
