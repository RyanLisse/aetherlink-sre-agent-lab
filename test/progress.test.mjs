// Tests for the progress hook: PROGRESS.md (skills-pack template) gets append-only entries from real local evidence,
// human-written text is never changed, nothing else is written, no network.
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const here = resolve(".");
const dir = mkdtempSync(join(tmpdir(), "sre-progresstest-"));
for (const d of [".claude/hooks", ".claude/skills/a", "docs/diagnoses", "docs/verify/claim/", "evals/cases", "approvals", ".lab", "node_modules/@modelcontextprotocol"]) mkdirSync(join(dir, d), { recursive: true });
writeFileSync(join(dir, ".claude/skills/a/SKILL.md"), "---\nname: a\n---\n");
copyFileSync(join(here, ".claude/hooks/progress.mjs"), join(dir, ".claude/hooks/progress.mjs"));
copyFileSync(join(here, "PROGRESS.md"), join(dir, "PROGRESS.md"));
writeFileSync(join(dir, "intent.md"), "# Intent\nAuthor: <team>\n## Problem\n## Proposed outcome\n## Affected users and systems\n## Constraints\n## Open questions\n");
writeFileSync(join(dir, "evals/schema.ts"), "export {}\n");
for (const c of ["inc-001", "inc-002", "inc-004"]) writeFileSync(join(dir, `evals/cases/${c}.json`), "{}");
execFileSync("git", ["-C", dir, "init", "-q", "-b", "main"]);

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`ok   ${name}`); } else { fail++; console.log(`FAIL ${name}`); } };
const hook = join(dir, ".claude/hooks/progress.mjs");
const env = { ...process.env, CLAUDE_PROJECT_DIR: dir };
const run = (event = "PostToolUse") => spawnSync(process.execPath, [hook], { input: JSON.stringify({ hook_event_name: event }), env, encoding: "utf8" });
const log = () => readFileSync(join(dir, "PROGRESS.md"), "utf8");
const logged = (k) => log().includes(`<!-- auto: STEP-${k} -->`);
const long = (t) => t + "\n" + "Worked out with evidence. ".repeat(12);
const template = readFileSync(join(here, "PROGRESS.md"), "utf8");

// The file follows the skills-pack template.
for (const s of ["# Build log", "**Historical, append-only.**", "WRITING RULES (keep this comment; it does not render)", "## Archive", "ENTRY TEMPLATES", "OPTIONAL BULLETS", "**Key caveat (optional):**"])
  ok(`template section present: ${s}`, template.includes(s));
ok("template placeholders for tracker/project/key are filled", !/<TRACKER>|<PROJECT NAME>|<KEY>-\*/.test(template));
ok("every STEP-0..9 key is defined in the key caveat", [...Array(10).keys()].every((n) => template.includes(`**STEP-${n}**`)));

const before = readdirSync(dir).sort().join(",");
let r = run("SessionStart");
ok("hook exits 0 silently", r.status === 0 && r.stdout === "");
ok("fresh repo: no entries appended", log() === template);
ok("writes only PROGRESS.md (no new top-level files)", readdirSync(dir).sort().join(",") === before);

