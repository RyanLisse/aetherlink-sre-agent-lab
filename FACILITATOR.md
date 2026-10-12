# Facilitator guide

Everything you need to run Workshop 5 with this lab: per block the goal, the time box, the exact commands, the output you can check at a glance, the most common failure with its fix, and the `step-N` tag to catch a team up.

- Participants follow [README.md](README.md) + [INSTALL.md](INSTALL.md) (or [INSTALL-DOCKER.md](INSTALL-DOCKER.md)).
- The lab itself needs no model and no login — only the work *with* Claude Code does.
- Docker route: prefix every `npm` command with `docker compose run --rm lab`.
- Live progress per participant: `npm run progress -- --status` (`STEP-0` … `STEP-9`). The history lands in `PROGRESS.md`.

## Dry run: the whole lab without Claude (~10 min)

Run this once before the workshop to verify every block works:

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
npm ci
npm test               # -> "pass 17" / "fail 0"
npm run test:hooks     # -> three times "pass=… fail=0"
npm run eval           # -> six lines starting with "ok" (3x PASS, 3x REJECTED)

# the gate, on a throw-away branch:
git switch -c fix/facilitator-dry-run
npm run approve -- <your-name> fix/facilitator-dry-run "facilitator dry run"
npm run check:approval # -> "approved by <your-name>"
git switch main && git branch -D fix/facilitator-dry-run
rm -rf approvals .lab  # the dry run leaves no evidence behind
```

Optional extra checks: `npm run skill:scan -- .claude/skills` (flags are expected — the scanner is a first pass, not a verdict; exit code 1 is normal) and `npm run progress -- --status` (shows `0/10` on a clean clone).

## Block by block

### Setup — STEP-0 (10:45)

- **Goal:** lab installed, Claude Code trusted, MCP `sre` connected, guard hook fired once.
- **Commands:** `npm ci` → `npm test` → `npm run test:hooks` → `npm run eval` → `claude` (trust: **Yes**, MCP `sre`: approve) → `/status`, `/mcp`.
- **Expected:** `pass 17 / fail 0`; three times `fail=0`; six `ok` lines; `/mcp` shows `sre` connected; `npm run progress -- --status` shows `[x] STEP-0`.
- **Common failure:** progress stays `0/10` or settings seem ignored → the trust question was not accepted. Fix: restart `claude` in the lab folder, choose **Yes**. After that: `claude` asks for a login — for the tests you do not need one.
- **Catch-up:** none needed — everyone starts on `main`.

### Plan: intent.md — STEP-1 (11:15)

- **Goal:** `intent.md` filled in with the team's own words (all five headings, no `<team>` placeholder, ≥ 200 chars).
- **Commands:** `/design-control-loop` (interview) or edit `intent.md` by hand; check `npm run progress -- --status`.
- **Expected:** `[x] STEP-1` and a `<!-- auto: STEP-1 -->` entry in `PROGRESS.md`.
- **Common failure:** `[ ] STEP-1` stays unchecked → `<team>` or a heading is missing, or the file is under 200 characters. Fix: replace `Author: <team>` and keep all five headings (`Problem`, `Proposed outcome`, `Affected users and systems`, `Constraints`, `Open questions`).
- **Catch-up tag:** `step-1`.

### Design: spec + schema — STEP-2 and STEP-3 (11:40)

- **Goal:** `docs/spec.md` filled in (no TODO, ≥ 200 chars) **and** one design decision recorded.
- **Commands:** edit `docs/spec.md` against `evals/schema.ts`; create `docs/decisions/D01-<topic>.md` from the 5-line template in [docs/decisions/README.md](docs/decisions/README.md); check `npm run progress -- --status`.
- **Expected:** `[x] STEP-2` and `[x] STEP-3`. (A doc under `docs/rpi/` also counts for STEP-3; `docs/decisions/README.md` itself does not.)
- **Common failure:** STEP-3 stays unchecked → the file is named wrong. Fix: it must be `docs/decisions/D01-*.md` (or any `.md` under `docs/decisions/` or `docs/rpi/`, except `README.md`).
- **Catch-up tag:** `step-2`.

**Test-first exercise (slides, word for word):**

> "Add a test in `test/schema.test.ts` that expects a required `blast_radius` string field. Run `npm test`: red. Add `blast_radius` to `evals/schema.ts` and to the good fixtures. Run `npm test`: green."

Reference solution (the `step-2` material):

```ts
// in test/schema.test.ts
test("schema requires a blast_radius string", () => {
  const d = good("inc-001.good.json");
  assert.equal(typeof d.blast_radius, "string");
  assert.equal(Diagnosis.safeParse(d).success, true);
  const { blast_radius, ...without } = d;
  assert.equal(Diagnosis.safeParse(without).success, false);
});
```

```ts
// in evals/schema.ts, inside Diagnosis:
  blast_radius: z.string(),
```

```json
// in each evals/fixtures/*.good.json:
  "blast_radius": "checkout-api only; sample data",
```

Verify it really goes red first: `npm test` fails on the new test before the schema and fixtures are touched (`pass 17 / fail 1`); green after = `pass 18 / fail 0`.

### Build: controls / hooks — STEP-4 (13:00)

- **Goal:** the team sees the guard deny something and adds its own deny rule, test-first.
- **Commands:** let Claude try something blocked (e.g. `curl https://example.com`) → `deny` lands in `approvals/audit.jsonl`; `npm run test:hooks` → three times `fail=0`; `npm run progress -- --status`.
- **Expected:** `[x] STEP-4`; at least one `deny` line in `approvals/audit.jsonl`; `pass=… fail=0` in the hook tests.
- **Common failure:** STEP-4 stays unchecked → no `deny` was logged yet (audit.jsonl is local, not in git). Fix: have Claude attempt one blocked action, or run `npm run test:hooks`.
- **Catch-up tag:** `step-3`.

