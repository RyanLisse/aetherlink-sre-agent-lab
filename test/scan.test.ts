import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const scan = (p: string) => spawnSync(process.execPath, ["scripts/scan-skill.mjs", p], { encoding: "utf8" });

test("skill scanner flags the suspicious fixture (shell-on-load, network, injection, secrets)", () => {
  const r = scan("test/fixtures/suspicious-skill");
  assert.equal(r.status, 1);
  for (const id of ["shell-on-load", "broad-tools", "network", "injection", "secrets", "html-comment", "pipe-to-shell"]) assert.match(r.stdout, new RegExp(`\\[${id}\\]`), id);
});

test("skill scanner also flags our own review-and-ship (allowed-tools + shell-on-load): reviewed and accepted", () => {
  const r = scan(".claude/skills/review-and-ship");
  assert.match(r.stdout, /\[allowed-tools\]/);
  assert.match(r.stdout, /\[shell-on-load\]/);
});
