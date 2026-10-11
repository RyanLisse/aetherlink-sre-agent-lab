#!/usr/bin/env node
// PreToolUse guard for the SRE lab (Node, no bash/jq needed: works the same on Windows, macOS, Linux and in the container).
// Deterministic layer behind the skills. Decisions go to Claude as JSON (permissionDecision allow|ask|deny)
// and are appended to approvals/audit.jsonl. Messages to Claude are English; the lab README explains them in Dutch.
// Best-effort by design: regexes are not a sandbox. Real isolation = container + managed settings (see README).
import { readFileSync, appendFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, relative, isAbsolute, join } from "node:path";

const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { input = { tool_name: "?", _parse_error: true }; }
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};
const cmd = String(ti.command ?? "");
const rawPath = String(ti.file_path ?? ti.path ?? ti.notebook_path ?? "");
const pattern = String(ti.pattern ?? "");
const toRel = (p) => {
  if (!p) return "";
  const abs = isAbsolute(p) ? p : resolve(root, p);
  return relative(root, abs).split("\\").join("/");
};
const rel = toRel(rawPath);

function decide(decision, reason) {
  try {
    mkdirSync(join(root, "approvals"), { recursive: true });
    appendFileSync(join(root, "approvals", "audit.jsonl"),
      JSON.stringify({ at: new Date().toISOString(), tool, decision, reason, command: cmd, path: rel }) + "\n");
  } catch { /* audit failure must not open the gate; the decision below still applies */ }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: reason } }));
  process.exit(0);
}

const branch = () => {
  try { return execFileSync("git", ["-C", root, "branch", "--show-current"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "?"; }
  catch { return "?"; }
};
const approvalFor = (b) => {
  const f = join(root, "approvals", "approvals.jsonl");
  if (!existsSync(f)) return null;
  const rows = readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  return rows.filter((r) => r.ref === b && r.approved_by).pop() ?? null;
};

if (input._parse_error) decide("deny", "Guard could not parse the hook input; failing closed.");

const SECRET = /(^|[\/\\\s"'=])\.env($|[.\s"'])|(^|[\/\\])secrets[\/\\]|\.pem\b|\.key\b|id_rsa|id_ed25519|credentials|application_default_credentials|\.ssh[\/\\]|\.config[\/\\]gcloud/i;
const NETWORK = /(^|[^a-z0-9_-])(curl|wget|nc|ncat|netcat|ssh|scp|sftp|telnet|ftp|Invoke-WebRequest|Invoke-RestMethod|iwr|irm)([^a-z0-9_-]|$)|https?:\/\//i;
const APPROVAL_TOUCH = /approvals[\/\\]|scripts[\/\\]approve|approve\.(sh|mjs|js|ps1|cmd)|npm\s+run\s+approve|CLAUDECODE/i;
// A human merges and approves reviews. Never the agent, not even with an approval line.
const HUMAN_ONLY = /\bgh\s+pr\s+(merge|review\s+[^|;&]*--approve|review\s+-a\b)|\bglab\s+mr\s+(merge|approve)\b|\bgh\s+api\b[^|;&]*\/(merges?|approve)|\bglab\s+api\b/i;
// Gate: leaves the laptop or touches infra. Needs a named human approval for this branch (GitHub and GitLab alike).
const GATED = /\bgit\s+(?:-[Cc]\s+\S+\s+)*push\b|\bgh\s+pr\s+(create|ready|edit)\b|\bglab\s+mr\s+(create|update)\b|\bkubectl\b|\bhelm\b|\bsystemctl\b|\bdocker\s+(run|exec|push)\b|\bpsql\b/i;

switch (tool) {
  case "Bash":
  case "PowerShell": {
    if (NETWORK.test(cmd)) decide("deny", "Network access is blocked in this lab. Use the local sre MCP tools; ask a human if you need data you do not have.");
    if (SECRET.test(cmd)) decide("deny", "Secrets, credentials and .env files are off limits.");
    if (APPROVAL_TOUCH.test(cmd)) decide("deny", "Only a human writes approvals (npm run approve / scripts/approve.mjs, run outside Claude).");
    if (HUMAN_ONLY.test(cmd)) decide("deny", "Merging and approving a PR/MR is a human decision. Stop here and hand over to the named reviewer.");
    if (GATED.test(cmd)) {
      const b = branch();
      const a = approvalFor(b);
      if (!a) decide("deny", `Gate: no named approval for branch '${b}'. A human runs, outside Claude: npm run approve -- <name> ${b} "<reason>"`);
      decide("ask", `Gate: approved by ${a.approved_by} for '${b}'. Confirm to proceed (logged).`);
    }
    break;
  }
  case "Read":
  case "Grep":
  case "Glob": {
    if (SECRET.test(rel) || SECRET.test(rawPath) || SECRET.test(pattern)) decide("deny", "Secrets, credentials and .env files are off limits.");
    break;
  }
  case "Write":
  case "Edit":
  case "MultiEdit":
  case "NotebookEdit": {
    if (SECRET.test(rel) || SECRET.test(rawPath)) decide("deny", "Secrets, credentials and .env files are off limits.");
    if (rel.startsWith("..") || isAbsolute(rel)) decide("deny", `Writes outside the lab repo are blocked ('${rawPath}').`);
    if (/^docs\/(diagnoses|verify|show-me|pr|rpi)\//.test(rel)) decide("allow", "Diagnoses, verify-this evidence, show-me visuals, PR/MR descriptions and RPI documents are the agent's own output.");
    if (/^app\//.test(rel)) {
      const b = branch();
      if (b.startsWith("fix/")) decide("ask", `Fix edit on ${b}; a human confirms each edit.`);
      decide("deny", "Code fixes only on a fix/* branch, and only as a PR/MR.");
    }
    // SDLC artefacts the team writes with Claude (intent, spec, plan, evidence, eval cases, tests): every edit confirmed by a human.
    if (/^(intent\.md|HANDOFF\.md|CLAUDE\.md|docs\/(spec|design|plan|evidence|gate)\.md|docs\/decisions\/[^/]+\.md|evals\/(cases|fixtures)\/[^/]+\.json|evals\/schema\.ts|test\/[^/]+\.test\.ts)$/.test(rel))
      decide("ask", `SDLC artefact '${rel}': a human confirms this edit.`);
    decide("deny", `Writes are limited to docs/diagnoses/, docs/verify/, docs/show-me/, docs/pr/, SDLC artefacts (ask) and app/ on a fix/* branch (ask). '${rel}' is protected.`);
  }
}
process.exit(0);