**Test-first deny rule (slides):** the rule must go **red** first, so pick a command the guard does not cover yet:

- Good examples: `rm -rf`, `git reset --hard`, `terraform destroy`.
- **Not** `kubectl delete`: `kubectl` is already in `GATED` in `.claude/hooks/guard.mjs`, so the "new" rule can never be red.

Exercise: add a check to `test/hooks.test.mjs` (e.g. `check("terraform destroy blocked", "deny", P("Bash", "command", "terraform destroy"))`) → `node test/hooks.test.mjs` is red → add the command to `GATED` (or a new rule) in `guard.mjs` → green.

**By design, the participant edits `guard.mjs` and `test/hooks.test.mjs` themselves.** `.claude/settings.json` denies `Edit(./.claude/**)` and the guard allows writes only in `docs/diagnoses|verify|show-me|pr/` plus `ask`-confirmed SDLC artefacts, so Claude cannot touch either file — it suggests the diff, the human applies it. That is the lesson, not a bug.

### Diagnose: plan + diagnosis — STEP-5 (13:50)

- **Goal:** `docs/plan.md` filled in (in plan mode) and a diagnosis JSON in `docs/diagnoses/`.
- **Commands:** `/incident-triage`, plan mode → `docs/plan.md`; write `docs/diagnoses/inc-001.json` with evidence cited by log id.
- **Expected:** `[x] STEP-5`; `docs/diagnoses/inc-001.json` exists; `npm run eval -- docs/diagnoses/inc-001.json` → `PASS`.
- **Common failure:** eval REJECTED with `invented evidence L…` or `quote not in …` → the diagnosis cites a log id or quote that is not in `incidents/<id>/logs.jsonl`. Fix: re-read via `get_logs` and cite real lines only.
- **Catch-up tag:** `step-4`.

### Test: eval PASS + `/verify-this` — STEP-6 (14:55)

- **Goal:** a diagnosis that passes the eval **and** a written verdict.
- **Commands:** `npm run eval -- docs/diagnoses/<file>` until `PASS` (must be *newer* than the diagnosis file); `/verify-this` → save the verdict to `docs/verify/<claim>/verdict.md`.
- **Expected:** `[x] STEP-6`. Both are required: the eval pass alone is not enough — `docs/verify/<name>/verdict.md` must exist.
- **Common failure:** STEP-6 stays unchecked after a PASS → the eval ran *before* the last edit of the diagnosis (stale result in `.lab/eval-results.json`), or the verdict file is missing. Fix: rerun `npm run eval -- docs/diagnoses/<file>` and create `docs/verify/<claim>/verdict.md`.
- **Catch-up tag:** `step-5`.

### Deploy: the gate, PR/MR — STEP-7 (15:15)

- **Goal:** a named human approves the `fix/*` branch and opens the PR/MR — never the agent.
- **Commands:** Claude prepares `fix/<name>` + `docs/pr/<branch>.md`; the human in **their own terminal**: `npm run approve -- <name> fix/<name> "<reason>"` → `git add -f approvals/*.jsonl && git commit` → `git push` → `gh pr create --fill` or `glab mr create --fill`; CI check: `npm run check:approval`.
- **Expected:** `[x] STEP-7`; `check-approval: fix/<name> approved by <name>`; Claude's push attempt was denied before the approval (`deny` in `audit.jsonl`).
- **Common failure:** `npm run approve` exits with "Denied: this command is running inside a Claude Code session" → it was run *through* Claude. Fix: a human runs it in a separate terminal (the guard denies it inside Claude by design).
- **Catch-up tag:** `step-6` (contains `facilitator-example` approval).

### Maintain: incident → eval case — STEP-8 (15:30)

- **Goal:** a new eval case in `evals/cases/inc-00N.json` beyond the three that ship with the lab.
- **Commands:** design or build a case (see `docs/stretch-incidents.md`); optionally `npm run generate` for new sample data; `npm test` stays green.
- **Expected:** `[x] STEP-8`; `evals/cases/` has 4+ files; `pass 17 / fail 0`.
- **Common failure:** `[ ] STEP-8` → the case file is named wrong or lands in the wrong folder. Fix: `evals/cases/inc-003.json` (number + `.json`, inside `evals/cases/`).
- **Catch-up tag:** `step-7`.

### Hackathon: intent + HANDOFF.md — STEP-9 (15:40)

- **Goal:** day 1 of the hackathon captured: decided, OPEN, first steps.
- **Commands:** `/handoff` → `HANDOFF.md` (≥ 100 chars, no TODO).
- **Expected:** `[x] STEP-9`.
- **Common failure:** a `TODO` left in `HANDOFF.md`. Fix: write `OPEN:` for unresolved items instead of TODO — the hook checks for the word TODO.
- **Catch-up tag:** `step-8`.

## Catching a team up with step tags

Each tag is the worked-out state at the end of a block (`steps/N-…` branches hold the same). Look without switching: `git diff main step-4`. Work from it without losing current work: `git worktree add ../lab-step-4 step-4`. Note: `approvals/audit.jsonl` and `.lab/` are local evidence, not in git — STEP-0/STEP-4/STEP-6 only mark done after the hook sees the evidence in *that* checkout.
