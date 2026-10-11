#!/usr/bin/env node
// Run by a HUMAN in their own terminal (host or `docker compose run --rm lab ...`). The hook blocks Claude from calling this.
// Usage: npm run approve -- <jouw-naam> <branch> "<reden>"    (of: node scripts/approve.mjs ...)
// Works the same for a GitHub or GitLab remote: the approval is tied to the branch, not to the host.
import { appendFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const [name, ref, reason, ...rest] = process.argv.slice(2);
const fail = (m) => { console.error(m); process.exit(1); };
if (!name || !ref || !reason || rest.length) fail('gebruik: npm run approve -- <jouw-naam> <branch> "<reden>"');
if (process.env.CLAUDECODE === "1") fail("Geweigerd: dit commando draait binnen een Claude Code-sessie. Alleen een mens keurt goed, in een eigen terminal.");
if (/^(claude|agent|ai|bot|assistant)$/i.test(name)) fail(`Geweigerd: '${name}' is geen benoemde mens.`);
if (!/^[\w.\/-]+$/.test(ref)) fail(`Ongeldige branch-naam: ${ref}`);

// Only the HOST name of the remote is logged (github.com, gitlab.<org>), never the URL: a URL can contain a token.
let remote_host = null;
try {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  remote_host = url.match(/^[a-z+]+:\/\/(?:[^@\/]*@)?([^:\/]+)/i)?.[1] ?? url.match(/^[^@\/]+@([^:]+):/)?.[1] ?? null;
} catch { /* no remote yet: fine for the lab */ }

mkdirSync("approvals", { recursive: true });
appendFileSync("approvals/approvals.jsonl", JSON.stringify({ at: new Date().toISOString(), approved_by: name, ref, reason, remote_host }) + "\n");
const kind = remote_host?.includes("gitlab") ? "gitlab" : remote_host?.includes("github") ? "github" : null;
console.log(`Goedgekeurd: ${ref} door ${name} (gelogd in approvals/approvals.jsonl).`);
console.log(`Volgende stap (jij, de mens, in je eigen terminal):
  git add -f approvals/approvals.jsonl approvals/audit.jsonl && git commit -m "approval: ${ref} by ${name}"
  git push -u origin ${ref}
  ${kind !== "gitlab" ? "GitHub:  gh pr create --fill" : ""}${kind === null ? "\n  " : ""}${kind !== "github" ? "GitLab:  glab mr create --fill" : ""}`);
