// Tests for the progress hook: progress.md follows real evidence, keeps manual notes, writes nothing else, no network.
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const here = resolve(".");
const dir = mkdtempSync(join(tmpdir(), "sre-progresstest-"));
for (const d of [".claude/hooks", "docs/diagnoses", "docs/verify/claim/", "evals/cases", "approvals", ".lab", "node_modules/@modelcontextprotocol"]) mkdirSync(join(dir, d), { recursive: true });
copyFileSync(join(here, ".claude/hooks/progress.mjs"), join(dir, ".claude/hooks/progress.mjs"));
copyFileSync(join(here, "progress.md"), join(dir, "progress.md"));
writeFileSync(join(dir, "intent.md"), "# Intent\nAuthor: <team>\n## Problem\n## Proposed outcome\n## Affected users and systems\n## Constraints\n## Open questions\n");
writeFileSync(join(dir, "evals/schema.ts"), "export {}\n");
for (const c of ["inc-001", "inc-002", "inc-004"]) writeFileSync(join(dir, `evals/cases/${c}.json`), "{}");
execFileSync("git", ["-C", dir, "init", "-q", "-b", "main"]);

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`ok   ${name}`); } else { fail++; console.log(`FAIL ${name}`); } };
const run = (event = "PostToolUse") => spawnSync(process.execPath, [join(dir, ".claude/hooks/progress.mjs")], { input: JSON.stringify({ hook_event_name: event }), env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: "utf8" });
const box = () => readFileSync(join(dir, "progress.md"), "utf8");
const done = (n) => new RegExp(`- \\[x\\] ${n} ·`).test(box());
const long = (t) => t + "\n" + "Uitgewerkt met bewijs. ".repeat(12);

const before = readdirSync(dir).sort().join(",");
let r = run("SessionStart");
ok("hook exits 0 silently", r.status === 0 && r.stdout === "");
ok("fresh repo: 0/9 except setup missing hook evidence", /0\/9/.test(box()));
ok("writes only progress.md (no new top-level files)", readdirSync(dir).sort().join(",") === before);

writeFileSync(join(dir, "progress.md"), box().replace("## Log (zelf invullen)\n\n- ", "## Log (zelf invullen)\n\n- 11:20 intent geschreven, VERIFIED"));
writeFileSync(join(dir, "approvals/audit.jsonl"), JSON.stringify({ decision: "deny", tool: "Bash" }) + "\n");
run();
ok("setup + controls done after a deny in audit.jsonl", done("0") && done("3"));
ok("manual log line is preserved", box().includes("11:20 intent geschreven, VERIFIED"));

ok("intent with <team> is NOT done", (run(), !done("1")));
writeFileSync(join(dir, "intent.md"), long("# Intent\nAuthor: team Rood\n## Problem\nx\n## Proposed outcome\nx\n## Affected users and systems\nx\n## Constraints\nx\n## Open questions\nOPEN: y"));
run(); ok("filled intent.md -> step 1 done", done("1"));

writeFileSync(join(dir, "docs/spec.md"), long("# Spec\nTODO later")); run(); ok("spec with TODO is NOT done", !done("2"));
writeFileSync(join(dir, "docs/spec.md"), long("# Spec\nvelden")); run(); ok("filled spec -> step 2 done", done("2"));

writeFileSync(join(dir, "docs/plan.md"), long("# Plan"));
writeFileSync(join(dir, "docs/diagnoses/inc-001.json"), "{}");
run(); ok("plan + diagnosis -> step 4 done", done("4"));
ok("diagnosis without eval result -> step 5 NOT done", !done("5"));
writeFileSync(join(dir, ".lab/eval-results.json"), JSON.stringify({ "docs/diagnoses/inc-001.json": { pass: true, at_ms: Date.now() + 1000 } }));
writeFileSync(join(dir, "docs/verify/claim/verdict.md"), "VERIFIED");
run(); ok("eval PASS + verdict -> step 5 done", done("5"));
writeFileSync(join(dir, ".lab/eval-results.json"), JSON.stringify({ "docs/diagnoses/inc-001.json": { pass: true, at_ms: 1 } }));
run(); ok("stale eval result (diagnosis changed after eval) -> step 5 NOT done", !done("5"));
writeFileSync(join(dir, ".lab/eval-results.json"), JSON.stringify({ "docs/diagnoses/inc-001.json": { pass: false, at_ms: Date.now() + 1000 } }));
run(); ok("REJECTED eval -> step 5 NOT done", !done("5"));

writeFileSync(join(dir, "approvals/approvals.jsonl"), JSON.stringify({ approved_by: "ryan", ref: "main" }) + "\n");
run(); ok("approval on main does not count as gate", !done("6"));
writeFileSync(join(dir, "approvals/approvals.jsonl"), JSON.stringify({ approved_by: "ryan", ref: "fix/db-pool-size" }) + "\n");
run(); ok("named approval on fix/* -> step 6 done", done("6") && box().includes("fix/db-pool-size door ryan"));

writeFileSync(join(dir, "evals/cases/inc-009.json"), "{}"); run(); ok("new eval case -> step 7 done", done("7"));
writeFileSync(join(dir, "HANDOFF.md"), long("# Handoff")); run(); ok("HANDOFF.md -> step 8 done", done("8"));
ok("exactly one AUTO block", box().split("<!-- AUTO:START").length === 2 && box().split("<!-- AUTO:END").length === 2);

const snap = box(); run(); ok("idempotent: no change without new evidence", box() === snap);
writeFileSync(join(dir, "progress.md"), "# eigen notities\n"); run(); ok("missing AUTO block is appended, notes kept", box().startsWith("# eigen notities") && box().includes("AUTO:END"));
r = spawnSync(process.execPath, [join(dir, ".claude/hooks/progress.mjs")], { input: "garbage", env: { ...process.env, CLAUDE_PROJECT_DIR: join(dir, "does-not-exist") }, encoding: "utf8" });
ok("broken environment never blocks Claude (exit 0, no output)", r.status === 0 && r.stdout === "");
const src = readFileSync(join(here, ".claude/hooks/progress.mjs"), "utf8");
ok("no network modules in the hook", !/node:(http|https|net|dgram|tls)|fetch\(/.test(src));

console.log(`pass=${pass} fail=${fail}`);
rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
