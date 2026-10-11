# progress.md: current workshop checks and build log

Dit bestand combineert twee soorten voortgang. **Current workshop checks** toont de huidige stand uit bewijs in de repo. **Build log** bewaart wat op een bepaald moment is opgeleverd en gecontroleerd.

Het build-logformaat is aangepast van de [Claude Code Skills Pack-template](https://github.com/RyanLisse/claude-code-skills-pack/blob/main/PROGRESS.md).

## Current workshop checks

De hook `.claude/hooks/progress.mjs` vernieuwt alleen het blok tussen `AUTO:START` en `AUTO:END`. De hook leest bestanden, eval-resultaten en `approvals/`. De hook werkt lokaal en gebruikt geen netwerk.

De tabel beschrijft het bewijs per workshopstap. Het gegenereerde overzicht eronder is de huidige stand en kan bij elke hook-run veranderen.

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

## Build log

Dit logboek is historisch en append-only. Voeg nieuwe, geverifieerde entries onderaan toe. Wijzig of verwijder een bestaande entry niet.

Gebruik de datum en tijd waarop je het resultaat controleerde en de entry schreef. Gebruik een ISO 8601-timestamp met de lokale tijdzone-offset. Een status zoals `OPEN` of `VERIFIED` beschrijft alleen die meting en is geen actuele tracker.

Schrijf een correctie als een nieuwe entry met een eigen timestamp. Verwijs naar de eerdere entry en leg uit welke claim veranderde. Bewaar de eerdere entry ongewijzigd.

Plak geen secrets, credentials of echte persoonsgegevens in dit bestand. Noteer alleen bewijs dat je werkelijk hebt gezien. Noem een controle `OPEN` als je deze niet hebt uitgevoerd.

<!-- Append new entries after this line. -->

## <YYYY-MM-DDTHH:mm:ss±HH:mm> — <Past-tense change title>

- **What shipped:** <De concrete wijziging in bestanden, gedrag of uitvoer.>
- **Why it mattered:** <Het probleem of de ontbrekende mogelijkheid die deze wijziging oploste.>
- **How, and what was rejected:** <De gekozen aanpak en de afgewezen aanpak met de reden.>
- **Validation:** `<exact command>` gaf <exact resultaat en exitcode>. <Zeg wat live of op het echte artefact is bewezen, wat alleen automatisch is getest en wat niet is uitgevoerd. Markeer niet-gecontroleerde claims als `OPEN` en geef de reden.>
- **Deliberately not done:** <Bewust uitgesloten werk en de reden of eigenaar.>
