# Day 5 · Step by step

It is 03:12. `checkout-api` pages the on-call engineer. Customers cannot pay.
Today you take that one incident from the page to a merge request, with Claude Code.
You go through eight stages. Each stage leaves one file in the repo.
Claude does most of the typing. You make every decision that matters.

Every stage has the same loop: **what you build → demo → your turn → check → discuss**.
The slides and this file use the same prompts, word for word.
Every prompt has five parts: Goal, Context, Constraints, Done when, Output.

| Stage | Question | File it leaves | Catch-up ref |
| --- | --- | --- | --- |
| 0 · Setup | Can I run the lab on my own remote? | `PROGRESS.md` STEP-0, `approvals/audit.jsonl` | none, start on `main` |
| 1 · Plan | What do we want, and what do we not want? | `intent.md` | `step-1` |
| 2 · Design | What must a good diagnosis contain? | `docs/spec.md`, `evals/schema.ts`, `docs/decisions/D01-*.md` | `step-2` |
| 3 · Controls | What may the agent never do? | `.claude/hooks/guard.mjs`, a test, a `CLAUDE.md` rule | `step-3` |
| 4 · Diagnose | What caused the incident? | `docs/plan.md`, `docs/diagnoses/inc-001.json` | `step-4` |
| 5 · Test | Can we trust the diagnosis? | a new bad fixture, `docs/verify/<claim>/verdict.md` | `step-5` |
| 6 · Gate | Who says yes, and where is that recorded? | `approvals/approvals.jsonl`, a merge request | `step-6` |
| 7 · Maintain | How do we catch it next time? | `evals/cases/inc-003.json` | `step-7` |

**Progress.** `npm run progress -- --status` shows STEP-0 to STEP-9. It writes nothing.

**Fell behind?** Each stage has a finished version: the ref `step-N`.
First put your own work away with `git stash -u`. Then take the finished stage:

```sh
git stash -u
git switch -C catch-up step-N
```

Your own files stay safe in the stash. `git stash list` shows them.
The local evidence in `approvals/` and `.lab/` stays where it is: git ignores it.

**Rules for the day.** The data is fictional. Claude Code uses your own login.
The agent proposes. A named person approves, pushes and merges.
Read [notes/worldline-flags.md](notes/worldline-flags.md) before you install outside skills.

---

## Stage 0 · Setup

**Goal:** the lab runs on your laptop, your own remote has a copy, and the guard hook has fired once.
Slides: "Demo · Stage 0" and "Your turn · Stage 0". Install help: [INSTALL.md](INSTALL.md).

### How the loop works here

Claude Code reads `CLAUDE.md` and `.claude/settings.json` when you trust the folder.
The settings start the `sre` MCP server and two hooks.
The guard hook sees every tool call before it runs, and writes one line to `approvals/audit.jsonl`.
The progress hook reads that evidence and adds entries to `PROGRESS.md`.
No trust means no rules: then the hooks do not run.

### Demo (facilitator)

```sh
npm ci
npm test
npm run test:hooks
npm run eval
claude
```

Point at `pass 17` and `fail 0` after `npm test`. Point at three `fail=0` lines after `npm run test:hooks`.
In Claude Code, accept the trust question and approve `sre`. Show `/mcp` with `sre` connected.
Paste the Stage 0 prompt. Show the table, then `[x] STEP-0` in the status.

### Your turn · Stage 0

1. Get the lab. Use a short folder name without spaces.

   ```sh
   git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
   cd aetherlink-sre-agent-lab
   npm ci
   ```

2. Run the three checks. Look for `pass 17`, three times `fail=0`, six `ok` lines and two `skip` lines.

   ```sh
   npm test
   npm run test:hooks
   npm run eval
   ```

3. Make your own remote. At Worldline this is GitLab.
   In GitLab, select **New project** → **Create blank project**. Clear **Initialize repository with a README**.
   Use the clone URL that GitLab shows:

   ```sh
   git remote rename origin upstream
   git remote add origin https://<your-gitlab-host>/<your-group>/aetherlink-sre-agent-lab.git
   git push -u origin main
   git push origin --tags
   ```

   GitHub instead:

   ```sh
   git remote rename origin upstream
   gh repo create <you>/aetherlink-sre-agent-lab --private --source . --remote origin --push
   git push origin --tags
   ```

