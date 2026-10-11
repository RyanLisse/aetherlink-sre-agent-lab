# aetherlink-sre-agent-lab

**Trainingsdemo van AetherLink Academy, Workshop 5 (AI-native SDLC).** Alleen fictieve sample-data: geen echte systemen, klanten of betaalgegevens. Bedoeld om te leren, niet voor productie.

Een SRE-agent op een kleine demo-app (`checkout-api`). De agent leest alerts, logs, metrics en deploys via een lokale, read-only MCP-server (`sre`), stelt een diagnose met geciteerd bewijs, en stelt één runbook-stap of een fix als PR/MR voor. **Hij voert nooit iets uit.** Hooks dwingen dat af; een benoemde mens keurt goed, pusht en merget.

- Installatie stap voor stap (standaard, zonder Docker): **[INSTALL.md](INSTALL.md)**
- Alternatief in Docker, voor wie problemen heeft of dat wil: **[INSTALL-DOCKER.md](INSTALL-DOCKER.md)**

## ⚠️ Disclaimer: jouw data, jouw beleid

- Dit lab draait volledig **lokaal op je eigen laptop**, met fictieve sample-data.
- **AetherLink (en Ryan Lisse) ontvangt, verzamelt of bewaart géén data van deelnemers of van hun organisatie**: geen prompts, code, logs, credentials, diagnoses of telemetrie. Er is geen server van ons waar iets naartoe gaat.
- Claude Code gebruikt **jouw eigen login** (je eigen Claude-account of API-key, of de Vertex-omgeving van je eigen organisatie). Wat daar gebeurt, valt onder jouw afspraken met die aanbieder.
- Haal je externe data, externe skills of tools op (bijvoorbeeld het volledige skills pack, of `archify`, dat externe code ophaalt), dan doe je dat **onder het beleid van je eigen organisatie en op eigen verantwoordelijkheid**. AetherLink is niet verantwoordelijk voor de inhoud, de werking of het gebruik van externe bronnen, tools of data.
- Twijfel je? Vraag het eerst aan je security- of IT-team.

## Snelstart

Het lab zelf (tests, evals, hooks, MCP-server, progress-hook, CI) heeft **geen model en geen login** nodig.

### Standaard: zonder Docker (Windows, macOS, Linux)

