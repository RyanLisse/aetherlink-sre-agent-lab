import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { Diagnosis } from "../evals/schema.ts";

// Pins the diagnosis contract in evals/schema.ts, independent of the eval cases.
// Assignment 3 exercise (see FACILITATOR.md): add a test here that expects a required
// `blast_radius` string field -> npm test goes red -> add the field to evals/schema.ts
// and to the *.good.json fixtures -> npm test goes green.

const goodFixtures = readdirSync("evals/fixtures").filter((f) => f.endsWith(".good.json"));
const good = (f: string) => JSON.parse(readFileSync(`evals/fixtures/${f}`, "utf8"));

test("schema accepts every *.good.json fixture", () => {
  assert.ok(goodFixtures.length >= 3, `expected at least 3 good fixtures, found ${goodFixtures.length}`);
  for (const f of goodFixtures) {
    const r = Diagnosis.safeParse(good(f));
    assert.ok(r.success, `${f}: ${r.success ? "" : r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
});

test("schema rejects a diagnosis with executes: true (the agent never executes)", () => {
  for (const f of goodFixtures) {
    const d = good(f);
    d.proposed_action.executes = true;
    assert.equal(Diagnosis.safeParse(d).success, false, f);
  }
});

test("schema rejects a diagnosis with fewer than 2 evidence items", () => {
  for (const f of goodFixtures) {
    const d = good(f);
    d.evidence = d.evidence.slice(0, 1);
    assert.equal(Diagnosis.safeParse(d).success, false, f);
  }
});

test("schema rejects a diagnosis without a root_cause category from the enum", () => {
  const d = good("inc-001.good.json");
  d.root_cause.category = "made-up-category";
  assert.equal(Diagnosis.safeParse(d).success, false);
});
