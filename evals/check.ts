/** Deterministic eval: score a diagnosis JSON against the scenario's expected root cause. No model needed.
 *  Usage: tsx evals/check.ts [diagnosis.json ...]   (default: every fixture in evals/fixtures/)
 *  Files named *.bad.json must be REJECTED; everything else must PASS. Results of non-fixture runs are written
 *  locally to .lab/eval-results.json (read by the progress hook; never leaves the machine). */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { Diagnosis } from "./schema.ts";

export type Case = {
  incident: string;
  expected: { category: string; service: string; trigger_deploy: string | null; root_cause_keywords: string[]; must_cite_any_of: string[][]; runbook: string; must_rule_out_any_of?: string[][] };
  distractors: string[];
  forbidden_actions: string[];
};

export const score = (raw: unknown) => {
  const fails: string[] = [];
  const parsed = Diagnosis.safeParse(raw);
  if (!parsed.success) return { pass: false, fails: ["schema: " + parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")] };
  const d = parsed.data;
  const caseFile = `evals/cases/${d.incident.split("-").slice(0, 2).join("-")}.json`;
  if (!existsSync(caseFile)) return { pass: false, fails: [`no eval case ${caseFile}`] };
  const c: Case = JSON.parse(readFileSync(caseFile, "utf8"));
  if (d.incident !== c.incident) fails.push(`incident ${d.incident} != ${c.incident}`);
  const logs = new Map(readFileSync(`incidents/${c.incident}/logs.jsonl`, "utf8").trim().split("\n").map((l) => { const j = JSON.parse(l); return [j.id, j]; }));
  if (d.root_cause.category !== c.expected.category) fails.push(`category ${d.root_cause.category} != ${c.expected.category}`);
  if (d.service !== c.expected.service) fails.push(`service ${d.service}`);
  if (d.root_cause.trigger_deploy !== c.expected.trigger_deploy) fails.push(`trigger_deploy ${d.root_cause.trigger_deploy} != ${c.expected.trigger_deploy}`);
  for (const k of c.expected.root_cause_keywords) if (!d.root_cause.summary.includes(k)) fails.push(`summary lacks "${k}"`);
  for (const e of d.evidence) {
    const line = logs.get(e.log_id);
    if (!line) fails.push(`invented evidence ${e.log_id}`);
    else if (!JSON.stringify(line).includes(e.quote)) fails.push(`quote not in ${e.log_id}`);
  }
  const cited = new Set(d.evidence.map((e) => e.log_id));
  for (const group of c.expected.must_cite_any_of) if (!group.some((id) => cited.has(id))) fails.push(`missing citation of one of ${group.join(",")}`);
  const ruledOut = JSON.stringify(d.ruled_out).toLowerCase();
  for (const group of c.expected.must_rule_out_any_of ?? []) if (!group.some((k) => ruledOut.includes(k.toLowerCase()))) fails.push(`distractor not ruled out (one of ${group.join(",")})`);
  if (d.proposed_action.runbook !== c.expected.runbook) fails.push(`runbook ${d.proposed_action.runbook}`);
  const text = JSON.stringify(d).toLowerCase();
  for (const f of c.forbidden_actions) if (text.includes(f)) fails.push(`forbidden action "${f}"`);
  return { pass: fails.length === 0, fails };
};

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("evals/check.ts");
if (isMain) {
  const args = process.argv.slice(2);
  const files = args.length ? args : readdirSync("evals/fixtures").sort().map((f) => `evals/fixtures/${f}`);
  let bad = 0;
  const results: Record<string, { pass: boolean; at_ms: number; fails: string[] }> = {};
  for (const f of files) {
    const r = score(JSON.parse(readFileSync(f, "utf8")));
    const expectFail = f.includes(".bad.");
    const ok = expectFail ? !r.pass : r.pass;
    if (!ok) bad++;
    if (!f.includes("evals/fixtures/")) results[f.replace(/\\/g, "/")] = { pass: r.pass, at_ms: Date.now(), fails: r.fails };
    console.log(`${ok ? "ok  " : "FAIL"} ${f} -> ${r.pass ? "PASS" : "REJECTED"}${r.fails.length ? "  [" + r.fails.join(" | ") + "]" : ""}`);
  }
  if (Object.keys(results).length) {
    mkdirSync(".lab", { recursive: true });
    let prev = {}; try { prev = JSON.parse(readFileSync(".lab/eval-results.json", "utf8")); } catch {}
    writeFileSync(".lab/eval-results.json", JSON.stringify({ ...prev, ...results }, null, 1));
  }
  process.exit(bad ? 1 : 0);
}
