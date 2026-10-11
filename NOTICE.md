# Notices

This repository is MIT-licensed (see [LICENSE](LICENSE)). It contains adapted third-party skills under their own MIT licenses; the full license texts are in [LICENSES/](LICENSES/).

| Path | Source | License | Changes |
|---|---|---|---|
| `.claude/skills/design-control-loop/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/design-control-loop` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer ([text](LICENSES/humanlayer-skills-MIT.txt)) | Lab version: design interview only (phases A–B), output to `intent.md`; `references/control-loop-taxonomy.md` verbatim |
| `.claude/skills/show-me/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/show-me` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer | HTML output to `docs/show-me/`, self-contained, no `open` |
| `.claude/skills/visual-pr/` | [humanlayer/skills](https://github.com/humanlayer/skills) `plugins/visual-pr` @ `653b641` | MIT, Copyright (c) 2026 HumanLayer | No `gh`/push/PR by the agent; writes `docs/pr/<branch>.md`; GitHub + GitLab commands for the human; references verbatim |
| `.claude/skills/grilling/` | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/productivity/grilling` | MIT, Copyright (c) 2026 Matt Pocock ([text](LICENSES/mattpocock-skills-MIT.txt)) | none |
| `.claude/skills/verify-this/`, `.claude/skills/review-and-ship/` | adapted from [cursor/plugins](https://github.com/cursor/plugins/tree/main/cursor-team-kit) `cursor-team-kit` via [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) | MIT, Copyright (c) 2026 Cursor ([text](LICENSES/cursor-team-kit-MIT.txt)) | Lab: `verify-this` writes to `docs/verify/`; `review-and-ship` also knows `glab` and stops at the human gate |
| `.claude/skills/handoff/` | [claude-code-skills-pack](https://github.com/RyanLisse/claude-code-skills-pack) | MIT (this repo's license) | none |

All sample data (incidents, logs, metrics, deploys, runbooks) is fictional and generated for training.
