# Design decisions (D-register)

One file per decision: `D<nn>-<short-topic>.md` (`D01-…`, `D02-…`). The progress hook marks **STEP-3 (Design: decision recorded)** as soon as a `*.md` file other than this README exists here — or under `docs/rpi/`.

For STEP-3, copy the template below into `D01-your-topic.md` and fill it in (5 lines is enough):

```md
# D01: <topic>
- **Decision:** <what you decided, one line>
- **Why:** <the reason, one line>
- **Rejected:** <the alternative you did not take>
- **Evidence:** <the file or command that backs it>
- **Status:** accepted — <YYYY-MM-DD>
```

Example: `D01-evidence-via-mcp-only.md` — "Evidence comes only from the `sre` MCP server, never from shell commands."

Later decisions get their own file (`D02-…`, `D03-…`); never renumber an existing one.