4. Check the remotes. Look for `origin` (your project) and `upstream` (the lab).

   ```sh
   git remote -v
   ```

5. Start Claude Code. Select **Yes** for trust. Approve the MCP server `sre`. Type `/mcp` and look for `sre` connected.

   ```sh
   claude
   ```

6. Paste this prompt into Claude Code:

   ```text
   Goal: explain this lab to me before I change anything.
   Context: this is the Day 5 lab. Read README.md, FACILITATOR.md, CLAUDE.md and the folders docs, evals and .claude.
   Constraints: read only. Do not change any file. Do not run any command except npm run progress -- --status.
   Done when: I can see the eight stages of the route and the file that each stage leaves.
   Output: a table with three columns: stage, file it leaves, command that proves it. Then the output of npm run progress -- --status.
   ```

**Done when:** the status shows `[x] STEP-0 Setup`, and `git remote -v` shows your own `origin`.

### Check

- `npm test` ends with `pass 17` and `fail 0`.
- `/mcp` shows `sre` connected.
- `npm run progress -- --status` shows `[x] STEP-0 Setup`.
- `PROGRESS.md` has a new entry at the bottom with `(STEP-0)`.

Still `[ ] STEP-0`? Start `claude` again in the lab folder and select **Yes** for trust.

### Catch up

There is no catch-up ref for setup. Everyone starts on `main`.
Setup does not work? Use the Docker route in [INSTALL-DOCKER.md](INSTALL-DOCKER.md), and ask for help in the 11:20 break.

---

## Stage 1 · Plan

**Goal:** `intent.md` says what your team wants, what it does not want, and one open question.
Slides: "Demo · Stage 1" and "Your turn · Stage 1".

### How the loop works here

`CLAUDE.md` imports `intent.md`, so Claude reads your intent at the start of every session.
The skill `/design-control-loop` interviews you. It sees the agent as a control loop:
a set point, a sensor, an actuator and a dampener.
Claude proposes the edit. The guard asks you before Claude writes `intent.md`. You decide.

### Demo (facilitator)

Run the Stage 1 prompt with your own team name. Answer one round of questions.
Show the control-loop table. Accept the edit when the guard asks.
Then show `[x] STEP-1` in `npm run progress -- --status`.

### Your turn · Stage 1

1. Paste this prompt into Claude Code. Replace `<your team>` with your team name.

   ```text
   /design-control-loop
   Goal: design our SRE triage agent as a control loop, then write intent.md.
   Context: our team name is <your team>. The agent diagnoses checkout-api incidents with the sre MCP tools only.
   Constraints: one round of at most three questions. Keep the five headings of intent.md. Show me the edit before you write it.
   Done when: intent.md has the five headings, our team name after Author, and exactly one line that starts with OPEN:.
   Output: the control-loop table, then the proposed edit to intent.md.
   ```

2. Answer the questions in your own words.
3. Read the proposed edit. Accept it when the guard asks, or tell Claude what to change.
4. Check the status.

   ```sh
   npm run progress -- --status
   ```

**Done when:** the status shows `[x] STEP-1`, and `intent.md` has one line that starts with `OPEN:`.

### Check

- `intent.md` has the five headings: Problem, Proposed outcome, Affected users and systems, Constraints, Open questions.
- The line `Author:` has your team name, not `<team>`.
- `npm run progress -- --status` shows `[x] STEP-1`.

### Catch up

```sh
git stash -u
git switch -C catch-up step-1
```

---

## Stage 2 · Design

**Goal:** the diagnosis contract needs a new field, `blast_radius`, and the test for it went red before it went green.
Slides: "Demo · Stage 2" and "Your turn · Stage 2".

### How the loop works here

`evals/schema.ts` is the contract. A diagnosis that does not match it fails before the eval scores it.
`test/schema.test.ts` pins the contract. You write the test first.
A test that never went red proves nothing. So you stop at red and look, then you make it green.
`docs/spec.md` explains the contract in words. `docs/decisions/D01-*.md` records one decision.

### Demo (facilitator)

Run prompt 2a. Point at `pass 17` and `fail 1`, and at the name of the failing test.
Run prompt 2b. Point at `pass 18` and `fail 0`.
Run `npm run eval`. The output does not change: every fixture already has `blast_radius`.

### Your turn · Stage 2

