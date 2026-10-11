#!/usr/bin/env node
// CI gate, same logic on GitHub Actions and GitLab CI: a fix/* branch must carry a named human approval
// (approvals/approvals.jsonl, committed with `git add -f` by the human). Not an identity proof: the real
// gate stays branch protection (GitHub) or MR approval rules (GitLab) with a named reviewer.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const env = process.env;
const branch = env.GITHUB_HEAD_REF || env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME || env.CI_COMMIT_REF_NAME || env.GITHUB_REF_NAME ||
  (() => { try { return execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim(); } catch { return ""; } })();
const platform = env.GITHUB_ACTIONS ? "GitHub (PR)" : env.GITLAB_CI ? "GitLab (MR)" : "lokaal";
if (!/^fix\//.test(branch)) { console.log(`check-approval: '${branch}' is geen fix/*-branch; niets te controleren (${platform}).`); process.exit(0); }
const f = "approvals/approvals.jsonl";
const rows = existsSync(f) ? readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }) : [];
const a = rows.filter((r) => r.ref === branch && r.approved_by && !/^(claude|agent|ai|bot|assistant)$/i.test(r.approved_by)).pop();
if (!a) { console.error(`check-approval: GEEN benoemde goedkeuring voor '${branch}' in ${f} (${platform}). Een mens draait: npm run approve -- <naam> ${branch} "<reden>" en commit het bestand met git add -f.`); process.exit(1); }
console.log(`check-approval: ${branch} goedgekeurd door ${a.approved_by} (${a.at}) — ${platform}.`);
