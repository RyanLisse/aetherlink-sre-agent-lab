import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { score } from "../evals/check.ts";

const cases = readdirSync("evals/cases").filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
const fx = (n: string) => JSON.parse(readFileSync(`evals/fixtures/${n}`, "utf8"));

test("the three built incidents each have a case, a good and a bad fixture", () => {
  for (const c of ["inc-001", "inc-002", "inc-004"]) assert.ok(cases.includes(c), `case ${c}`);
  // Teams add cases in the Maintain block (e.g. a stretch incident designed before its data exists); every case
  // that HAS fixtures must have both a good and a bad one, so the eval can pass and can fail.
  const fixtures = readdirSync("evals/fixtures");
  for (const c of cases) {
    const has = ["good", "bad"].filter((k) => fixtures.includes(`${c}.${k}.json`));
    assert.ok(has.length === 0 || has.length === 2, `${c}: needs both a good and a bad fixture (has: ${has.join(",")})`);
  }
});

for (const c of ["inc-001", "inc-002", "inc-004"]) {
  test(`${c}: good fixture PASSES, bad fixture is REJECTED`, () => {
    assert.equal(score(fx(`${c}.good.json`)).pass, true, JSON.stringify(score(fx(`${c}.good.json`)).fails));
    assert.equal(score(fx(`${c}.bad.json`)).pass, false);
  });
}

test("inc-004: blaming the docs-only deploy is rejected even with real citations", () => {
  const r = score(fx("inc-004.bad.json"));
  assert.ok(r.fails.some((f) => f.startsWith("trigger_deploy d-0160")));
  assert.ok(r.fails.some((f) => f.startsWith("distractor not ruled out")));
  assert.ok(!r.fails.some((f) => f.startsWith("invented evidence")), "bad fixture cites only real lines");
});

test("an invented log id is rejected on every incident (the eval can fail)", () => {
  for (const c of ["inc-001", "inc-002", "inc-004"]) {
    const d = fx(`${c}.good.json`); d.evidence.push({ log_id: "L9999", quote: "made up" });
    assert.ok(score(d).fails.includes("invented evidence L9999"), c);
  }
});

test("executes must be literally false", () => {
  const d = fx("inc-002.good.json"); d.proposed_action.executes = true;
  assert.equal(score(d).pass, false);
});