1. Paste prompt 2a. Accept the edit of `test/schema.test.ts` when the guard asks.

   ```text
   Goal: make blast_radius a required field of a diagnosis, test first.
   Context: the contract is evals/schema.ts. Its tests are in test/schema.test.ts. Every fixture already has a blast_radius string.
   Constraints: change only test/schema.test.ts in this step. Do not touch evals/schema.ts yet.
   Done when: npm test shows exactly one failing test, and that test is about blast_radius.
   Output: the new test, and the pass and fail lines of npm test. Then stop and wait for me.
   ```

2. Look at the red result. You see `pass 17` and `fail 1`.
3. Paste prompt 2b. Accept the edit of `evals/schema.ts` when the guard asks.

   ```text
   Goal: make the blast_radius test pass.
   Context: the failing test is in test/schema.test.ts. The contract is evals/schema.ts.
   Constraints: change only evals/schema.ts. Add one field. Do not change the test.
   Done when: npm test shows pass 18 and fail 0, and npm run eval output has not changed.
   Output: the diff of evals/schema.ts and the pass and fail lines of npm test.
   ```

4. Paste prompt 2c. Accept each edit when the guard asks.

   ```text
   Goal: write the diagnosis contract and record one design decision.
   Context: docs/spec.md is a template with TODO lines. The template for a decision is in docs/decisions/README.md.
   Constraints: one line per field of the Diagnosis in evals/schema.ts, blast_radius included. One decision only, in docs/decisions/D01-<topic>.md.
   Done when: docs/spec.md has no TODO, and npm run progress -- --status shows [x] STEP-2 and [x] STEP-3.
   Output: the two files, and the status lines for STEP-2 and STEP-3.
   ```

**Done when:** `npm test` shows `pass 18` and `fail 0`, and the status shows `[x] STEP-2` and `[x] STEP-3`.

### Check

- First `npm test`: `pass 17` and `fail 1`. The failing test is about `blast_radius`.
- Then `npm test`: `pass 18` and `fail 0`.
- `npm run eval`: still six `ok` lines and two `skip` lines.
- `npm run progress -- --status` shows `[x] STEP-2` and `[x] STEP-3`.

From now on your `npm test` count is 18.

### Catch up

```sh
git stash -u
git switch -C catch-up step-2
```

---

## Stage 3 · Controls

**Goal:** you saw the guard refuse an action, you added your own deny rule test first, and you accepted or rejected one `CLAUDE.md` rule.
Slides: "Demo · Stage 3" and "Your turn · Stage 3".

### How the loop works here

There are three layers. `CLAUDE.md` asks Claude to follow rules.
The permissions in `.claude/settings.json` allow, ask or deny a tool call.
The guard hook `.claude/hooks/guard.mjs` checks every call with code, and logs the decision.
Claude cannot edit `.claude/` or `test/hooks.test.mjs`. That is the point: you write the rules for the agent.

### Demo (facilitator)

Run prompt 3a. Show the deny reason, then the deny line in `approvals/audit.jsonl`.
Add the check line to `test/hooks.test.mjs` by hand. Run `node test/hooks.test.mjs`: red.
Add the rule to `.claude/hooks/guard.mjs` by hand. Run it again: green.

### Your turn · Stage 3

1. Paste prompt 3a.

   ```text
   Goal: show me the guard at work, and help me add one deny rule, test first.
   Context: the guard is .claude/hooks/guard.mjs and its tests are test/hooks.test.mjs. You cannot edit either file. I make those edits.
   Constraints: first try once to add a line to runbooks/db-pool-exhaustion.md, and show me the guard decision. Then only suggest. Do not try to edit .claude or test/hooks.test.mjs.
   Done when: approvals/audit.jsonl has a deny line, and I have one check line for git reset --hard and one guard rule that denies it.
   Output: the deny reason, the check line and the guard rule, each in its own code block.
   ```

2. Open `test/hooks.test.mjs` in your editor. Paste the check line above the line `check("npm test untouched"`.
3. Run the hook test. Look for `FAIL` on your new line and `fail=1`.

   ```sh
   node test/hooks.test.mjs
   ```

4. Open `.claude/hooks/guard.mjs` in your editor. Paste the rule above the line that starts with `if (HUMAN_ONLY.test(cmd))`.
5. Run the hook test again. Look for `pass=46 fail=0`.

   ```sh
   node test/hooks.test.mjs
   ```

