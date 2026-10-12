# aetherlink-sre-agent-lab

**Training demo by AetherLink Academy, Workshop 5 (AI-native SDLC).** Fictional sample data only: no real systems, customers or payment data. Meant for learning, not for production.

An SRE agent on a small demo app (`checkout-api`). The agent reads alerts, logs, metrics and deploys via a local, read-only MCP server (`sre`), produces a diagnosis with cited evidence, and proposes one runbook step or a fix as a PR/MR. **It never executes anything.** Hooks enforce that; a named human approves, pushes and merges.

- Step-by-step install (standard, no Docker): **[INSTALL.md](INSTALL.md)**
- Docker alternative, for anyone who has trouble or prefers it: **[INSTALL-DOCKER.md](INSTALL-DOCKER.md)**
- Running the workshop? Per-block commands, expected output and common failures: **[FACILITATOR.md](FACILITATOR.md)**

## ⚠️ Disclaimer: your data, your policy

- This lab runs fully **locally on your own laptop**, with fictional sample data.
- **AetherLink (and Ryan Lisse) receives, collects or stores no data from participants or their organisation**: no prompts, code, logs, credentials, diagnoses or telemetry. There is no server of ours anything goes to.
- Claude Code uses **your own login** (your own Claude account or API key, or your own organisation's Vertex environment). What happens there falls under your agreements with that provider.
- If you fetch external data, external skills or tools (for example the full skills pack, or `archify`, which downloads external code), you do so **under your own organisation's policy and at your own risk**. AetherLink is not responsible for the content, working or use of external sources, tools or data.
- In doubt? Ask your security or IT team first.

## Quick start

The lab itself (tests, evals, hooks, MCP server, progress hook, CI) needs **no model and no login**.

### Standard: no Docker (Windows, macOS, Linux)

Needed: Git, Node.js LTS (22 or newer) and Claude Code ([INSTALL.md](INSTALL.md)).

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
npm ci
npm test               # expect: "pass 17" and "fail 0"
npm run test:hooks     # expect: three times "fail=0"
npm run eval           # expect: 6 lines starting with "ok"
claude                 # trust question: Yes · MCP server sre: approve · /status · /mcp
```

All hooks and the MCP server start with plain `node` (no bash, no `npx`), so they work the same in PowerShell, Git Bash, zsh and bash.

### Alternative: Docker

```
docker compose build
docker compose up lab                                          # tests, no network: "pass 17", "fail 0"
docker compose -f compose.yaml -f compose.agent.yaml run --rm agent   # Claude Code in the container, your own login
```

Details, Dev Containers and the optional Vertex route: [INSTALL-DOCKER.md](INSTALL-DOCKER.md).

### Optional: via Vertex (for example at Worldline)

Only if your organisation offers Claude via Google Vertex AI: set `CLAUDE_CODE_USE_VERTEX=1`, `ANTHROPIC_VERTEX_PROJECT_ID` and `CLOUD_ML_REGION` (values from your own IT) and log in with `gcloud auth application-default login`. See [INSTALL.md](INSTALL.md#optional-at-worldline--via-vertex) and, in Docker, `compose.vertex.yaml`. Without those variables Vertex plays no role.

## Contents: step tags

`main` is the starting point (templates). If you fall behind, or want to see an example, each block has a worked-out version ready as tag `step-N` (and branch `steps/N-…`):

| Tag | Block | What it adds (example) |
|---|---|---|
| `step-1` | Plan | filled-in `intent.md` |
| `step-2` | Design | filled-in `docs/spec.md` |
| `step-3` | Build 1 | your own guard rule + test |
| `step-4` | Build 2 | `docs/plan.md` + diagnosis inc-001 (PASS) |
| `step-5` | Test | `/verify-this` verdict in `docs/verify/` |
| `step-6` | Deploy (gate) | config fix, named approval (`facilitator-example`), PR/MR description |
| `step-7` | Maintain | new eval case (inc-003, design) |
| `step-8` | Hackathon | `HANDOFF.md` |

Look without losing your own work: `git diff main step-4`, or in a separate folder: `git worktree add ../lab-step-4 step-4`. Note: steps STEP-0 and STEP-4 in `PROGRESS.md` only get an entry once the hook has fired in your own session (evidence in `approvals/audit.jsonl`, which is not in git). The step tags themselves still contain the older `progress.md`; `main` has the new `PROGRESS.md`.

## Commands

| What | Command (Docker route: prefix with `docker compose run --rm lab`) |
|---|---|
| Test MCP + evals + skill scanner | `npm test` |
| Test guard and progress hooks | `npm run test:hooks` |
| All eval fixtures (good = PASS, bad = REJECTED) | `npm run eval` |
| Check one diagnosis | `npm run eval -- docs/diagnoses/inc-001.json` |
| Approve (**a human only**, in their own terminal) | `npm run approve -- <your-name> fix/<branch> "<reason>"` |
| Gate check as in CI | `npm run check:approval` |
| Scan an outside skill | `npm run skill:scan -- <folder>` |
| View progress (writes nothing) | `npm run progress -- --status` |
| Update `PROGRESS.md` manually | `npm run progress` |

`npm run progress -- --status` shows the current state and writes nothing. `PROGRESS.md` is the history: the hook appends one entry per step with an ISO 8601 timestamp (e.g. `2026-10-11T11:20:00+02:00`); your own verified entry goes at the bottom, with the same timestamp shape.

## Incidents

| ID | Scenario | Status |
|---|---|---|
| `inc-001-db-pool` | DB pool exhausted after a config change (deploy d-0142) | built |
| `inc-002-bad-deploy` | Feature flag in deploy d-0151 breaks only EUR checkouts; a cron warning is the distractor | built |
| `inc-004-upstream-timeout` | psp-sandbox slow + retry storm; a docs-only deploy just before is the distractor | built |
| inc-003 · inc-005 | Memory leak · certificate expired | stretch, see `docs/stretch-incidents.md` |

Every built incident has `alert.json`, `logs.jsonl` (stable ids like `L0021`), `metrics.csv`, `deploys.json`, a runbook in `runbooks/`, an eval case in `evals/cases/` and a good **and** a bad fixture. inc-002 and inc-004 come from `npm run generate` (fixed seed, so always the same data).

## Control layer

- **`.claude/settings.json`**: allow/ask/deny, `disableBypassPermissionsMode`, `disableSkillShellExecution`, only MCP server `sre`.
- **`.claude/hooks/guard.mjs`** (PreToolUse, Node, no bash/jq needed): blocks network, secrets and `approvals/`; writes only allowed in `docs/diagnoses/`, `docs/verify/`, `docs/show-me/` and `docs/pr/`; SDLC artefacts (intent, spec, plan, eval cases) and `app/` on a `fix/*` branch only after confirmation; push, PR (`gh`) and MR (`glab`) only after a named approval; merge and PR/MR approve never by the agent. Every decision goes to `approvals/audit.jsonl`.
- **`.claude/hooks/progress.mjs`** (SessionStart, PostToolUse, Stop): appends an entry per step to `PROGRESS.md` (the build log from the skills-pack template) as soon as there is real evidence (`STEP-0` … `STEP-9`). Append-only: existing text is never changed; you fill in the *Why it mattered*, *How, and what was rejected* and *Deliberately not done* fields yourself. Writes only `PROGRESS.md`, locally, without network.
- Regex rules are best-effort. Stronger isolation: the Docker route (`lab` without network), the [Claude Code sandbox](https://code.claude.com/docs/en/sandboxing) or your IT's managed settings.

### Test-first exercises (red → green)

Two assignments are deliberately test-first. The test must really go red first, or the exercise proves nothing:

- **Schema (Spec block):** `test/schema.test.ts` pins the contract in `evals/schema.ts`. Exercise, word for word: *"Add a test in `test/schema.test.ts` that expects a required `blast_radius` string field. Run `npm test`: red. Add `blast_radius` to `evals/schema.ts` and to the good fixtures. Run `npm test`: green."* See [FACILITATOR.md](FACILITATOR.md) for the reference solution.
- **Deny rule (Controls block):** pick a command that is **not** covered yet, so the new rule goes red first. Good examples: `rm -rf`, `git reset --hard`, `terraform destroy`. Do **not** use `kubectl delete` as the example: `kubectl` is already in `GATED` in `.claude/hooks/guard.mjs`, so a test-first rule can never go red.
- **By design, Claude cannot do these edits for you.** `.claude/settings.json` denies `Edit(./.claude/**)` and the guard limits writes, so `guard.mjs` and `test/hooks.test.mjs` are off limits for the agent. The participant edits `guard.mjs` and the hook test themselves; Claude only suggests the change. SDLC artefacts the team writes *with* Claude (schema, spec, eval cases, `test/*.test.ts`) stay reachable via the `ask` permission.

## The gate: GitHub and GitLab

1. Claude works on `fix/<name>`; every edit in `app/` asks your confirmation, as does the commit.
2. Claude tries to push → **deny** (no approval).
3. A named human (not the author) runs in **their own terminal** (not via Claude): `npm run approve -- <name> fix/<name> "<reason>"` (Docker route: `docker compose run --rm lab npm run approve -- …`).
4. The human does the last step themselves, with their own git login (the hook does not let Claude push without an approval, and the Docker route deliberately has no git credentials in the container):

```
git add -f approvals/approvals.jsonl approvals/audit.jsonl
git commit -m "approval: fix/<name> by <name>"
git push -u origin fix/<name>
gh pr create --fill          # GitHub: pull request (PR)
glab mr create --fill        # GitLab: merge request (MR)
```

If Claude put a description in `docs/pr/<branch>.md` with `/visual-pr`, use it: `gh pr create --title "<title>" --body-file docs/pr/<branch>.md` or `glab mr create --title "<title>" --description "$(cat docs/pr/<branch>.md)"` (PowerShell: `--description (Get-Content -Raw docs/pr/<branch>.md)`).

5. CI (`.github/workflows/ci.yml` or `.gitlab-ci.yml`) runs `npm test`, `test:hooks`, `eval` and `check:approval` offline. A human merges, via branch protection (GitHub) or MR approval rules (GitLab).

## Progress evidence: what the hook looks for

`npm run progress -- --status` shows `STEP-0` … `STEP-9`. Most steps detect themselves; two need a file you create on purpose:

- **STEP-3 (Design: decision recorded):** create `docs/decisions/D01-<topic>.md`. A 5-line template is in [docs/decisions/README.md](docs/decisions/README.md). A document under `docs/rpi/` (from `/rpi`) also counts.
- **STEP-6 (Test: eval PASS + verify):** run `npm run eval -- docs/diagnoses/<file>` until PASS **and** write a `/verify-this` verdict to `docs/verify/<claim>/verdict.md`. Both must exist.

## Skills

`.claude/skills/` contains a **vetted subset**, adapted for this lab: no network, no `!` shell lines, and no skill pushes, merges or opens a PR/MR itself (the human does that after the gate).

| Skill | What for (moment in the workshop) | Origin | Lab adaptation |
|---|---|---|---|
| `incident-triage` | SRE policy for every diagnosis | this lab | n/a |
| `design-control-loop` | Plan: design interview, fills `intent.md` (11:25) | HumanLayer | phases A–B only; no CI agent, API keys or bypass |
| `grilling` | Plan: fallback for the interview | mattpocock/skills | none |
| `rpi` | Optional/hackathon: research → plan → implement | HumanLayer | artefacts in `docs/rpi/`, no web-research agent |
| `show-me` | Explain a diagnosis as HTML (13:52) | HumanLayer | `docs/show-me/`, self-contained, no `open` |
| `eli5` | Fallback for `show-me`: explain simply | skills pack | none |
| `verify-this` | Test: prove a claim (14:55) | skills pack (Cursor team-kit) | writes to `docs/verify/` |
| `review-and-ship` | Gate: review up to the human approval (15:15) | skills pack (Cursor team-kit) | knows `glab`, stops at the gate |
| `visual-pr` | Gate: PR/MR description with diagram (15:18) | HumanLayer | writes only `docs/pr/<branch>.md` |
| `new-branch-and-pr` | Prepare branch + commit | skills pack (Cursor team-kit) | stops at the commit; the human approves, pushes, `gh pr`/`glab mr` |
| `make-pr-easy-to-review` | Review guide for a large PR/MR | skills pack (Cursor team-kit) | writes `docs/pr/`; cleanup plan for the human only |
| `get-pr-comments` | Process review comments | skills pack (Cursor team-kit) | reads `docs/pr/comments.md` that you export |
| `fix-ci` | Reproduce and fix a red CI locally | skills pack (Cursor team-kit) | local CI commands; you paste logs in `docs/ci/`; no push |
| `deslop` | Remove AI noise from your diff | skills pack (Cursor team-kit) | diff against local `main`, no `git fetch` |
| `improve-claude-md` | Maintain: sharpen `CLAUDE.md` (15:30) | HumanLayer | none; a change to `CLAUDE.md` always asks your consent |
| `cli-for-agents` | Hackathon: build CLIs agents can use well | skills pack (Cursor) | none |
| `handoff` | Hackathon: write `HANDOFF.md` (15:40) | skills pack | none |

Deliberately **not** in the lab: `archify` (fetches external code via `git clone`/`npx`; the lab runs without network, the guard would block it; it stays in the skills pack, with the warning about external code), `java-lts-migration` (a Java migration, does not fit this lab) and `build-iterated-agentic-loop` (runs unattended, with API keys and without permission prompts).

### Skills from outside our pack: read first, then install

A skill is code that gives your agent instructions and sometimes permissions. Go through this before you install anything:

1. **Source**: who maintains it? Pin a fixed commit, no "latest".
2. **Read `SKILL.md` completely**: `allowed-tools` (does it ask for broad `Bash`?), `!` lines (shell commands that run on load), `disable-model-invocation`.
3. **Prompt injection**: sentences like "ignore previous instructions", "do not tell the user", hidden text in HTML comments, invisible characters, base64 blocks.
4. **Scripts** (`*.sh`, `*.py`, `*.js`, `*.ps1`): read every line. Watch for `curl | sh`, `eval`, `base64 -d`, installs (`npx`, `pip install`, `git clone`).
5. **Network and exfiltration**: every URL and every domain. Where does data go? Also `git push` to another remote, `gh gist`, `printenv`.
6. **Secrets**: does it read `.env`, `~/.ssh`, tokens, gcloud credentials?
7. **Install per project** in `.claude/skills/`, via a PR/MR with a second reviewer. Not in `~/.claude/skills/` (that applies to all your projects and wins over the project version).
8. **Test first** in this lab (preferably the `lab` container without network) and look in `approvals/audit.jsonl` at what it tries.
9. **Doubt = do not install.** Ask security/IT.

Helper: `npm run skill:scan -- <folder>` flags suspicious lines. An empty list does **not** mean the skill is safe.

## Troubleshooting

See "Not working?" in [INSTALL.md](INSTALL.md) and [INSTALL-DOCKER.md](INSTALL-DOCKER.md).

## Licence

MIT, see [LICENSE](LICENSE). The skills `design-control-loop`, `show-me`, `visual-pr`, `rpi` and `improve-claude-md` in `.claude/skills/` come (partly adapted) from [humanlayer/skills](https://github.com/humanlayer/skills) (MIT, Copyright (c) 2026 HumanLayer); `grilling` from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT); the rest from [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) (MIT, partly based on Cursor team-kit, MIT). See [NOTICE.md](NOTICE.md).
