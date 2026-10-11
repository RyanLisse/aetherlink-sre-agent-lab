# Notices

This repository is MIT-licensed (see [LICENSE](LICENSE)). It contains adapted third-party skills under their own MIT licenses; the full license texts are in [LICENSES/](LICENSES/).

| Path | Source | License | Changes |
|---|---|---|---|
| `.claude/skills/design-control-loop/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/design-control-loop` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer ([text](LICENSES/humanlayer-skills-MIT.txt)) | Lab version: design interview only (phases A–B), output to `intent.md`; `references/control-loop-taxonomy.md` verbatim |
| `.claude/skills/show-me/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/show-me` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer | HTML output to `docs/show-me/`, self-contained, no `open` |
| `.claude/skills/visual-pr/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/visual-pr` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer | No `gh`/push/PR by the agent; writes `docs/pr/<branch>.md`; GitHub + GitLab commands for the human; references verbatim |
| `.claude/skills/improve-claude-md/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/improve-claude-md` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer | none (verbatim); edits to `CLAUDE.md` always ask the human (guard hook) |
| `.claude/skills/rpi/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/rpi` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer | Lab: artifacts in `docs/rpi/` (committed via PR/MR), no web-research sub-agent (no network), `model: inherit` |
| `.claude/skills/grilling/` | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/grilling` | MIT, Copyright (c) 2026 Matt Pocock ([text](LICENSES/mattpocock-skills-MIT.txt)) | none |
| `.claude/skills/verify-this/`, `.claude/skills/review-and-ship/` | adapted from [cursor/plugins](https://github.com/cursor/plugins/tree/main/cursor-team-kit) `cursor-team-kit` via [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) | MIT, Copyright (c) 2026 Cursor ([text](LICENSES/cursor-team-kit-MIT.txt)) | Lab: `verify-this` writes to `docs/verify/`; `review-and-ship` also knows `glab` and stops at the human gate |
| `.claude/skills/deslop/`, `.claude/skills/new-branch-and-pr/`, `.claude/skills/fix-ci/`, `.claude/skills/get-pr-comments/`, `.claude/skills/make-pr-easy-to-review/` | adapted from [cursor/plugins](https://github.com/cursor/plugins/tree/main/cursor-team-kit) `cursor-team-kit` via [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) | MIT, Copyright (c) 2026 Cursor ([text](LICENSES/cursor-team-kit-MIT.txt)) | Lab versions: no network, no `!` shell lines, never push/merge or open PRs/MRs; `fix-ci` and `get-pr-comments` work on logs/comments the human exports to `docs/ci/` and `docs/pr/` |
| `.claude/skills/cli-for-agents/` | adapted from Cursor's `cli-for-agent` plugin ([cursor/plugins](https://github.com/cursor/plugins), MIT, Copyright (c) 2026 Cursor) via [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) | MIT | none (pack version) |
| `.claude/skills/eli5/` | [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) (original rewrite; see the pack's ATTRIBUTION.md) | MIT (this repo's license) | none |
| `.claude/skills/handoff/` | [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) | MIT (this repo's license) | none |

Not included on purpose: `archify` (downloads and runs external code via `git clone`/`npx`; the lab is offline), `java-lts-migration` (not relevant to this lab), `build-iterated-agentic-loop` (unattended loop with API keys and permission bypass). They stay in their source repos.

All sample data (incidents, logs, metrics, deploys, runbooks) is fictional and generated for training.