6. Paste prompt 3b. Accept or reject the rule when the guard asks. This is your decision.

   ```text
   Goal: turn one mistake from today into a rule in CLAUDE.md.
   Context: CLAUDE.md is the project memory that Claude reads at the start of every session. Look at this session and at approvals/audit.jsonl.
   Constraints: propose exactly one rule of one line, under the heading Rules. Show me the edit first. I accept or reject it.
   Done when: I have accepted or rejected the rule, and you tell me which.
   Output: the mistake, the proposed rule, and why it stops the mistake next time.
   ```

**Done when:** the hook test shows `pass=46 fail=0`, and the status shows `[x] STEP-4`.

### Check

- Before your rule: `FAIL team rule: git reset --hard denied -> none (want deny)` and `pass=45 fail=1`.
- After your rule: `pass=46 fail=0`.
- `approvals/audit.jsonl` has at least one line with `"decision":"deny"`.
- `npm run progress -- --status` shows `[x] STEP-4`.

Your check line has another name? Then your `FAIL` line shows that name.

### Catch up

```sh
git stash -u
git switch -C catch-up step-3
```

STEP-4 needs a deny line in your own `approvals/audit.jsonl`. Run prompt 3a once after the catch-up.

---

## Stage 4 · Diagnose

**Goal:** an accepted plan in `docs/plan.md`, and a diagnosis of inc-001 that passes the eval.
Slides: "Demo · Stage 4" and "Your turn · Stage 4".

### How the loop works here

In plan mode Claude reads and plans, but changes nothing. You accept the plan, or you change it.
The `sre` MCP server is the only source of evidence. It has five read-only tools and returns at most 200 lines.
The skill `incident-triage` is the team policy for every diagnosis.
The subagent `verifier` checks the diagnosis in a fresh context. It reports and fixes nothing.

### Demo (facilitator)

Press Shift+Tab until the footer shows plan mode. Run prompt 4a.
Change one step of the plan before you accept it. Then run prompt 4b.
Point at the cited log ids, the verifier report and the `PASS` line.

### Your turn · Stage 4

1. In Claude Code, press Shift+Tab until the footer shows plan mode.
2. Paste prompt 4a. Read the plan. Change one step, or accept it as it is.

   ```text
   Goal: a plan to diagnose incident inc-001 on checkout-api.
   Context: you are in plan mode. Follow the incident-triage skill. Evidence comes only from the sre MCP tools.
   Constraints: plan only. Use the five headings of docs/plan.md: Files, Order, Risks, Proof, Rollback.
   Done when: I accept the plan, and your first step after that is to save it to docs/plan.md.
   Output: the plan with the five headings.
   ```

3. Accept the plan. Accept the edit of `docs/plan.md` when the guard asks.
4. Paste prompt 4b.

   ```text
   Goal: diagnose inc-001 and check the diagnosis with a second pair of eyes.
   Context: follow docs/plan.md and the incident-triage skill. Evidence comes only from the sre MCP tools.
   Constraints: write only docs/diagnoses/inc-001.json and docs/diagnoses/inc-001.md. Cite real log ids with literal quotes. Propose one runbook step, and do not execute it.
   Done when: the verifier subagent reports no mismatch, and npm run eval -- docs/diagnoses/inc-001.json shows PASS.
   Output: the root cause in two sentences, the verifier report, and the eval line.
   ```

5. Run the eval yourself.

   ```sh
   npm run eval -- docs/diagnoses/inc-001.json
   ```

**Done when:** the eval shows `PASS` for `docs/diagnoses/inc-001.json`, and the status shows `[x] STEP-5`.

### Check

- `ok   docs/diagnoses/inc-001.json -> PASS`
- The diagnosis names deploy `d-0142` and `DB_POOL_MAX`.
- `npm run progress -- --status` shows `[x] STEP-5`.

`REJECTED` with `invented evidence` or `quote not in`? The diagnosis cites a line that does not exist.
Ask Claude to read the logs again with `get_logs`, and to cite real lines only.

### Catch up

```sh
git stash -u
git switch -C catch-up step-4
```

---

## Stage 5 · Test

**Goal:** you saw the eval catch a wrong answer, and a written verdict proves that the eval can fail.
Slides: "Demo · Stage 5" and "Your turn · Stage 5".

### How the loop works here

An eval is a test for the agent's output. A good fixture must PASS. A bad fixture must be REJECTED.
A file name with `.bad.` in it tells the checker that it must reject the file.
The skill `/verify-this` compares a baseline and a treatment with the same command, and gives one verdict.

