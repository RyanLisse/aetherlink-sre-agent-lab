# Installatie, stap voor stap (standaardroute: zonder Docker)

Voor iedereen, ook als je zelden een terminal opent. Reken op **30–45 minuten** en doe het **vóór de workshopdag**. Loop je vast? Kijk onderaan bij **Werkt het niet?**. Lukt het echt niet, of werk je liever in een container: gebruik [INSTALL-DOCKER.md](INSTALL-DOCKER.md).

**Belangrijk vooraf**
- Volg altijd eerst het beleid van je eigen organisatie. Mag je iets niet zelf installeren, vraag het dan aan je IT-team (stuur ze deze pagina).
- AetherLink ontvangt of bewaart **geen** data van jou of je organisatie. Alles draait op je eigen laptop; Claude Code gebruikt **jouw eigen** login. Zie de disclaimer in [README.md](README.md).
- Het lab zelf (tests, evals, hooks, de MCP-server) heeft **geen model en geen login** nodig. Alleen het werken mét Claude Code vraagt een Claude-login.
- Alle links hieronder zijn officiële pagina's van de makers (gecontroleerd op 11 okt 2026).

**Wat heb je nodig?**

| # | Onderdeel | Nodig? |
|---|---|---|
| 1 | Een terminal | ja |
| 2 | Git | ja |
| 3 | Node.js (LTS) | ja |
| 4 | Claude Code + een Claude-login | ja (voor het werken met de agent) |
| 5 | VS Code of je eigen IDE | ja (een editor) |
| 6 | GitHub CLI (`gh`) **of** GitLab CLI (`glab`) | aanbevolen, voor de PR/MR-stap |
| — | Docker | **nee**, alleen in de alternatieve route ([INSTALL-DOCKER.md](INSTALL-DOCKER.md)) |
| — | Google Cloud / Vertex | **nee**, alleen als je organisatie Claude via Vertex aanbiedt (zie [Via Vertex](#optioneel-bij-worldline--via-vertex)) |

---

## Stap 1 · Een terminal openen

- **Windows**: open **PowerShell** (Start-menu → typ "PowerShell" → Enter). Windows Terminal is handig maar niet verplicht: https://learn.microsoft.com/en-us/windows/terminal/install
- **macOS**: open **Terminal** (Spotlight met Cmd+Spatie → typ "Terminal"). Uitleg: https://support.apple.com/guide/terminal/open-or-quit-terminal-apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac
- **Linux**: open je terminal-app (vaak Ctrl+Alt+T).
- Nooit eerder een terminal gebruikt? Anthropic heeft een korte gids: https://code.claude.com/docs/en/terminal-guide

Alle commando's hieronder typ of plak je in dit venster en bevestig je met Enter.

## Stap 2 · Git

- **Windows**: https://git-scm.com/downloads/win → **Click here to download** → installeren met de standaardkeuzes. Dit installeert ook **Git Bash**, dat Claude Code op Windows gebruikt.
- **macOS**: https://git-scm.com/downloads/mac (makkelijkste route: typ `git --version`; macOS biedt dan zelf de "Command Line Developer Tools" aan → **Installeer**).
- **Linux**: https://git-scm.com/downloads/linux (bijvoorbeeld `sudo apt install git`).

**Werkt het?** `git --version` → verwacht `git version 2.…`

## Stap 3 · Node.js (LTS)

Download de **LTS**-versie (Long Term Support) voor jouw systeem: https://nodejs.org/en/download → installeren met de standaardkeuzes. Versie 22 of nieuwer werkt; neem de LTS die de site aanraadt.

**Werkt het?** Open een **nieuwe** terminal:
```
node --version
npm --version
```
Verwacht: `v22.…` of hoger, en een versienummer voor npm.

## Stap 4 · Claude Code en inloggen

Installeer Claude Code volgens https://code.claude.com/docs/en/setup:
- **Windows (PowerShell)**: `irm https://claude.ai/install.ps1 | iex`
- **macOS / Linux**: `curl -fsSL https://claude.ai/install.sh | bash`

**Werkt het?** Nieuwe terminal → `claude --version` → verwacht `2.… (Claude Code)`.

**Inloggen** (eenmalig): typ `claude`, en volg de login-stappen in de browser met **je eigen** Claude-account (abonnement of Console/API-account). Of gebruik een API-key van je eigen account via de omgevingsvariabele `ANTHROPIC_API_KEY` (zet die nooit in een bestand in de repo). Uitleg over de opties: https://code.claude.com/docs/en/authentication

Werk je via je organisatie met Google Vertex AI? Sla dit inloggen over en lees [Bij Worldline / via Vertex](#optioneel-bij-worldline--via-vertex).

## Stap 5 · Editor: VS Code (of je eigen IDE)

- VS Code: https://code.visualstudio.com/download → kies je systeem → installeren met de standaardkeuzes.
- Optioneel de **Claude Code**-extensie: https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code (uitleg: https://code.claude.com/docs/en/vs-code)
- JetBrains of een andere IDE werkt ook: je gebruikt Claude Code dan in de ingebouwde terminal.

**Werkt het?** `code --version` → verwacht een versienummer zoals `1.…`. (Op macOS eerst in VS Code: Cmd+Shift+P → "Shell Command: Install 'code' command in PATH".)

## Stap 6 · GitHub CLI of GitLab CLI

Installeer de CLI van de git-host die je gebruikt (of beide):
- **GitHub** (`gh`, pull requests): https://cli.github.com/ · handleiding: https://cli.github.com/manual/ · inloggen: `gh auth login`
- **GitLab** (`glab`, merge requests): https://gitlab.com/gitlab-org/cli (installatie onder "Installation") · documentatie: https://docs.gitlab.com/cli/ · inloggen: `glab auth login`

**Werkt het?** `gh --version` → verwacht `gh version 2.…` · of `glab --version` → verwacht een regel die met `glab` begint.

## Stap 7 · Het lab ophalen en testen

Kies een korte map zonder spaties, bijvoorbeeld `C:\dev` (Windows) of `~/dev` (macOS/Linux).

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
npm ci
npm test
npm run test:hooks
npm run eval
```

Werkt het? Verwacht:
- `npm test` → aan het eind `pass 13` en `fail 0` (met `#` of `ℹ` ervoor, afhankelijk van je Node-versie)
- `npm run test:hooks` → drie keer `pass=… fail=0`
- `npm run eval` → zes regels die met `ok` beginnen (goede voorbeelden `PASS`, slechte `REJECTED`)

Geen van deze stappen gebruikt een model, een login of internet (behalve `npm ci` en `git clone`).

## Stap 8 · Claude Code in het lab starten

```
claude
```
1. Vraag "Do you trust the files in this folder?" → **Yes** (anders worden de lab-regels en hooks genegeerd).
2. Vraag over de MCP-server `sre` → **goedkeuren**.
3. Typ `/status` → je ziet je eigen login (of Google Vertex AI, als je die route gebruikt).
4. Typ `/mcp` → `sre` staat op **connected**.
5. Typ `/` → in de lijst staan `design-control-loop`, `grilling`, `show-me`, `verify-this`, `review-and-ship`, `visual-pr`, `handoff` en `incident-triage`.
6. Open `progress.md`: in het blok tussen `AUTO:START` en `AUTO:END` staat "0 · Setup" nu afgevinkt.
7. Stoppen: typ `/exit`.

---

## Optioneel: Bij Worldline / via Vertex

Alleen als je organisatie Claude aanbiedt via **Google Vertex AI**. De waarden krijg je van je eigen IT-team; AetherLink heeft geen toegang tot jullie systemen.

| Naam | Waarde | Van wie |
|---|---|---|
| `CLAUDE_CODE_USE_VERTEX` | `1` | vast |
| `ANTHROPIC_VERTEX_PROJECT_ID` | `<GCP-project>` | je IT-team |
| `CLOUD_ML_REGION` | `<regio, bv. global of eu>` | je IT-team |
| `ANTHROPIC_MODEL` (optioneel) | `<vastgezet model>` | je IT-team |

1. Installeer de Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Log in voor programma's: `gcloud auth application-default login` (uitleg: https://cloud.google.com/docs/authentication/provide-credentials-adc)
3. Zet de variabelen in je terminal en start Claude Code:
   - macOS / Linux:
     ```
     export CLAUDE_CODE_USE_VERTEX=1
     export ANTHROPIC_VERTEX_PROJECT_ID=<GCP-project>
     export CLOUD_ML_REGION=<regio>
     claude
     ```
   - Windows (PowerShell):
     ```
     $env:CLAUDE_CODE_USE_VERTEX = "1"
     $env:ANTHROPIC_VERTEX_PROJECT_ID = "<GCP-project>"
     $env:CLOUD_ML_REGION = "<regio>"
     claude
     ```
   Of gebruik in Claude Code de wizard `/setup-vertex`.
4. `/status` → verwacht `Google Vertex AI`. Officiële uitleg: https://code.claude.com/docs/en/google-vertex-ai
5. Na de workshop kun je de login intrekken: `gcloud auth application-default revoke` (https://cloud.google.com/sdk/gcloud/reference/auth/application-default/revoke).

## Werkt het niet?

| Wat je ziet | Wat je doet |
|---|---|
| `node`, `npm`, `git` of `claude` "wordt niet herkend" / "command not found" | Open een **nieuwe** terminal na het installeren. Nog steeds? Herstart je laptop (PATH wordt dan opnieuw geladen). |
| Windows: "running scripts is disabled on this system" bij `npm` of `claude` | PowerShell-beleid. Gebruik `npm.cmd ci` / `npm.cmd test`, of vraag IT. Uitleg: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies |
| `npm ci` faalt met een netwerk- of proxyfout | Bedrijfsproxy: vraag IT om de npm-proxy-instellingen (https://docs.npmjs.com/cli/v10/using-npm/config#proxy). |
| `npm test` of `test:hooks` faalt na `git pull` | `npm ci` opnieuw draaien. |
| Windows: vreemde fouten met `^M` | De repo is met Windows-regeleindes uitgecheckt. Opnieuw clonen; de repo forceert LF via `.gitattributes`. |
| Regels uit `.claude/settings.json` lijken te worden genegeerd, `progress.md` blijft 0/9 | De trust-vraag is niet geaccepteerd. Start `claude` opnieuw in de lab-map en kies **Yes**. |
| MCP `sre` "Pending approval" of "failed" | Start `claude` in de lab-map (niet in een submap) en keur goed. Controleer dat `npm ci` gelukt is. |
| Claude Code vraagt steeds om in te loggen | `/login` in Claude Code. Zie https://code.claude.com/docs/en/authentication |
| Vertex: "Could not load the default credentials" | `gcloud auth application-default login` opnieuw, daarna `claude` opnieuw. |
| Vertex: "model not found" of 404 | Model staat niet aan in jullie project of regio: vraag IT om `ANTHROPIC_MODEL` en de juiste regio. |
| `gh`/`glab` vraagt om in te loggen | `gh auth login` of `glab auth login`. |
| Alles blijft haken | Gebruik de Docker-route: [INSTALL-DOCKER.md](INSTALL-DOCKER.md). |
| Iets anders met Claude Code | https://code.claude.com/docs/en/troubleshooting |
