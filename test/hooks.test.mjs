// Feeds PreToolUse payloads to the Node guard and checks the decision. Runs offline, on any OS.
// Runs in a throw-away git repo in the OS temp dir, so it never switches branches in your working tree.
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const here = resolve(".");
const dir = mkdtempSync(join(tmpdir(), "sre-hooktest-"));
mkdirSync(join(dir, ".claude", "hooks"), { recursive: true });
mkdirSync(join(dir, "scripts"), { recursive: true });
copyFileSync(join(here, ".claude/hooks/guard.mjs"), join(dir, ".claude/hooks/guard.mjs"));
copyFileSync(join(here, "scripts/approve.mjs"), join(dir, "scripts/approve.mjs"));
const git = (...a) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
git("init", "-q", "-b", "main");
git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "init");

const env = { ...process.env, CLAUDE_PROJECT_DIR: dir };
delete env.CLAUDECODE; // the test plays the human for approve; the guard itself is what is under test
let pass = 0, fail = 0;
const P = (tool, key, val) => JSON.stringify({ tool_name: tool, tool_input: { [key]: val } });
const check = (name, want, payload) => {
  const r = spawnSync(process.execPath, [join(dir, ".claude/hooks/guard.mjs")], { input: payload, env, encoding: "utf8" });
  let got = "none";
  if (r.stdout.trim()) got = JSON.parse(r.stdout).hookSpecificOutput?.permissionDecision ?? "none";
  if (got === want) { pass++; console.log(`ok   ${name} -> ${got}`); } else { fail++; console.log(`FAIL ${name} -> ${got} (want ${want})`); }
};
const approve = (...args) => spawnSync(process.execPath, [join(dir, "scripts/approve.mjs"), ...args], { cwd: dir, env, encoding: "utf8" });
const D = (p) => join(dir, p);

// network, secrets, approvals
check("curl blocked", "deny", P("Bash", "command", "curl https://example.com"));
check("url in python blocked", "deny", P("Bash", "command", 'python3 -c "import urllib; urllib.request.urlopen(\'http://x\')"'));
check("PowerShell Invoke-WebRequest blocked", "deny", P("PowerShell", "command", "Invoke-WebRequest example.com"));
check("read .env blocked", "deny", P("Read", "file_path", D(".env")));
check("read gcloud ADC blocked", "deny", P("Read", "file_path", "/home/node/.config/gcloud/application_default_credentials.json"));
check("windows-style secret path blocked", "deny", P("Read", "file_path", "C:\\Users\\x\\AppData\\Roaming\\gcloud\\application_default_credentials.json"));
check("agent self-approve (sh) denied", "deny", P("Bash", "command", "scripts/approve.sh claude main ok"));
check("agent self-approve (npm) denied", "deny", P("Bash", "command", "npm run approve -- claude fix/x ok"));
check("agent self-approve (node) denied", "deny", P("Bash", "command", "node scripts/approve.mjs claude fix/x ok"));
// writes
check("write runbook blocked", "deny", P("Write", "file_path", D("runbooks/db-pool-exhaustion.md")));
check("write eval checker blocked", "deny", P("Edit", "file_path", D("evals/check.ts")));
check("write .claude blocked", "deny", P("Edit", "file_path", D(".claude/settings.json")));
check("write outside repo blocked", "deny", P("Write", "file_path", "/tmp/verify-this/x.md"));
check("write diagnosis allowed", "allow", P("Write", "file_path", D("docs/diagnoses/inc-001.json")));
check("write verify evidence allowed", "allow", P("Write", "file_path", D("docs/verify/x/verdict.md")));
check("write show-me html allowed", "allow", P("Write", "file_path", D("docs/show-me/show-me-pool.html")));
check("write PR/MR description allowed", "allow", P("Write", "file_path", D("docs/pr/fix-db-pool-size.md")));
check("write intent.md asks", "ask", P("Write", "file_path", D("intent.md")));
check("write eval case asks", "ask", P("Write", "file_path", D("evals/cases/inc-009.json")));
check("edit app on main denied", "deny", P("Edit", "file_path", D("app/config/prod.env")));
// gate (GitHub and GitLab)
check("push without approval", "deny", P("Bash", "command", "git push origin fix/pool"));
check("gh pr create without approval", "deny", P("Bash", "command", "gh pr create --fill"));
check("glab mr create without approval", "deny", P("Bash", "command", "glab mr create --fill"));
check("commit msg mentioning push not gated", "none", P("Bash", "command", 'git commit -m "docs: explain push gate"'));
git("switch", "-q", "-c", "fix/db-pool-size");
check("edit app on fix/* asks", "ask", P("Edit", "file_path", D("app/config/prod.env")));
check("push on fix/* still denied without approval", "deny", P("Bash", "command", "git push -u origin fix/db-pool-size"));
const refused = approve("claude", "fix/db-pool-size", "x");
check_status("approve refuses agent name", refused.status !== 0);
const inClaude = spawnSync(process.execPath, [join(dir, "scripts/approve.mjs"), "ryan", "fix/db-pool-size", "x"], { cwd: dir, env: { ...env, CLAUDECODE: "1" }, encoding: "utf8" });
check_status("approve refuses inside a Claude Code session", inClaude.status !== 0);
const ok = approve("ryan", "fix/db-pool-size", "restore pool to 20 per runbook B");
check_status("human approve succeeds", ok.status === 0);
check("git push with named approval asks", "ask", P("Bash", "command", "git push -u origin fix/db-pool-size"));
check("gh pr create with named approval asks", "ask", P("Bash", "command", "gh pr create --fill"));
check("glab mr create with named approval asks", "ask", P("Bash", "command", "glab mr create --fill --target-branch main"));
check("gh pr merge always denied", "deny", P("Bash", "command", "gh pr merge --squash"));
check("gh pr review --approve always denied", "deny", P("Bash", "command", "gh pr review 12 --approve"));
check("glab mr approve always denied", "deny", P("Bash", "command", "glab mr approve 7"));
check("glab mr merge always denied", "deny", P("Bash", "command", "glab mr merge 7"));
check("npm test untouched", "none", P("Bash", "command", "npm test"));
check("garbage input fails closed", "deny", "{not json");

function check_status(name, cond) { if (cond) { pass++; console.log(`ok   ${name}`); } else { fail++; console.log(`FAIL ${name}`); } }
const audit = existsSync(join(dir, "approvals/audit.jsonl")) ? readFileSync(join(dir, "approvals/audit.jsonl"), "utf8").trim().split("\n").length : 0;
const approvals = readFileSync(join(dir, "approvals/approvals.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
check_status("exactly one approval line, by ryan", approvals.length === 1 && approvals[0].approved_by === "ryan");
console.log(`audit lines: ${audit}`);
console.log(`pass=${pass} fail=${fail}`);
rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
