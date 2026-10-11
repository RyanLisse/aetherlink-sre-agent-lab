# progress.md — voortgang van je team (append-only)

Dit is je startpunt. Het blok hieronder tussen `AUTO:START` en `AUTO:END` werkt zichzelf bij: de hook `.claude/hooks/progress.mjs` kijkt bij elke start, na elke tool-call en aan het eind van een beurt naar **echt bewijs** in de repo (bestanden, eval-resultaten, `approvals/`). Hij schrijft alleen dit bestand, lokaal. Geen netwerk, er gaat niets van je laptop af.

Onder het blok schrijf je zelf: per stap één regel met wat je deed, het bewijs (commando + uitkomst) en `VERIFIED` of `OPEN`.

## Checklist van de dag

| Stap | Blok | Done-criterium (bewijs) |
|---|---|---|
| 0 | Setup | `npm test` groen, `/status` toont je login, hook vuurt (regel in `approvals/audit.jsonl`) |
| 1 | Plan | `intent.md`: 5 velden, ≥1 OPEN, geen `<team>`; PR/MR open |
| 2 | Design | `docs/spec.md` ingevuld (geen TODO), `npm test` groen |
| 3 | Build 1: controls | `npm run test:hooks` groen + 1 eigen regel; deny zichtbaar in `audit.jsonl` |
| 4 | Build 2: diagnose | `docs/plan.md` ingevuld; `docs/diagnoses/inc-00N.json` + `.md` |
| 5 | Test | `npm run eval -- docs/diagnoses/inc-00N.json` = PASS; `/verify-this`-verdict in `docs/verify/` |
| 6 | Deploy (gate) | `fix/*`-branch, benoemde goedkeuring in `approvals/approvals.jsonl`, PR (GitHub) of MR (GitLab) |
| 7 | Maintain | nieuwe eval-case in `evals/cases/` |
| 8 | Hackathon | hackathon-`intent.md` + `HANDOFF.md` |

<!-- AUTO:START (bijgewerkt door .claude/hooks/progress.mjs; niet met de hand bewerken) -->
<!-- AUTO:END -->

## Log (zelf invullen)

- 
