# Lab vs real environment, and the skill flag list

Handout for Workshop 5. One page. All data in this lab is fictional.

## Disclaimer: your data, your policy

- AetherLink does not receive, collect or keep your data. The lab runs on your own laptop.
- We are not responsible for external sources or tools.
- You may get external data. Your company policy applies. You are responsible.
- Not sure? Ask your security or IT team first.

## What the lab simulates

| In the lab | In a real environment |
|---|---|
| Incidents in `incidents/`: fictional alerts, logs, metrics and deploys | Real telemetry. It can hold customer and payment data. Access is controlled. |
| `checkout-api` and `psp-sandbox` are made up | Real services and payment providers. Never paste their data into a prompt without approval. |
| MCP server `sre`: 5 read-only tools on local files | An MCP server that your organisation approves, with its own login and audit. |
| Guard hook `guard.mjs`: regex rules, best effort | Managed settings from IT, a sandbox or a container. A regex is not a sandbox. |
| Approval: one line in `approvals/approvals.jsonl` | Protected branches and merge request approval rules with named reviewers. |
| CI: `.gitlab-ci.yml` on the public `node:24` image | Your own runners and a registry mirror (override `NODE_IMAGE`). |
| Remote: your own GitLab project (INSTALL.md Step 7b) | The group and project rules of your organisation. |
| Claude via your own login, or Vertex | Only the route your organisation approves. |
| No network for the agent | The egress policy of your organisation. |
| Vetted skills in `.claude/skills/` | Each external skill is reviewed first (slide "external-skill checklist", `npm run skill:scan`). Install per project, in a merge request. |

## Skill flags (full skills pack)

| Flag | Skills | What the flag means |
|---|---|---|
| ✅ OK | eli5, grilling, handoff, cli-for-agents, show-me, improve-claude-md | No network, no git host. Use as is. |
| ⚠️ With flag | review-and-ship, new-branch-and-pr, fix-ci, get-pr-comments, make-pr-easy-to-review | Only against your internal git host, and only behind the human gate (`gh`/`glab`). |
| ⚠️ With flag | rpi | Turn web search off. |
| ⚠️ With flag | visual-pr | Use it only to write the description. A human opens the PR/MR. |
| ⚠️ With flag | design-control-loop | Phases A–D only. |
| ⚠️ With flag | java-lts-migration | Only with your internal artifact repository. |
| ⚠️ With flag | deslop | The pack version runs `git fetch origin` itself. Only with your internal git host. |
| ⚠️ With flag | verify-this | The pack version writes evidence to `/tmp/verify-this/`. The lab version writes to `docs/verify/`. |
| ⛔ Not without IT | archify | It downloads and runs external code. |
| ⛔ Not without IT | build-iterated-agentic-loop | Rejected. It says "Do not stop and ask … or request approvals". It is not in the pack. |
