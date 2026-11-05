#!/usr/bin/env node
// Facilitator check: every catch-up step must be green and show the right progress.
// For each ref (default: every local steps2/* branch) it makes a temp worktree, replays the session
// evidence that git does not carry (approvals/audit.jsonl, .lab/), runs the CI gates and reads
// `npm run progress -- --status`. One line per step; exit 1 if any gate fails or a STEP is missing.
// Usage: npm run check:steps [-- <ref> ...]      e.g. npm run check:steps -- main steps2/4-diagnose
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repo = resolve(execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim());
const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const refs = process.argv.slice(2).length ? process.argv.slice(2)
  : git("for-each-ref", "refs/heads/steps2/", "--format=%(refname:short)").split("\n").filter(Boolean)
      .sort((a, b) => stepOf(a) - stepOf(b));
if (!refs.length) { console.error("check-steps: no steps2/* branches and no refs given."); process.exit(1); }

function stepOf(ref) { return Number(ref.match(/step(?:s2\/|-)(\d+)/)?.[1] ?? 0); }
// Lesson step N proves STEP-0 up to this key (step 2 covers Spec and Design, so the keys run one ahead from there).
const lastKey = (n) => (n <= 1 ? n : n + 1);

let bad = 0;
for (const ref of refs) {
  const n = stepOf(ref);
  const dir = mkdtempSync(join(tmpdir(), "sre-steps-"));
  try {
    git("worktree", "add", "--detach", "--quiet", dir, ref);
    const run = (cmd, args, input) => spawnSync(cmd, args, { cwd: dir, input, encoding: "utf8", shell: process.platform === "win32", env: { ...process.env, CLAUDE_PROJECT_DIR: dir, CLAUDECODE: "" } });
    const sameLock = spawnSync("git", ["-C", repo, "diff", "--quiet", "HEAD", ref, "--", "package-lock.json"]).status === 0;
    if (sameLock && existsSync(join(repo, "node_modules"))) symlinkSync(join(repo, "node_modules"), join(dir, "node_modules"), "junction");
    else if (run(npm, ["ci", "--no-audit", "--no-fund"]).status !== 0) throw new Error("npm ci failed");

    // Replay what a participant's session leaves on disk by the end of this step.
    const guard = (tool_name, tool_input) => run(process.execPath, [".claude/hooks/guard.mjs"], JSON.stringify({ tool_name, tool_input }));
    guard("Bash", { command: "npm run progress -- --status" });          // INSTALL.md Step 8 start-up prompt
    if (n >= 3) guard("Bash", { command: "curl https://example.com" });  // Controls block: Claude tries a blocked action
    const diagnoses = existsSync(join(dir, "docs/diagnoses")) ? readdirSync(join(dir, "docs/diagnoses")).filter((f) => /^inc-\d{3}.*\.json$/.test(f)) : [];

    const t = run(npm, ["test"]), h = run(npm, ["run", "test:hooks"]);
    const gates = { test: t.status, hooks: h.status };
    const tests = t.stdout.match(/^(?:ℹ|#) pass (\d+)/m)?.[1] ?? "?";
    const hookPass = [...h.stdout.matchAll(/^pass=(\d+)/gm)].map((m) => m[1]).join("+");
    const ev = run(npm, ["run", "eval"]);
    gates.eval = ev.status;
    for (const d of diagnoses) gates[`eval:${d}`] = run(npm, ["run", "eval", "--", `docs/diagnoses/${d}`]).status;
    const scored = (ev.stdout.match(/^ok /gm) ?? []).length, skipped = (ev.stdout.match(/^skip /gm) ?? []).length;

    const status = run(process.execPath, [".claude/hooks/progress.mjs", "--status"]).stdout;
    const done = [...status.matchAll(/^\[x\] STEP-(\d)/gm)].map((m) => Number(m[1]));
    const want = [...Array(lastKey(n) + 1).keys()];
    const missing = want.filter((k) => !done.includes(k));
    const failed = Object.entries(gates).filter(([, s]) => s !== 0).map(([g]) => g);
    const ok = !failed.length && !missing.length;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} ${ref.padEnd(20)} ${Object.entries(gates).map(([g, s]) => `${g}=${s}`).join(" ")}  npm test pass ${tests}, hooks pass ${hookPass}, eval ${scored} ok/${skipped} skip  [x] ${done.map((k) => `STEP-${k}`).join(",") || "none"}${missing.length ? `  missing ${missing.map((k) => `STEP-${k}`).join(",")}` : ""}`);
  } catch (e) {
    bad++;
    console.log(`FAIL ${ref.padEnd(20)} ${e.message}`);
  } finally {
    spawnSync("git", ["-C", repo, "worktree", "remove", "--force", dir]);
    rmSync(dir, { recursive: true, force: true });
  }
}
process.exit(bad ? 1 : 0);
