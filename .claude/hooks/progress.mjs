#!/usr/bin/env node
// Progress hook (SessionStart, PostToolUse, Stop) for PROGRESS.md, which follows the claude-code-skills-pack
// PROGRESS.md template: a historical, append-only build log. When a lesson step (STEP-0..STEP-9) has local evidence
// for the first time, the hook APPENDS one dated entry for it (feature-entry shape). It never edits or deletes
// existing text, so everything humans write (Why it mattered, How, Deliberately not done, own entries) is preserved.
// Local only: reads files and `git branch`, writes ONLY PROGRESS.md. No network. Never blocks Claude (always exit 0).
// `node .claude/hooks/progress.mjs --status` prints the live checklist to the terminal and writes nothing.
import { readFileSync, appendFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const FILE = "PROGRESS.md";
const BASE_CASES = 3; // inc-001, inc-002, inc-004 ship with the lab
const TODO = (what) => `<fill in: ${what}>`;

const f = (p) => join(root, p);
const read = (p) => { try { return readFileSync(f(p), "utf8"); } catch { return ""; } };
const ls = (p, re = /./) => { try { return readdirSync(f(p)).filter((n) => re.test(n)).sort(); } catch { return []; } };
const lsr = (p, re) => { const out = []; const walk = (d) => { for (const n of ls(d)) { const q = `${d}/${n}`; try { statSync(f(q)).isDirectory() ? walk(q) : re.test(n) && out.push(q); } catch {} } }; walk(p); return out.sort(); };
const jsonl = (p) => read(p).split(/\r?\n/).filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
const mtime = (p) => { try { return statSync(f(p)).mtimeMs; } catch { return 0; } };
const filled = (p, minLen = 200) => { const t = read(p); return t.length >= minLen && !/\bTODO\b|<team>|<name>/.test(t); };
const pad = (n) => String(n).padStart(2, "0");
// ISO 8601 local time with offset, e.g. 2026-10-11T21:56:00+02:00 (the build-log header format).
export const isoLocal = (d = new Date()) => {
  const off = -d.getTimezoneOffset(), sign = off >= 0 ? "+" : "-", a = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
};
const now = () => ({ stamp: isoLocal() });

// Each step: done (bool), title (past tense), shipped (What shipped), validation (the evidence the hook saw).
export function evidence() {
  const audit = jsonl("approvals/audit.jsonl");
  const denies = audit.filter((a) => a.decision === "deny");
  const approvals = jsonl("approvals/approvals.jsonl").filter((a) => /^fix\//.test(a.ref ?? "") && a.approved_by);
  const diag = ls("docs/diagnoses", /^inc-\d{3}.*\.json$/);
  let evals = {}; try { evals = JSON.parse(read(".lab/eval-results.json") || "{}"); } catch { evals = {}; }
  const passing = diag.filter((d) => { const r = evals[`docs/diagnoses/${d}`]; return r?.pass && r.at_ms >= mtime(`docs/diagnoses/${d}`); });
  const cases = ls("evals/cases", /^inc-\d{3}\.json$/);
  const verdicts = ls("docs/verify").filter((d) => existsSync(f(`docs/verify/${d}/verdict.md`)));
  const decisions = [...lsr("docs/decisions", /\.md$/), ...lsr("docs/rpi", /\.md$/)].filter((d) => !/(^|\/)README\.md$/i.test(d));
  const intent = read("intent.md");
  const intentOk = filled("intent.md") && ["Problem", "outcome", "users", "Constraints", "Open questions"].every((h) => intent.toLowerCase().includes(h.toLowerCase()));
  const sdk = existsSync(f("node_modules/@modelcontextprotocol"));
  const skills = ls(".claude/skills").filter((s) => existsSync(f(`.claude/skills/${s}/SKILL.md`)));
  let fixBranches = [];
  try { fixBranches = execFileSync("git", ["-C", root, "branch", "--list", "fix/*", "--format=%(refname:short)"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean); } catch {}
  return [
    { key: "STEP-0", name: "Setup", done: sdk && audit.length > 0, title: "Set up the lab and saw the guard hook fire",
      shipped: "Local lab environment: dependencies installed (`npm ci`), Claude Code started in the repo with the project settings trusted.",
      validation: `\`node_modules/@modelcontextprotocol\` ${sdk ? "present" : "missing (run npm ci)"}; guard hook wrote ${audit.length} line(s) to \`approvals/audit.jsonl\`.`,
      hint: sdk ? "start `claude` in the repo and accept trust, so the guard hook fires" : "run `npm ci`" },
    { key: "STEP-1", name: "Plan: intent.md", done: intentOk, title: "Recorded the team intent in intent.md",
      shipped: "`intent.md` with the five fields (Problem, Proposed outcome, Affected users and systems, Constraints, Open questions).",
      validation: "`intent.md` has all five headings, no `<team>`/TODO placeholders, and at least 200 characters.",
      hint: "fill the five fields of intent.md and replace <team>" },
    { key: "STEP-2", name: "Spec: docs/spec.md", done: filled("docs/spec.md"), title: "Described the diagnosis contract in docs/spec.md",
      shipped: "`docs/spec.md`: the `Diagnosis` fields and flagged concerns, against `evals/schema.ts`.",
      validation: "`docs/spec.md` filled in (no TODO, at least 200 characters).", hint: "replace the TODOs in docs/spec.md" },
    { key: "STEP-3", name: "Design: decision recorded", done: decisions.length > 0, title: "Recorded a design decision",
      shipped: `Design document(s): ${decisions.map((d) => `\`${d}\``).join(", ") || "none"}.`,
      validation: `${decisions.length} markdown file(s) under \`docs/decisions/\` or \`docs/rpi/\`.`,
      hint: "create docs/decisions/D01-<topic>.md from the template in docs/decisions/README.md (or use /rpi)" },
    { key: "STEP-4", name: "Build: control layer (MCP, skills, hooks)", done: sdk && denies.length > 0, title: "Proved the control layer: the hook refused an action",
      shipped: `Control layer in place: local \`sre\` MCP server, ${skills.length} project skills in \`.claude/skills/\`, guard hook in \`.claude/hooks/guard.mjs\`.`,
      validation: `${denies.length} deny decision(s) in \`approvals/audit.jsonl\`${denies.length ? `; latest: "${String(denies[denies.length - 1].reason ?? "").slice(0, 100)}"` : ""}. Run \`npm run test:hooks\` for the full suite.`,
      hint: "let Claude try a blocked action (e.g. curl) and run npm run test:hooks" },
    { key: "STEP-5", name: "Diagnose: plan + diagnosis", done: filled("docs/plan.md") && diag.length > 0, title: `Wrote the diagnosis for ${diag.map((d) => d.replace(/\.json$/, "")).join(", ") || "an incident"}`,
      shipped: `\`docs/plan.md\` (accepted in plan mode) and diagnosis file(s): ${diag.map((d) => `\`docs/diagnoses/${d}\``).join(", ") || "none"}.`,
      validation: `\`docs/plan.md\` ${filled("docs/plan.md") ? "filled in" : "still has TODO"}; ${diag.length} diagnosis JSON file(s).`,
      hint: "fill docs/plan.md in plan mode and write docs/diagnoses/inc-00N.json" },
    { key: "STEP-6", name: "Test: eval PASS + verify", done: passing.length > 0 && verdicts.length > 0, title: `Passed the eval for ${passing.join(", ") || "a diagnosis"} and verified a claim`,
      shipped: `Evaluated diagnosis(es) and \`/verify-this\` verdict(s): ${verdicts.map((v) => `\`docs/verify/${v}/verdict.md\``).join(", ") || "none"}.`,
      validation: `\`npm run eval -- docs/diagnoses/<file>\` PASS and newer than the diagnosis for: ${passing.join(", ") || "none"} (from \`.lab/eval-results.json\`); ${verdicts.length} verdict(s).`,
      hint: "run npm run eval -- docs/diagnoses/<file> until PASS, then /verify-this" },
    { key: "STEP-7", name: "Gate: named approval + PR/MR", done: approvals.length > 0, title: `Passed the human gate for ${approvals.map((a) => a.ref).filter((v, i, x) => x.indexOf(v) === i).join(", ") || "a fix branch"}`,
      shipped: `Named approval(s) in \`approvals/approvals.jsonl\`: ${approvals.map((a) => `\`${a.ref}\` by ${a.approved_by}`).join("; ") || "none"}. PR (GitHub) / MR (GitLab) opened by a human.`,
      validation: `Approval line(s) found for fix branch(es); local fix branches: ${fixBranches.join(", ") || "none"}. CI check: \`npm run check:approval\`.`,
      hint: "a human runs npm run approve -- <name> fix/<branch> \"<reason>\"" },
    { key: "STEP-8", name: "Maintain: incident → eval case", done: cases.length > BASE_CASES, title: "Turned an incident into an eval case",
      shipped: `New eval case(s): ${cases.filter((c) => !["inc-001.json", "inc-002.json", "inc-004.json"].includes(c)).map((c) => `\`evals/cases/${c}\``).join(", ") || "none"}.`,
      validation: `${cases.length} eval case(s) in \`evals/cases/\` (the lab ships ${BASE_CASES}).`, hint: "add evals/cases/inc-00N.json" },
    { key: "STEP-9", name: "Hackathon: intent + HANDOFF.md", done: filled("HANDOFF.md", 100), title: "Wrote the hackathon handoff",
      shipped: "`HANDOFF.md` for day 1 of the hackathon (decided, OPEN, first steps).",
      validation: "`HANDOFF.md` present, at least 100 characters, no TODO.", hint: "run /handoff and save HANDOFF.md" },
  ];
}

