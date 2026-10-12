# Installation, step by step (standard route: no Docker)

For everyone, even if you rarely open a terminal. Allow **30–45 minutes** and do it **before the workshop day**. Stuck? Check **Not working?** at the bottom. If it really will not work, or you would rather use a container: use [INSTALL-DOCKER.md](INSTALL-DOCKER.md).

**Important before you start**
- Always follow your own organisation's policy first. If you are not allowed to install something yourself, ask your IT team (send them this page).
- AetherLink does not receive or store **any** data from you or your organisation. Everything runs on your own laptop; Claude Code uses **your own** login. See the disclaimer in [README.md](README.md).
- The lab itself (tests, evals, hooks, the MCP server) needs **no model and no login**. Only working *with* Claude Code requires a Claude login.
- All links below are official pages by the makers (checked on 11 Oct 2026).

**What do you need?**

| # | Component | Needed? |
|---|---|---|
| 1 | A terminal | yes |
| 2 | Git | yes |
| 3 | Node.js (LTS) | yes |
| 4 | Claude Code + a Claude login | yes (to work with the agent) |
| 5 | VS Code or your own IDE | yes (an editor) |
| 6 | GitHub CLI (`gh`) **or** GitLab CLI (`glab`) | recommended, for the PR/MR step |
| — | Docker | **no**, only in the alternative route ([INSTALL-DOCKER.md](INSTALL-DOCKER.md)) |
| — | Google Cloud / Vertex | **no**, only if your organisation offers Claude via Vertex (see [Via Vertex](#optional-at-worldline--via-vertex)) |

---

## Step 1 · Open a terminal

- **Windows**: open **PowerShell** (Start menu → type "PowerShell" → Enter). Windows Terminal is handy but not required: https://learn.microsoft.com/en-us/windows/terminal/install
- **macOS**: open **Terminal** (Spotlight with Cmd+Space → type "Terminal"). Explanation: https://support.apple.com/guide/terminal/open-or-quit-terminal-apdb66b5242-0d18-49fc-9c47-a2498b7c91d5/mac
- **Linux**: open your terminal app (often Ctrl+Alt+T).
- Never used a terminal before? Anthropic has a short guide: https://code.claude.com/docs/en/terminal-guide

Type or paste every command below into this window and confirm with Enter.

## Step 2 · Git

- **Windows**: https://git-scm.com/downloads/win → **Click here to download** → install with the defaults. This also installs **Git Bash**, which Claude Code uses on Windows.
- **macOS**: https://git-scm.com/downloads/mac (easiest route: type `git --version`; macOS then offers the "Command Line Developer Tools" itself → **Install**).
- **Linux**: https://git-scm.com/downloads/linux (for example `sudo apt install git`).

**Does it work?** `git --version` → expect `git version 2.…`

## Step 3 · Node.js (LTS)

Download the **LTS** version (Long Term Support) for your system: https://nodejs.org/en/download → install with the defaults. Version 22 or newer works; take the LTS the site recommends.

**Does it work?** Open a **new** terminal:
```
node --version
npm --version
```
Expect: `v22.…` or higher, and a version number for npm.

## Step 4 · Claude Code and logging in

Install Claude Code per https://code.claude.com/docs/en/setup:
- **Windows (PowerShell)**: `irm https://claude.ai/install.ps1 | iex`
- **macOS / Linux**: `curl -fsSL https://claude.ai/install.sh | bash`

**Does it work?** New terminal → `claude --version` → expect `2.… (Claude Code)`.

**Logging in** (once): type `claude`, and follow the login steps in the browser with **your own** Claude account (subscription or Console/API account). Or use an API key from your own account via the environment variable `ANTHROPIC_API_KEY` (never put it in a file in the repo). Explanation of the options: https://code.claude.com/docs/en/authentication

Working through your organisation with Google Vertex AI? Skip this login and read [At Worldline / via Vertex](#optional-at-worldline--via-vertex).

## Step 5 · Editor: VS Code (or your own IDE)

- VS Code: https://code.visualstudio.com/download → pick your system → install with the defaults.
- Optionally the **Claude Code** extension: https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code (explanation: https://code.claude.com/docs/en/vs-code)
- JetBrains or another IDE works too: you then use Claude Code in the built-in terminal.

**Does it work?** `code --version` → expect a version number like `1.…`. (On macOS first in VS Code: Cmd+Shift+P → "Shell Command: Install 'code' command in PATH".)

## Step 6 · GitHub CLI or GitLab CLI

Install the CLI of the git host you use (or both):
- **GitHub** (`gh`, pull requests): https://cli.github.com/ · manual: https://cli.github.com/manual/ · log in: `gh auth login`
- **GitLab** (`glab`, merge requests): https://gitlab.com/gitlab-org/cli (installation under "Installation") · docs: https://docs.gitlab.com/cli/ · log in: `glab auth login`

**Does it work?** `gh --version` → expect `gh version 2.…` · or `glab --version` → expect a line starting with `glab`.

## Step 7 · Get the lab and test it

Pick a short folder without spaces, e.g. `C:\dev` (Windows) or `~/dev` (macOS/Linux).

```
git clone https://github.com/RyanLisse/aetherlink-sre-agent-lab.git
cd aetherlink-sre-agent-lab
npm ci
npm test
npm run test:hooks
npm run eval
```

Does it work? Expect:
- `npm test` → at the end `pass 17` and `fail 0` (with `#` or `ℹ` in front, depending on your Node version)
- `npm run test:hooks` → three times `pass=… fail=0`
- `npm run eval` → six lines that start with `ok` (good examples `PASS`, bad ones `REJECTED`)

None of these steps uses a model, a login or the internet (except `npm ci` and `git clone`).

## Step 8 · Start Claude Code in the lab

```
claude
```
1. Question "Do you trust the files in this folder?" → **Yes** (otherwise the lab rules and hooks are ignored).
2. Question about the MCP server `sre` → **approve**.
3. Type `/status` → you see your own login (or Google Vertex AI, if you use that route).
4. Type `/mcp` → `sre` is **connected**.
5. Type `/` → the list shows `design-control-loop`, `grilling`, `show-me`, `verify-this`, `review-and-ship`, `visual-pr`, `handoff` and `incident-triage`.
6. Run `npm run progress -- --status`: "STEP-0 Setup" is now `[x]`, and at the bottom of `PROGRESS.md` there is an entry `(STEP-0)`.
7. To stop: type `/exit`.

---

## Optional: At Worldline / via Vertex

Only if your organisation offers Claude via **Google Vertex AI**. You get the values from your own IT team; AetherLink has no access to your systems.

| Name | Value | From whom |
|---|---|---|
| `CLAUDE_CODE_USE_VERTEX` | `1` | fixed |
| `ANTHROPIC_VERTEX_PROJECT_ID` | `<GCP project>` | your IT team |
| `CLOUD_ML_REGION` | `<region, e.g. global or eu>` | your IT team |
| `ANTHROPIC_MODEL` (optional) | `<pinned model>` | your IT team |

1. Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Log in for applications: `gcloud auth application-default login` (explanation: https://cloud.google.com/docs/authentication/provide-credentials-adc)
3. Set the variables in your terminal and start Claude Code:
   - macOS / Linux:
     ```
     export CLAUDE_CODE_USE_VERTEX=1
     export ANTHROPIC_VERTEX_PROJECT_ID=<GCP project>
     export CLOUD_ML_REGION=<region>
     claude
     ```
   - Windows (PowerShell):
     ```
     $env:CLAUDE_CODE_USE_VERTEX = "1"
     $env:ANTHROPIC_VERTEX_PROJECT_ID = "<GCP project>"
     $env:CLOUD_ML_REGION = "<region>"
     claude
     ```
   Or use the `/setup-vertex` wizard in Claude Code.
4. `/status` → expect `Google Vertex AI`. Official docs: https://code.claude.com/docs/en/google-vertex-ai
5. After the workshop you can revoke the login: `gcloud auth application-default revoke` (https://cloud.google.com/sdk/gcloud/reference/auth/application-default/revoke).

## Not working?

| What you see | What you do |
|---|---|
| `node`, `npm`, `git` or `claude` "is not recognised" / "command not found" | Open a **new** terminal after installing. Still nothing? Restart your laptop (PATH is reloaded). |
| Windows: "running scripts is disabled on this system" with `npm` or `claude` | PowerShell policy. Use `npm.cmd ci` / `npm.cmd test`, or ask IT. Explanation: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies |
| `npm ci` fails with a network or proxy error | Company proxy: ask IT for the npm proxy settings (https://docs.npmjs.com/cli/v10/using-npm/config#proxy). |
| `npm test` or `test:hooks` fails after `git pull` | Run `npm ci` again. |
| Windows: strange errors with `^M` | The repo was checked out with Windows line endings. Clone again; the repo forces LF via `.gitattributes`. |
| Rules from `.claude/settings.json` seem to be ignored, `npm run progress -- --status` stays at 0/10 | The trust question was not accepted. Start `claude` again in the lab folder and choose **Yes**. |
| MCP `sre` "Pending approval" or "failed" | Start `claude` in the lab folder (not a subfolder) and approve. Check that `npm ci` succeeded. |
| Claude Code keeps asking you to log in | `/login` in Claude Code. See https://code.claude.com/docs/en/authentication |
| Vertex: "Could not load the default credentials" | `gcloud auth application-default login` again, then `claude` again. |
| Vertex: "model not found" or 404 | The model is not enabled in your project or region: ask IT for `ANTHROPIC_MODEL` and the right region. |
| `gh`/`glab` asks you to log in | `gh auth login` or `glab auth login`. |
| Everything keeps failing | Use the Docker route: [INSTALL-DOCKER.md](INSTALL-DOCKER.md). |
| Something else with Claude Code | https://code.claude.com/docs/en/troubleshooting |
