# Build log

**Historical, append-only.** This file records _what shipped and the evidence_ — not current status. **Live status lives in your team's PR/MR list on GitHub or GitLab, and in `npm run progress -- --status`** (project **aetherlink-sre-agent-lab**); this log does not mirror it.

- Entries are past-tense and immutable: append new ones, never rewrite old ones. A correction is a new entry (or a dated `**Correction (YYYY-MM-DD):**` line inside the original) — never a silent edit.
- Entries cite tracker keys (**`STEP-*`**), decision-register rows (**D<nn>**, in `docs/decisions/`), ADRs (**ADR-<nnnn>**), PRs/MRs (**#<nnn>** / **!<nnn>**) and eval cases (**`evals/cases/inc-<nnn>`**).
- Any status word in a dated entry below (e.g. "Done"/"In Review"/"Active") is a point-in-time snapshot from when the entry was written — not the current state. The tracker is authoritative.
- **Key caveat (optional):** the `STEP-*` keys are the lesson blocks of Workshop 5, not tickets: **STEP-0** Setup (10:45) · **STEP-1** Plan: `intent.md` (11:15) · **STEP-2** Spec: `docs/spec.md` (11:40) · **STEP-3** Design: a decision in `docs/decisions/` or `docs/rpi/` (11:40) · **STEP-4** Build: control layer — MCP, skills, hooks (13:00) · **STEP-5** Diagnose: `docs/plan.md` + `docs/diagnoses/` (13:50) · **STEP-6** Test: eval PASS + `/verify-this` (14:55) · **STEP-7** Gate: named approval + PR/MR (15:15) · **STEP-8** Maintain: incident → eval case (15:30) · **STEP-9** Hackathon: intent + `HANDOFF.md` (15:40). Entries marked `<!-- auto: STEP-n -->` were appended by `.claude/hooks/progress.mjs` from local evidence; it fills **What shipped** and **Validation** and leaves the other bullets for you.

Per entry: timestamp, what shipped, the evidence, what was deliberately left out. Newest entries at the bottom.

**How to use this file (participants).** The live status is not here but in `npm run progress -- --status`; this file is the history. Every entry starts with an ISO 8601 timestamp with timezone offset (`## 2026-10-11T11:20:00+02:00 — <title> (STEP-1)`): the moment you verified the result and wrote the entry. Entries marked `<!-- auto: STEP-n -->` are appended by the hook; fill in *Why it mattered*, *How, and what was rejected* and *Deliberately not done* yourself. Add your own entries at the bottom. Never change or delete an existing entry: a correction is a new entry that refers to the earlier one. Record only evidence you actually saw; if you did not run a check, write `OPEN` with the reason. No secrets, credentials or real personal data.

<!--
WRITING RULES (keep this comment; it does not render)

Voice
- Past tense. Say what happened, what it was measured against, and what the reader should watch for. No "we plan to", no status words presented as current.
- Prose with bold lead-ins per bullet. One idea per bullet; a bullet is 1–3 sentences, not a heading.
- Name the artifact, not the effort: files, functions, tables, migration numbers, test counts, exit codes.

Every entry must be able to answer
1. What shipped — the concrete change (files/packages/tables/routes), and which ticket(s) it closes or advances.
2. Why it mattered — the defect, gap, or decision that made this worth doing. If a behaviour was "declared but never called", say so.
3. Validation — exact commands/suites, counts (N passed / M skipped / K env-gated), exit codes, and what was proven live vs. only in unit tests. Distinguish "green" from "not run here" and say why (no Docker, no credentials, no stack in this worktree, binary not on PATH).
4. Deliberately not done — scope left out on purpose, each with an owner (ticket key) or a reason. This is the section most likely to save the next reader time.

Evidence discipline
- A test that cannot fail is not evidence: when a guard/gate/test is new, record how it was proven non-vacuous (mutation reverted, flag flipped, fixture broken on purpose).
- Distinguish "found" from "fixed". Findings from an adversarial review get their own bullet list, each with the fix and the regression test.
- Record environment gates explicitly (testcontainers suites skipped without Docker, sandbox contract tests skipped without SANDBOX_* creds) so a green run cannot be read as a claim it did not make.
- Record numbers that could go stale (coverage %, row counts, timings) only with the date they were measured — which the entry header already gives.
- Never paste secrets, real personal data or credentials. Env var NAMES are fine; values are not.

Register / numbering
- Claim decision-register ids and migration numbers at merge time, after the final rebase; gaps are tolerated, duplicates are not. State "next free D-id / migration" when a wave changes them.
- If an entry lands out of date order (catch-up, backfill, rebased branch), say so in the first bullet.

Length
- A one-line fix gets a four-bullet entry. A cross-cutting change gets as many bullets as it has lessons, no more.
-->

## Archive

Earlier entries are rotated by quarter into `docs/progress/` to keep this file from growing unbounded. Current-quarter entries stay below, verbatim.

- No archive yet: this lab log starts empty and runs for one workshop day plus the hackathon.

<!-- ========================================================================
     ENTRY TEMPLATES — copy the one that fits, delete the rest.
     Header format:  ## YYYY-MM-DDTHH:mm:ss±HH:mm — <past-tense title> (<KEY>-<n>[, <KEY>-<m>])
     (this lab uses a full ISO 8601 timestamp with the local offset instead of the template's date)
     ======================================================================== -->

<!-- The templates above were copied and the unused ones deleted, as the header says. Auto entries use the
     feature template (What shipped / Why it mattered / How, and what was rejected / Validation / Deliberately not done).
     Hand-written entries may use any of the template shapes from the skills pack PROGRESS.md. -->

<!-- ========================================================================
     OPTIONAL BULLETS — use when they apply, drop when they do not
     ======================================================================== -->

<!--
- **Proven on real data (not just the synthetic fixture):** <live run against a real tenant/provider/image and the numbers it produced>.
- **Findings from an adversarial pass, fixed here with a regression test proven to fail without its fix:** …
- **A dead end worth recording:** <the approach that was tried and why it cannot work, so nobody repeats it>.
- **The lesson worth keeping:** <the generalisable failure mode — a signal gap, a silent-green, a copied shape without its reason>.
- **Operational note:** <what a developer has to do after pulling this — restart, rebuild, migrate, re-seed>.
- **Env note:** <tooling breakage on this machine and the workaround used>.
- **Residual gaps (not in this slice):** …
- **Correction (YYYY-MM-DD):** <the earlier claim that was wrong, what is actually true, and how it was verified> — appended, never edited in place.
-->

<!-- ENTRIES (newest at the bottom) -->