Nodig: Git, Node.js LTS (22 of nieuwer) en Claude Code ([INSTALL.md](INSTALL.md)).

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
npm ci
npm test               # verwacht: "pass 13" en "fail 0"
npm run test:hooks     # verwacht: drie keer "fail=0"
npm run eval           # verwacht: 6 regels die met "ok" beginnen
claude                 # trust-vraag: Yes · MCP-server sre: goedkeuren · /status · /mcp
```

Alle hooks en de MCP-server starten met gewoon `node` (geen bash, geen `npx`), dus ze werken hetzelfde in PowerShell, Git Bash, zsh en bash.

### Alternatief: Docker

```
docker compose build
docker compose up lab                                          # tests, zonder netwerk: "pass 13", "fail 0"
docker compose -f compose.yaml -f compose.agent.yaml run --rm agent   # Claude Code in de container, eigen login
```

Details, Dev Containers en de optionele Vertex-route: [INSTALL-DOCKER.md](INSTALL-DOCKER.md).

### Optioneel: via Vertex (bijvoorbeeld bij Worldline)

Alleen als je organisatie Claude via Google Vertex AI aanbiedt: zet `CLAUDE_CODE_USE_VERTEX=1`, `ANTHROPIC_VERTEX_PROJECT_ID` en `CLOUD_ML_REGION` (waarden van je eigen IT) en log in met `gcloud auth application-default login`. Zie [INSTALL.md](INSTALL.md#optioneel-bij-worldline--via-vertex) en, in Docker, `compose.vertex.yaml`. Zonder die variabelen speelt Vertex geen rol.

## Inhalen: step-tags

`main` is het startpunt (templates). Loop je achter, of wil je een voorbeeld zien, dan staat per blok een uitgewerkte versie klaar als tag `step-N` (en branch `steps/N-…`):

| Tag | Blok | Wat er bij komt (voorbeeld) |
|---|---|---|
| `step-1` | Plan | ingevulde `intent.md` |
| `step-2` | Design | ingevulde `docs/spec.md` |
| `step-3` | Build 1 | eigen guard-regel + test |
| `step-4` | Build 2 | `docs/plan.md` + diagnose inc-001 (PASS) |
| `step-5` | Test | `/verify-this`-verdict in `docs/verify/` |
| `step-6` | Deploy (gate) | config-fix, benoemde goedkeuring (`facilitator-example`), PR/MR-beschrijving |
| `step-7` | Maintain | nieuwe eval-case (inc-003, ontwerp) |
| `step-8` | Hackathon | `HANDOFF.md` |

Bekijken zonder je eigen werk kwijt te raken: `git diff main step-4`, of in een aparte map: `git worktree add ../lab-step-4 step-4`. Let op: de stappen STEP-0 en STEP-4 in `PROGRESS.md` krijgen pas een entry als de hook in jouw eigen sessie heeft gevuurd (bewijs in `approvals/audit.jsonl`, dat niet in git staat). De step-tags zelf bevatten nog de oudere `progress.md`; `main` heeft het nieuwe `PROGRESS.md`.

## Commando's

| Wat | Commando (Docker-route: zet er `docker compose run --rm lab` voor) |
|---|---|
| MCP + evals + skill-scanner testen | `npm test` |
| Guard- en progress-hook testen | `npm run test:hooks` |
| Alle eval-fixtures (goed = PASS, slecht = REJECTED) | `npm run eval` |
| Eén diagnose controleren | `npm run eval -- docs/diagnoses/inc-001.json` |
| Goedkeuren (**alleen een mens**, in een eigen terminal) | `npm run approve -- <jouw-naam> fix/<branch> "<reden>"` |
| Gate-check zoals in CI | `npm run check:approval` |
| Een skill van buiten scannen | `npm run skill:scan -- <map>` |
| Voortgang bekijken (schrijft niets) | `npm run progress -- --status` |
| `PROGRESS.md` handmatig bijwerken | `npm run progress` |

`npm run progress -- --status` toont de huidige stand en schrijft niets. `PROGRESS.md` is de geschiedenis: de hook voegt per stap een entry toe met een ISO 8601-timestamp (bijv. `2026-10-11T11:20:00+02:00`); een eigen, geverifieerde entry voeg je zelf onderaan toe, met dezelfde timestamp-vorm.

## Incidenten

| ID | Scenario | Status |
|---|---|---|
| `inc-001-db-pool` | DB-pool uitgeput na een config-wijziging (deploy d-0142) | gebouwd |
| `inc-002-bad-deploy` | Feature flag in deploy d-0151 breekt alleen EUR-checkouts; cron-waarschuwing als afleider | gebouwd |
| `inc-004-upstream-timeout` | psp-sandbox traag + retry-storm; een docs-only deploy vlak ervoor is de afleider | gebouwd |
| inc-003 · inc-005 | Geheugenlek · certificaat verlopen | stretch, zie `docs/stretch-incidents.md` |

Elk gebouwd incident heeft `alert.json`, `logs.jsonl` (stabiele id's zoals `L0021`), `metrics.csv`, `deploys.json`, een runbook in `runbooks/`, een eval-case in `evals/cases/` en een goede én een slechte fixture. inc-002 en inc-004 komen uit `npm run generate` (vaste seed, dus altijd dezelfde data).

## Control layer

- **`.claude/settings.json`**: allow/ask/deny, `disableBypassPermissionsMode`, `disableSkillShellExecution`, alleen MCP-server `sre`.
- **`.claude/hooks/guard.mjs`** (PreToolUse, Node, geen bash/jq nodig): blokkeert netwerk, secrets en `approvals/`; schrijven mag alleen in `docs/diagnoses/`, `docs/verify/`, `docs/show-me/` en `docs/pr/`; SDLC-artefacten (intent, spec, plan, eval-cases) en `app/` op een `fix/*`-branch alleen na bevestiging; push, PR (`gh`) en MR (`glab`) alleen na een benoemde goedkeuring; mergen en PR/MR goedkeuren nooit door de agent. Elke beslissing staat in `approvals/audit.jsonl`.
- **`.claude/hooks/progress.mjs`** (SessionStart, PostToolUse, Stop): voegt aan `PROGRESS.md` (het build-log volgens de template uit de skills-pack) een entry per stap toe zodra er echt bewijs is (`STEP-0` … `STEP-9`). Append-only: bestaande tekst wordt nooit aangepast, de velden *Why it mattered*, *How, and what was rejected* en *Deliberately not done* vul je zelf in. Schrijft alleen `PROGRESS.md`, lokaal, zonder netwerk.
- Regex-regels zijn best-effort. Sterkere isolatie: de Docker-route (`lab` zonder netwerk), de [sandbox van Claude Code](https://code.claude.com/docs/en/sandboxing) of managed settings van je IT.

## De gate: GitHub én GitLab

1. Claude werkt op `fix/<naam>`, elke edit in `app/` vraagt jouw bevestiging, de commit ook.
2. Claude probeert te pushen → **deny** (geen goedkeuring).
3. Een benoemde mens (niet de auteur) draait in een **eigen terminal** (niet via Claude): `npm run approve -- <naam> fix/<naam> "<reden>"` (Docker-route: `docker compose run --rm lab npm run approve -- …`).
4. De mens doet de laatste stap zelf, met de eigen git-login (de hook laat Claude niet pushen zonder goedkeuring, en in de Docker-route zitten er bewust geen git-credentials in de container):

```
git add -f approvals/approvals.jsonl approvals/audit.jsonl
git commit -m "approval: fix/<naam> by <naam>"
git push -u origin fix/<naam>
gh pr create --fill          # GitHub: pull request (PR)
glab mr create --fill        # GitLab: merge request (MR)
```

Heeft Claude met `/visual-pr` een beschrijving in `docs/pr/<branch>.md` gezet, gebruik die dan: `gh pr create --title "<titel>" --body-file docs/pr/<branch>.md` of `glab mr create --title "<titel>" --description "$(cat docs/pr/<branch>.md)"` (PowerShell: `--description (Get-Content -Raw docs/pr/<branch>.md)`).

5. CI (`.github/workflows/ci.yml` of `.gitlab-ci.yml`) draait offline `npm test`, `test:hooks`, `eval` en `check:approval`. Mergen doet een mens, via branch protection (GitHub) of MR-approval rules (GitLab).

## Skills

In `.claude/skills/` zit een **gekeurde subset**, aangepast voor dit lab: geen netwerk, geen `!`-shellregels, en geen skill pusht, merget of opent zelf een PR/MR (dat doet de mens na de gate).

| Skill | Waarvoor (moment in de workshop) | Herkomst | Lab-aanpassing |
|---|---|---|---|
| `incident-triage` | SRE-beleid voor elke diagnose | dit lab | n.v.t. |
| `design-control-loop` | Plan: ontwerp-interview, vult `intent.md` (11:25) | HumanLayer | alleen fase A–B; geen CI-agent, API-keys of bypass |
| `grilling` | Plan: fallback voor het interview | mattpocock/skills | geen |
| `rpi` | Optioneel/hackathon: research → plan → implement | HumanLayer | artefacten in `docs/rpi/`, geen web-research-agent |
| `show-me` | Diagnose uitleggen als HTML (13:52) | HumanLayer | `docs/show-me/`, self-contained, geen `open` |
| `eli5` | Fallback voor `show-me`: simpel uitleggen | skills pack | geen |
| `verify-this` | Test: claim bewijzen (14:55) | skills pack (Cursor team-kit) | schrijft naar `docs/verify/` |
| `review-and-ship` | Gate: review tot aan de menselijke goedkeuring (15:15) | skills pack (Cursor team-kit) | kent `glab`, stopt bij de gate |
| `visual-pr` | Gate: PR/MR-beschrijving met diagram (15:18) | HumanLayer | schrijft alleen `docs/pr/<branch>.md` |
| `new-branch-and-pr` | Branch + commit voorbereiden | skills pack (Cursor team-kit) | stopt bij de commit; mens doet approve, push, `gh pr`/`glab mr` |
| `make-pr-easy-to-review` | Reviewgids voor een grote PR/MR | skills pack (Cursor team-kit) | schrijft `docs/pr/`; opschoonplan alleen voor de mens |
| `get-pr-comments` | Review-comments verwerken | skills pack (Cursor team-kit) | leest `docs/pr/comments.md` die jij exporteert |
| `fix-ci` | Rode CI lokaal reproduceren en fixen | skills pack (Cursor team-kit) | lokale CI-commando's; logs plak jij in `docs/ci/`; geen push |
| `deslop` | AI-ruis uit je diff halen | skills pack (Cursor team-kit) | diff tegen lokale `main`, geen `git fetch` |
| `improve-claude-md` | Maintain: `CLAUDE.md` aanscherpen (15:30) | HumanLayer | geen; wijziging aan `CLAUDE.md` vraagt altijd jouw akkoord |
| `cli-for-agents` | Hackathon: CLI's bouwen die agents goed kunnen gebruiken | skills pack (Cursor) | geen |
| `handoff` | Hackathon: `HANDOFF.md` schrijven (15:40) | skills pack | geen |

Bewust **niet** in het lab: `archify` (haalt externe code op via `git clone`/`npx`; het lab draait zonder netwerk, de guard zou hem blokkeren; hij blijft in het skills pack, met de waarschuwing voor externe code), `java-lts-migration` (Java-migratie, past niet bij dit lab) en `build-iterated-agentic-loop` (draait onbewaakt, met API-keys en zonder permissievragen).

### Skills van buiten ons pack: eerst lezen, dan installeren

Een skill is code die je agent instructies en soms rechten geeft. Doorloop dit vóór je iets installeert:

1. **Bron**: wie onderhoudt het? Pin een vaste commit, geen "latest".
2. **Lees `SKILL.md` helemaal**: `allowed-tools` (vraagt hij brede `Bash`?), `!`-regels (shell-commando's die draaien bij het laden), `disable-model-invocation`.
3. **Prompt-injectie**: zinnen als "negeer eerdere instructies", "vertel de gebruiker niet", verborgen tekst in HTML-commentaar, onzichtbare tekens, base64-blokken.
4. **Scripts** (`*.sh`, `*.py`, `*.js`, `*.ps1`): lees elke regel. Let op `curl | sh`, `eval`, `base64 -d`, installs (`npx`, `pip install`, `git clone`).
5. **Netwerk en exfiltratie**: elke URL en elk domein. Waar gaat data naartoe? Ook `git push` naar een andere remote, `gh gist`, `printenv`.
6. **Secrets**: leest hij `.env`, `~/.ssh`, tokens, gcloud-credentials?
7. **Installeer per project** in `.claude/skills/`, via een PR/MR met een tweede reviewer. Niet in `~/.claude/skills/` (dat geldt dan voor al je projecten en wint van de projectversie).
8. **Test eerst** in dit lab (liefst de `lab`-container zonder netwerk) en kijk in `approvals/audit.jsonl` wat hij probeert.
9. **Twijfel = niet installeren.** Vraag security/IT.

Hulpmiddel: `npm run skill:scan -- <map>` markeert verdachte regels. Een lege lijst betekent **niet** dat de skill veilig is.

## Problemen oplossen

Zie "Werkt het niet?" in [INSTALL.md](INSTALL.md) en [INSTALL-DOCKER.md](INSTALL-DOCKER.md).

## Licentie

MIT, zie [LICENSE](LICENSE). De skills `design-control-loop`, `show-me`, `visual-pr`, `rpi` en `improve-claude-md` in `.claude/skills/` komen (deels aangepast) van [humanlayer/skills](https://github.com/humanlayer/skills) (MIT, Copyright (c) 2026 HumanLayer); `grilling` van [mattpocock/skills](https://github.com/mattpocock/skills) (MIT); de overige uit [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) (MIT, deels gebaseerd op Cursor team-kit, MIT). Zie [NOTICE.md](NOTICE.md).