### Demo (facilitator)

Run prompt 5a. Point at the new `ok` line with `REJECTED` and the reason `runbook upstream-timeout`.
Run prompt 5b. Open `verdict.md` and read the verdict line.

### Your turn · Stage 5

1. Paste prompt 5a. Accept the new file when the guard asks.

   ```text
   Goal: prove that the eval can catch a wrong runbook.
   Context: the good example is evals/fixtures/inc-001.good.json. The checker is evals/check.ts. A file name that contains .bad. must be REJECTED.
   Constraints: create evals/fixtures/inc-001.wrong-runbook.bad.json. Keep the real log ids and quotes. Change only the runbook, to upstream-timeout. Do not change evals/check.ts.
   Done when: npm run eval prints an ok line for the new file with REJECTED and the reason runbook upstream-timeout.
   Output: the eval line for the new file, and one sentence on why it is REJECTED.
   ```

2. Paste prompt 5b.

   ```text
   /verify-this
   Goal: prove or disprove this claim: npm run eval rejects a diagnosis that cites a log id that does not exist.
   Context: the baseline is evals/fixtures/inc-001.good.json. The treatment is a copy of it in docs/verify with one log id changed to L9999.
   Constraints: write only under docs/verify/eval-rejects-invented-log-id/. Run the same command for the baseline and the treatment.
   Done when: docs/verify/eval-rejects-invented-log-id/verdict.md exists with one verdict: VERIFIED, NOT VERIFIED or INCONCLUSIVE.
   Output: the verdict block of the skill.
   ```

3. Run the eval on your own diagnosis again. STEP-6 needs a `PASS` that is newer than the diagnosis.

   ```sh
   npm run eval -- docs/diagnoses/inc-001.json
   npm run progress -- --status
   ```

**Done when:** the eval rejects the new fixture, `verdict.md` exists, and the status shows `[x] STEP-6`.

### Check

- `ok   evals/fixtures/inc-001.wrong-runbook.bad.json -> REJECTED  [runbook upstream-timeout]`
- `docs/verify/eval-rejects-invented-log-id/verdict.md` starts with a verdict.
- `npm run progress -- --status` shows `[x] STEP-6`.

### Catch up

```sh
git stash -u
git switch -C catch-up step-5
```

---

## Stage 6 · Gate

**Goal:** a named person approves the fix, pushes it to your own remote and opens the merge request. The agent does not.
Slides: "Demo · Stage 6" and "Your turn · Stage 6".

### How the loop works here

Claude prepares the fix on a `fix/*` branch. The guard asks you before each edit in `app/` and before each commit.
Without a named approval, the guard denies every push.
`REVIEW.md` has three review passes. Findings never approve.
You approve in your own terminal, outside Claude. CI runs the same checks again on the merge request.

### Demo (facilitator)

Run prompt 6a. Show the deny reason for the push.
Run prompt 6b. Open `docs/pr/fix-db-pool-size-review.md`.
In a second terminal, run `npm run approve` and `npm run check:approval`. Push, and open the merge request.

### Your turn · Stage 6

1. Paste prompt 6a. Accept the edit and the commit when the guard asks.

   ```text
   Goal: propose the fix for inc-001 as a change on a fix branch.
   Context: docs/diagnoses/inc-001.json names the cause. The config is app/config/prod.env.
   Constraints: create the branch fix/db-pool-size. Change only DB_POOL_MAX. Commit only app/config/prod.env. Then try git push once and stop.
   Done when: the commit exists on fix/db-pool-size, and the guard denied the push.
   Output: the diff, the commit id and the deny reason.
   ```

2. Paste prompt 6b.

   ```text
   Goal: review the fix branch with the three passes in REVIEW.md.
   Context: the branch is fix/db-pool-size. Compare it with main. The diagnosis is docs/diagnoses/inc-001.json.
   Constraints: read only, except one file: docs/pr/fix-db-pool-size-review.md. Findings never approve. Max 5 nits.
   Done when: the file has one section per pass: Correctness, Safety, Compliance, and each finding is Important or Nit.
   Output: the path of the file and the Important findings.
   ```

3. Read the findings. You decide if the fix can go.
4. Open a second terminal in the lab folder. Approve the fix with your own name.

   ```sh
   npm run approve -- <your-name> fix/db-pool-size "inc-001 diagnosis PASS, config-only change"
   npm run check:approval
   ```

