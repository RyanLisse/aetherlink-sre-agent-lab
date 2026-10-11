# Alternatieve route: het lab in Docker

Voor wie problemen heeft met de standaardroute ([INSTALL.md](INSTALL.md)), of liever alles in een container draait. De container is op Windows, macOS en Linux identiek: Node, de hooks, de MCP-server en (optioneel) Claude Code zitten erin. Je hebt dan **geen Node** op je laptop nodig.

Zelfde disclaimer als in [README.md](README.md): AetherLink ontvangt of bewaart geen data van jou of je organisatie; je gebruikt alles onder het beleid van je eigen organisatie.

## Stap 1 · Docker installeren

> **Licentie:** Docker Desktop is gratis voor kleine organisaties, maar **betaald voor organisaties met 250 of meer medewerkers of meer dan $10 miljoen omzet** (https://docs.docker.com/subscription/desktop-license/). Vraag IT wat je organisatie voorschrijft.

**Windows**
1. Docker Desktop heeft WSL 2 nodig: https://learn.microsoft.com/en-us/windows/wsl/install (kort: PowerShell **als administrator** → `wsl --install` → herstarten).
2. Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/ → **Docker Desktop for Windows** → laat **"Use WSL 2 instead of Hyper-V"** aangevinkt → **OK** → **Close** → herstart als daarom gevraagd wordt.
3. Start **Docker Desktop** en wacht op **Engine running**. Meer over WSL in Docker: https://docs.docker.com/desktop/features/wsl/

**macOS**
1.  → **Over deze Mac**: "Apple M…" of "Intel".
2. https://docs.docker.com/desktop/setup/install/mac-install/ → open `Docker.dmg` → sleep **Docker** naar **Programma's** → open Docker → **Accept** → aanbevolen instellingen.

**Linux**
- Docker Desktop: https://docs.docker.com/desktop/setup/install/linux/
- Of Docker Engine: https://docs.docker.com/engine/install/ en daarna https://docs.docker.com/engine/install/linux-postinstall/ (werken zonder `sudo`). Compose: https://docs.docker.com/compose/install/

**Werkt het?**
```
docker --version
docker compose version
```
Verwacht: `Docker version 2…` en `Docker Compose version v2…`.

Git heb je ook nodig: zie stap 2 van [INSTALL.md](INSTALL.md).

## Stap 2 · Het lab ophalen en testen (zonder model, zonder netwerk)

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
docker compose build
docker compose up lab
```
Verwacht aan het eind: `pass 13`, `fail 0` (met `#` of `ℹ` ervoor, afhankelijk van de Node-versie) en `lab-1 exited with code 0`. De `lab`-container draait **zonder netwerk**.

Hook-tests en evals:
```
docker compose run --rm lab npm run test:hooks
docker compose run --rm lab npm run eval
```

## Stap 3 · Claude Code in de container (met je eigen login)

```
docker compose -f compose.yaml -f compose.agent.yaml run --rm agent
```
- De eerste keer: log in met **je eigen** Claude-account (Claude Code laat de stappen zien; of typ `/login`). De login blijft bewaard in het Docker-volume `claude-config`, niet in de repo.
- Of gebruik een API-key van je eigen account: zet `ANTHROPIC_API_KEY` in je terminal vóór het commando (macOS/Linux `export ANTHROPIC_API_KEY=…`, Windows `$env:ANTHROPIC_API_KEY = "…"`). Compose geeft hem alleen door; hij komt niet in het image of de repo.
- Daarna zoals in stap 8 van [INSTALL.md](INSTALL.md): trust → **Yes**, MCP `sre` goedkeuren, `/status`, `/mcp`, `/`.
- Je git-login zit bewust **niet** in de container. Pushen en een PR/MR openen doe je op je laptop zelf (zie README, "Menselijke gate").

**VS Code:** installeer de extensie **Dev Containers** (https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers, uitleg: https://code.visualstudio.com/docs/devcontainers/containers) en kies **Reopen in Container**. Officiële uitleg over Claude Code in een container: https://code.claude.com/docs/en/devcontainer

**Claude Code op je laptop, alleen de MCP in Docker** (kan ook): de server start dan met `docker compose --profile mcp run --rm -T mcp`. Zet dat commando in een eigen, niet-gecommit `.mcp.json`-variant; de standaard `.mcp.json` start de server met `node`.

## Optioneel: Bij Worldline / via Vertex (in Docker)

Alleen als je organisatie Claude via Google Vertex AI aanbiedt. Waarden van je eigen IT-team. Eerst op je laptop: `gcloud auth application-default login` (zie [INSTALL.md](INSTALL.md#optioneel-bij-worldline--via-vertex)).

macOS / Linux:
```
export ANTHROPIC_VERTEX_PROJECT_ID=<GCP-project>
export CLOUD_ML_REGION=<regio>
export GCLOUD_ADC_FILE="$HOME/.config/gcloud/application_default_credentials.json"
docker compose -f compose.yaml -f compose.agent.yaml -f compose.vertex.yaml run --rm agent
```
Windows (PowerShell):
```
$env:ANTHROPIC_VERTEX_PROJECT_ID = "<GCP-project>"
$env:CLOUD_ML_REGION = "<regio>"
$env:GCLOUD_ADC_FILE = "$env:APPDATA\gcloud\application_default_credentials.json"
docker compose -f compose.yaml -f compose.agent.yaml -f compose.vertex.yaml run --rm agent
```
Alleen het ADC-bestand gaat naar binnen, **read-only**. `/status` → verwacht `Google Vertex AI`. Zonder `compose.vertex.yaml` speelt Vertex geen enkele rol.

## Werkt het niet?

| Wat je ziet | Wat je doet |
|---|---|
| `docker: command not found` / "wordt niet herkend" | Docker Desktop niet geïnstalleerd of niet gestart. Start het, wacht op "Engine running", open een **nieuwe** terminal. |
| `Cannot connect to the Docker daemon` | Docker draait niet. Linux: `sudo systemctl start docker` + de post-install-stap. |
| Windows: Docker Desktop klaagt over WSL | `wsl --update` (PowerShell als administrator), herstarten. |
| `docker compose build` faalt met netwerk/proxy | Bedrijfsproxy: Docker Desktop → Settings → Resources → Proxies; vraag IT. https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/ |
| `compose.vertex.yaml needs ANTHROPIC_VERTEX_PROJECT_ID / GCLOUD_ADC_FILE` | Alleen bij de Vertex-route: variabelen zetten in **dit** terminalvenster. Geen Vertex? Laat `-f compose.vertex.yaml` weg. |
| "bind source path does not exist" | `GCLOUD_ADC_FILE` wijst naar een niet-bestaand bestand: eerst `gcloud auth application-default login`. |
| `# fail` groter dan 0 | Na `git pull`: `docker compose down -v` en `docker compose build`. |
| Linux: "permission denied" bij schrijven | Je gebruikers-id is niet 1000. Tijdelijk: `sudo chown -R 1000:1000 .` in de lab-map. |
| Windows: `^M` of "bad interpreter" | Opnieuw clonen; `.gitattributes` forceert LF. |