const human = "\n## 2026-10-11 — Our own note (STEP-1)\n\n- **What shipped:** hand-written.\n";
writeFileSync(join(dir, "PROGRESS.md"), log() + human);
writeFileSync(join(dir, "approvals/audit.jsonl"), JSON.stringify({ decision: "deny", tool: "Bash", reason: "Network access is blocked" }) + "\n");
run();
ok("deny in audit.jsonl -> STEP-0 and STEP-4 entries appended", logged(0) && logged(4));
ok("entry follows the feature template bullets", ["**What shipped:**", "**Why it mattered:**", "**How, and what was rejected:**", "**Validation:**", "**Deliberately not done:**"].every((b) => log().includes(b)));
ok("entry header is '## YYYY-MM-DD — <title> (STEP-n)'", /^## \d{4}-\d{2}-\d{2} — .+ \(STEP-4\)$/m.test(log()));
ok("human-written entry is preserved verbatim", log().includes(human));
ok("template text above the entries is untouched", log().startsWith(template));

ok("intent with <team> is NOT logged", (run(), !logged(1)));
writeFileSync(join(dir, "intent.md"), long("# Intent\nAuthor: team Red\n## Problem\nx\n## Proposed outcome\nx\n## Affected users and systems\nx\n## Constraints\nx\n## Open questions\nOPEN: y"));
run(); ok("filled intent.md -> STEP-1 logged", logged(1));

writeFileSync(join(dir, "docs/spec.md"), long("# Spec\nTODO later")); run(); ok("spec with TODO is NOT logged", !logged(2));
writeFileSync(join(dir, "docs/spec.md"), long("# Spec\nfields")); run(); ok("filled spec -> STEP-2 logged", logged(2));
mkdirSync(join(dir, "docs/rpi/task"), { recursive: true }); writeFileSync(join(dir, "docs/rpi/task/01-research.md"), "# research");
run(); ok("design document in docs/rpi -> STEP-3 logged", logged(3) && log().includes("docs/rpi/task/01-research.md"));

writeFileSync(join(dir, "docs/plan.md"), long("# Plan"));
writeFileSync(join(dir, "docs/diagnoses/inc-001.json"), "{}");
run(); ok("plan + diagnosis -> STEP-5 logged", logged(5));
ok("diagnosis without eval result -> STEP-6 NOT logged", !logged(6));
writeFileSync(join(dir, "docs/verify/claim/verdict.md"), "VERIFIED");
writeFileSync(join(dir, ".lab/eval-results.json"), JSON.stringify({ "docs/diagnoses/inc-001.json": { pass: true, at_ms: 1 } }));
run(); ok("stale eval result -> STEP-6 NOT logged", !logged(6));
writeFileSync(join(dir, ".lab/eval-results.json"), JSON.stringify({ "docs/diagnoses/inc-001.json": { pass: false, at_ms: Date.now() + 1000 } }));
run(); ok("REJECTED eval -> STEP-6 NOT logged", !logged(6));
writeFileSync(join(dir, ".lab/eval-results.json"), JSON.stringify({ "docs/diagnoses/inc-001.json": { pass: true, at_ms: Date.now() + 1000 } }));
run(); ok("eval PASS + verdict -> STEP-6 logged", logged(6));

writeFileSync(join(dir, "approvals/approvals.jsonl"), JSON.stringify({ approved_by: "ryan", ref: "main" }) + "\n");
run(); ok("approval on main does not count as gate", !logged(7));
writeFileSync(join(dir, "approvals/approvals.jsonl"), JSON.stringify({ approved_by: "ryan", ref: "fix/db-pool-size" }) + "\n");
run(); ok("named approval on fix/* -> STEP-7 logged with name", logged(7) && log().includes("`fix/db-pool-size` by ryan"));

writeFileSync(join(dir, "evals/cases/inc-009.json"), "{}"); run(); ok("new eval case -> STEP-8 logged", logged(8) && log().includes("evals/cases/inc-009.json"));
writeFileSync(join(dir, "HANDOFF.md"), long("# Handoff")); run(); ok("HANDOFF.md -> STEP-9 logged", logged(9));

ok("each step logged exactly once", [...Array(10).keys()].every((n) => log().split(`<!-- auto: STEP-${n} -->`).length === 2));
const snap = log(); run(); run("Stop"); ok("append-only + idempotent: no change without new evidence", log() === snap);
rmSync(join(dir, "HANDOFF.md")); run(); ok("evidence disappearing never edits an old entry", log() === snap);

const st = spawnSync(process.execPath, [hook, "--status"], { env, encoding: "utf8" });
ok("--status prints the live checklist and writes nothing", st.status === 0 && /9\/10 steps with evidence/.test(st.stdout) && log() === snap);

rmSync(join(dir, "PROGRESS.md")); run(); ok("missing PROGRESS.md is not invented", !existsSync(join(dir, "PROGRESS.md")));
r = spawnSync(process.execPath, [hook], { input: "garbage", env: { ...process.env, CLAUDE_PROJECT_DIR: join(dir, "does-not-exist") }, encoding: "utf8" });
ok("broken environment never blocks Claude (exit 0, no output)", r.status === 0 && r.stdout === "");
const src = readFileSync(join(here, ".claude/hooks/progress.mjs"), "utf8");
ok("no network modules in the hook", !/node:(http|https|net|dgram|tls)|fetch\(/.test(src));
ok("hook writes only PROGRESS.md", (src.match(/(writeFileSync|appendFileSync)\(/g) ?? []).length === 1 && /appendFileSync\(f\(FILE\)/.test(src));

console.log(`pass=${pass} fail=${fail}`);
rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
