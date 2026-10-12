# Alternative route: the lab in Docker

For anyone who has trouble with the standard route ([INSTALL.md](INSTALL.md)), or prefers to run everything in a container. The container is identical on Windows, macOS and Linux: Node, the hooks, the MCP server and (optionally) Claude Code are inside. You then need **no Node** on your laptop.

Same disclaimer as in [README.md](README.md): AetherLink does not receive or store data from you or your organisation; you use everything under your own organisation's policy.

## Step 1 · Install Docker

> **Licence:** Docker Desktop is free for small organisations, but **paid for organisations with 250 or more employees or more than $10 million in revenue** (https://docs.docker.com/subscription/desktop-license/). Ask IT what your organisation requires.

**Windows**
1. Docker Desktop needs WSL 2: https://learn.microsoft.com/en-us/windows/wsl/install (in short: PowerShell **as administrator** → `wsl --install` → restart).
2. Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/ → **Docker Desktop for Windows** → leave **"Use WSL 2 instead of Hyper-V"** ticked → **OK** → **Close** → restart if asked.
3. Start **Docker Desktop** and wait for **Engine running**. More about WSL in Docker: https://docs.docker.com/desktop/features/wsl/

**macOS**
1.  → **About This Mac**: "Apple M…" or "Intel".
2. https://docs.docker.com/desktop/setup/install/mac-install/ → open `Docker.dmg` → drag **Docker** to **Applications** → open Docker → **Accept** → recommended settings.

**Linux**
- Docker Desktop: https://docs.docker.com/desktop/setup/install/linux/
- Or Docker Engine: https://docs.docker.com/engine/install/ and then https://docs.docker.com/engine/install/linux-postinstall/ (work without `sudo`). Compose: https://docs.docker.com/compose/install/

**Does it work?**
```
docker --version
docker compose version
```
Expect: `Docker version 2…` and `Docker Compose version v2…`.

You also need Git: see step 2 of [INSTALL.md](INSTALL.md).

## Step 2 · Get the lab and test it (no model, no network)

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
docker compose build
docker compose up lab
```
Expect at the end: `pass 17`, `fail 0` (with `#` or `ℹ` in front, depending on the Node version) and `lab-1 exited with code 0`. The `lab` container runs **without a network**.

Hook tests and evals:
```
docker compose run --rm lab npm run test:hooks
docker compose run --rm lab npm run eval
```

## Step 3 · Claude Code in the container (with your own login)

```
docker compose -f compose.yaml -f compose.agent.yaml run --rm agent
```
- The first time: log in with **your own** Claude account (Claude Code shows the steps; or type `/login`). The login is kept in the Docker volume `claude-config`, not in the repo.
- Or use an API key from your own account: set `ANTHROPIC_API_KEY` in your terminal before the command (macOS/Linux `export ANTHROPIC_API_KEY=…`, Windows `$env:ANTHROPIC_API_KEY = "…"`). Compose only passes it through; it does not end up in the image or the repo.
- Then as in step 8 of [INSTALL.md](INSTALL.md): trust → **Yes**, approve MCP `sre`, `/status`, `/mcp`, `/`.
- Your git login is deliberately **not** in the container. You push and open a PR/MR on your laptop itself (see README, "Human gate").

**VS Code:** install the **Dev Containers** extension (https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers, explanation: https://code.visualstudio.com/docs/devcontainers/containers) and choose **Reopen in Container**. Official docs on Claude Code in a container: https://code.claude.com/docs/en/devcontainer

**Claude Code on your laptop, only the MCP in Docker** (also possible): the server then starts with `docker compose --profile mcp run --rm -T mcp`. Put that command in your own, uncommitted `.mcp.json` variant; the default `.mcp.json` starts the server with `node`.

## Optional: At Worldline / via Vertex (in Docker)

Only if your organisation offers Claude via Google Vertex AI. Values from your own IT team. First on your laptop: `gcloud auth application-default login` (see [INSTALL.md](INSTALL.md#optional-at-worldline--via-vertex)).

macOS / Linux:
```
export ANTHROPIC_VERTEX_PROJECT_ID=<GCP project>
export CLOUD_ML_REGION=<region>
export GCLOUD_ADC_FILE="$HOME/.config/gcloud/application_default_credentials.json"
docker compose -f compose.yaml -f compose.agent.yaml -f compose.vertex.yaml run --rm agent
```
Windows (PowerShell):
```
$env:ANTHROPIC_VERTEX_PROJECT_ID = "<GCP project>"
$env:CLOUD_ML_REGION = "<region>"
$env:GCLOUD_ADC_FILE = "$env:APPDATA\gcloud\application_default_credentials.json"
docker compose -f compose.yaml -f compose.agent.yaml -f compose.vertex.yaml run --rm agent
```
Only the ADC file goes in, **read-only**. `/status` → expect `Google Vertex AI`. Without `compose.vertex.yaml`, Vertex plays no role at all.

## Not working?

| What you see | What you do |
|---|---|
| `docker: command not found` / "is not recognised" | Docker Desktop not installed or not started. Start it, wait for "Engine running", open a **new** terminal. |
| `Cannot connect to the Docker daemon` | Docker is not running. Linux: `sudo systemctl start docker` + the post-install step. |
| Windows: Docker Desktop complains about WSL | `wsl --update` (PowerShell as administrator), restart. |
| `docker compose build` fails with network/proxy | Company proxy: Docker Desktop → Settings → Resources → Proxies; ask IT. https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/ |
| `compose.vertex.yaml needs ANTHROPIC_VERTEX_PROJECT_ID / GCLOUD_ADC_FILE` | Only on the Vertex route: set the variables in **this** terminal window. No Vertex? Leave out `-f compose.vertex.yaml`. |
| "bind source path does not exist" | `GCLOUD_ADC_FILE` points to a file that does not exist: run `gcloud auth application-default login` first. |
| `# fail` greater than 0 | After `git pull`: `docker compose down -v` and `docker compose build`. |
| Linux: "permission denied" when writing | Your user id is not 1000. Temporary: `sudo chown -R 1000:1000 .` in the lab folder. |
| Windows: `^M` or "bad interpreter" | Clone again; `.gitattributes` forces LF. |
