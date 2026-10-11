# syntax=docker/dockerfile:1
# One image definition for Windows, macOS and Linux participants (Docker Desktop / Docker Engine).
# Target "lab":   Node 24 LTS + git + npm ci. Tests, evals, hooks, the local `sre` MCP. Runs with network_mode: none.
# Target "agent": lab + Claude Code (pinned, auto-update off). Uses the participant's own login (Anthropic account/API key, or optionally Vertex),
#                 Credentials are passed at run time (login volume / env var / optional read-only ADC mount) and are NEVER copied into the image.
FROM node:24-bookworm-slim AS lab
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && git config --system --add safe.directory /workspace/lab \
 && git config --system init.defaultBranch main \
 && mkdir -p /workspace/lab && chown -R node:node /workspace
USER node
WORKDIR /workspace/lab
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force
COPY --chown=node:node . .
ENV SRE_DATA_ROOT=/workspace/lab
CMD ["npm", "test"]

FROM lab AS agent
USER root
ARG CLAUDE_CODE_VERSION=2.1.296
RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" --no-audit --no-fund \
 && npm cache clean --force \
 && mkdir -p /home/node/.claude /home/node/.config/gcloud \
 && chown -R node:node /home/node
USER node
ENV CLAUDE_CONFIG_DIR=/home/node/.claude \
    DISABLE_AUTOUPDATER=1 \
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
CMD ["claude"]