5. Commit the approval. Git asks who you are? Run `git config user.name "<your name>"` first.

   ```sh
   git add -f approvals/approvals.jsonl approvals/audit.jsonl
   git commit -m "approval: fix/db-pool-size by <your-name>"
   ```

6. Push the branch to your own remote.

   ```sh
   git push -u origin fix/db-pool-size
   ```

7. Open the merge request. GitLab prints a link after the push: open it in the browser.
   GitHub instead: run `gh pr create --fill`.

**Done when:** `check:approval` names you, the merge request exists, and the status shows `[x] STEP-7`.

### Check

- The guard denied Claude's push: `Gate: no named approval for branch 'fix/db-pool-size'`.
- `check-approval: fix/db-pool-size approved by <your-name>`.
- The merge request shows a CI pipeline with `npm test`, `test:hooks`, `eval` and `check:approval`.
- `npm run progress -- --status` shows `[x] STEP-7`.

Your other files from today stay in your folder. They are not part of this merge request.

### Catch up

```sh
git stash -u
git switch -C catch-up step-6
```

`step-6` has an example approval by `facilitator-example`. For your own approval, do steps 4 to 7 again.

---

## Stage 7 · Maintain

**Goal:** incident inc-003 becomes an eval case, so the eval catches the same mistake next time.
Slides: "Demo · Stage 7" and "Your turn · Stage 7".

### How the loop works here

Every incident you solve becomes a test for the next one.
The data, the runbook and the two fixtures for inc-003 are ready. Only the eval case is missing.
Until the case exists, `npm run eval` prints two `skip` lines for inc-003.

### Demo (facilitator)

Run the Stage 7 prompt. Point at the two inc-003 lines: `skip` becomes `PASS` and `REJECTED`.

### Your turn · Stage 7

1. Paste this prompt. Accept the new file when the guard asks.

   ```text
   Goal: turn incident inc-003 into an eval case.
   Context: the data is in incidents/inc-003-memory-leak and the runbook is memory-leak. The fixtures evals/fixtures/inc-003.good.json and inc-003.bad.json are ready. Use evals/cases/inc-001.json as the model.
   Constraints: read the evidence only with the sre MCP tools. Write only evals/cases/inc-003.json. Do not change the fixtures or evals/check.ts.
   Done when: npm run eval shows PASS for inc-003.good.json and REJECTED for inc-003.bad.json, and npm test shows fail 0.
   Output: the case file and the two inc-003 eval lines.
   ```

2. Run the checks yourself.

   ```sh
   npm run eval
   npm test
   ```

**Done when:** no `skip` lines are left, `npm test` shows `fail 0`, and the status shows `[x] STEP-8`.

### Check

- `ok   evals/fixtures/inc-003.bad.json -> REJECTED`
- `ok   evals/fixtures/inc-003.good.json -> PASS`
- `npm test` shows `pass 18` and `fail 0`.
- `npm run progress -- --status` shows `[x] STEP-8`.

`FAIL ... inc-003.good.json -> REJECTED`? The case asks for a word or a log id that the good fixture does not have.
Compare the case with `evals/fixtures/inc-003.good.json`.

### Catch up

```sh
git stash -u
git switch -C catch-up step-7
```

---

## Close · The hackathon handoff

You now have the full route: intent, spec, controls, plan, diagnosis, eval, gate and a new case.
The hackathon teams use the same route on their own idea.

1. Copy the template for the hackathon intent. PowerShell: `Copy-Item examples/intent.md hackathon/intent.md`.

   ```sh
   cp examples/intent.md hackathon/intent.md
   ```

2. Fill in `hackathon/intent.md` with Claude. Do not change the root `intent.md`: `CLAUDE.md` imports it.
3. Paste this prompt.

   ```text
   /handoff
   Goal: write the handoff for day 1 of the hackathon.
   Context: our idea is in hackathon/intent.md. This lab shows the rules we keep: read-only sensors, a named human approves, evals in CI.
   Constraints: save the handoff to HANDOFF.md. Write OPEN: for each item we have not decided. Do not write TODO.
   Done when: HANDOFF.md exists, and npm run progress -- --status shows [x] STEP-9.
   Output: the first three steps for day 1.
   ```

**Done when:** the status shows `[x] STEP-9`. Catch-up ref: `step-8`.