export const marker = (key) => `<!-- auto: ${key} -->`;

export function entry(row, t = now()) {
  return [
    `## ${t.stamp} — ${row.title} (${row.key})`, marker(row.key), "",
    `- **What shipped:** ${row.shipped}`,
    `- **Why it mattered:** ${TODO("which gap or decision made this worth doing")}`,
    `- **How, and what was rejected:** ${TODO("the approach in one or two sentences, and the alternative you did not take")}`,
    `- **Validation:** ${row.validation} Recorded by \`.claude/hooks/progress.mjs\` from local files only, at the time in the header; not a claim about anything not listed here.`,
    `- **Deliberately not done:** ${TODO("what you left out on purpose, with an owner or a reason")}`,
    "", "---", "",
  ].join("\n");
}

// Append an entry for every step that has evidence and no entry yet. Never rewrites existing text.
export function update() {
  if (!existsSync(f(FILE))) return; // the template file is part of the repo; do not invent one
  const cur = read(FILE);
  const fresh = evidence().filter((r) => r.done && !cur.includes(marker(r.key)));
  if (!fresh.length) return;
  const t = now();
  appendFileSync(f(FILE), (cur.endsWith("\n") ? "\n" : "\n\n") + fresh.map((r) => entry(r, t)).join("\n"));
}

export function status() {
  const cur = read(FILE);
  const rows = evidence();
  const lines = rows.map((r) => `${r.done ? "[x]" : "[ ]"} ${r.key} ${r.name}${cur.includes(marker(r.key)) ? " (logged)" : ""}${r.done ? "" : ` → ${r.hint}`}`);
  return `aetherlink-sre-agent-lab: ${rows.filter((r) => r.done).length}/${rows.length} steps with evidence\n${lines.join("\n")}`;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith(".claude/hooks/progress.mjs")) {
  if (process.argv.includes("--status")) { try { console.log(status()); } catch (e) { console.log(`status unavailable: ${e.message}`); } process.exit(0); }
  try { readFileSync(0, "utf8"); } catch {}
  try { update(); } catch {}
  process.exit(0);
}
