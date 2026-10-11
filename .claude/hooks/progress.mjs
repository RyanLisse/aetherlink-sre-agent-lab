#!/usr/bin/env node
// Progress hook (SessionStart, PostToolUse, Stop). Rebuilds the AUTO block in progress.md from real evidence in the repo.
// Local only: reads files and `git branch`, writes ONLY progress.md. No network, nothing leaves the machine.
// Never blocks Claude: any error is swallowed and the hook exits 0 without output.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const START = "<!-- AUTO:START (bijgewerkt door .claude/hooks/progress.mjs; niet met de hand bewerken) -->";
const END = "<!-- AUTO:END -->";
const BASE_CASES = 3; // inc-001, inc-002, inc-004 ship with the lab

const f = (p) => join(root, p);
const read = (p) => { try { return readFileSync(f(p), "utf8"); } catch { return ""; } };
const ls = (p, re = /./) => { try { return readdirSync(f(p)).filter((n) => re.test(n)).sort(); } catch { return []; } };
const jsonl = (p) => read(p).split(/\r?\n/).filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
const mtime = (p) => { try { return statSync(f(p)).mtimeMs; } catch { return 0; } };
const filled = (p, minLen = 200) => { const t = read(p); return t.length >= minLen && !/\bTODO\b|<team>|<naam>/.test(t); };

export function evidence() {
  const audit = jsonl("approvals/audit.jsonl");
  const approvals = jsonl("approvals/approvals.jsonl");
  const diag = ls("docs/diagnoses", /^inc-\d{3}.*\.json$/);
  let evals = {}; try { evals = JSON.parse(read(".lab/eval-results.json") || "{}"); } catch { evals = {}; }
  const passing = diag.filter((d) => { const r = evals[`docs/diagnoses/${d}`]; return r?.pass && r.at_ms >= mtime(`docs/diagnoses/${d}`); });
  const cases = ls("evals/cases", /^inc-\d{3}\.json$/);
  const verdicts = ls("docs/verify").filter((d) => existsSync(f(`docs/verify/${d}/verdict.md`)));
  let fixBranches = [];
  try { fixBranches = execFileSync("git", ["-C", root, "branch", "--list", "fix/*", "--format=%(refname:short)"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean); } catch {}
  const intent = read("intent.md");
  const intentOk = filled("intent.md") && ["Problem", "outcome", "users", "Constraints", "Open questions"].every((h) => intent.toLowerCase().includes(h.toLowerCase()));
  const fixApproval = approvals.filter((a) => /^fix\//.test(a.ref ?? ""));
  return [
    { step: "0 · Setup (10:45)", done: existsSync(f("node_modules/@modelcontextprotocol")) && audit.length > 0,
      proof: `node_modules ${existsSync(f("node_modules/@modelcontextprotocol")) ? "ok" : "ontbreekt (npm ci)"}; guard-hook ${audit.length > 0 ? `actief (${audit.length} regels in audit.jsonl)` : "nog niet gevuurd"}` },
    { step: "1 · Plan: intent.md (11:15)", done: intentOk, proof: intentOk ? "intent.md ingevuld (5 velden, geen <team>/TODO)" : "intent.md: vul de 5 velden in en vervang <team>" },
    { step: "2 · Design: spec.md + schema (11:40)", done: filled("docs/spec.md") && existsSync(f("evals/schema.ts")), proof: filled("docs/spec.md") ? "docs/spec.md ingevuld" : "docs/spec.md bevat nog TODO" },
    { step: "3 · Build 1: control layer (13:00)", done: audit.some((a) => a.decision === "deny"), proof: `${audit.filter((a) => a.decision === "deny").length} deny-beslissing(en) in audit.jsonl` },
    { step: "4 · Build 2: plan + diagnose (13:50)", done: filled("docs/plan.md") && diag.length > 0, proof: `plan.md ${filled("docs/plan.md") ? "ingevuld" : "nog TODO"}; diagnoses: ${diag.join(", ") || "geen"}` },
    { step: "5 · Test: eval PASS + verify (14:55)", done: passing.length > 0 && verdicts.length > 0, proof: `eval PASS (actueel): ${passing.join(", ") || "geen"}; verify-verdicts: ${verdicts.length}` },
    { step: "6 · Deploy: gate (15:15)", done: fixApproval.length > 0, proof: fixApproval.length ? `goedgekeurd: ${fixApproval.map((a) => `${a.ref} door ${a.approved_by}`).join("; ")}` : `fix-branches: ${fixBranches.join(", ") || "geen"}; nog geen benoemde goedkeuring` },
    { step: "7 · Maintain: incident → eval-case (15:30)", done: cases.length > BASE_CASES, proof: `${cases.length} eval-cases (lab levert er ${BASE_CASES})` },
    { step: "8 · Hackathon: intent + HANDOFF.md (15:40)", done: filled("HANDOFF.md", 100), proof: existsSync(f("HANDOFF.md")) ? "HANDOFF.md aanwezig" : "HANDOFF.md ontbreekt" },
  ];
}

export function render(rows) {
  const n = rows.filter((r) => r.done).length;
  return [START, `**Automatische voortgang: ${n}/${rows.length} stappen met bewijs.**`, "",
    ...rows.map((r) => `- [${r.done ? "x" : " "}] ${r.step} — ${r.proof}`), END].join("\n");
}

export function update() {
  const block = render(evidence());
  const cur = read("progress.md");
  let next;
  if (cur.includes(START.slice(0, 16)) && cur.includes(END)) {
    const a = cur.indexOf("<!-- AUTO:START"), b = cur.indexOf(END) + END.length;
    next = cur.slice(0, a) + block + cur.slice(b);
  } else next = (cur ? cur.trimEnd() + "\n\n" : "# progress.md\n\n") + block + "\n";
  if (next !== cur) writeFileSync(f("progress.md"), next);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("progress.mjs")) {
  try { readFileSync(0, "utf8"); } catch {}
  try { update(); } catch {}
  process.exit(0);
}
