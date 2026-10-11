/**
 * Local, read-only SRE MCP server (stdio). Mirrors a self-hosted MCP: it only reads sample files
 * under incidents/ and runbooks/. No network, no writes, bounded output, path-guarded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Root: explicit override, else the project dir Claude Code passes to MCP servers, else the repo this file lives in.
const ROOT = resolve(process.env.SRE_DATA_ROOT || process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), ".."));
const INC = join(ROOT, "incidents");
const RB = join(ROOT, "runbooks");
const MAX_LINES = 200;

const inside = (base: string, p: string) => { const r = resolve(p); if (!r.startsWith(base + sep)) throw new Error("path outside data root"); return r; };
const incidents = () => readdirSync(INC, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const read = (inc: string, file: string) => readFileSync(inside(INC, join(INC, inc, file)), "utf8");
const text = (v: unknown) => ({ content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 1) }] });
const guarded = <A,>(fn: (a: A) => unknown) => async (a: A) => { try { return text(fn(a)); } catch (e) { return { ...text(`ERROR: ${(e as Error).message}`), isError: true }; } };

const server = new McpServer({ name: "sre-local", version: "0.1.0" });

server.registerTool("list_alerts", { description: "List fired alerts across sample incidents (read-only).", inputSchema: {} },
  guarded(() => incidents().filter((i) => existsSync(join(INC, i, "alert.json"))).map((i) => JSON.parse(read(i, "alert.json")))));

server.registerTool("get_logs", {
  description: "Log lines (JSONL) for an incident, filtered by service, time window and level. Each line has a stable id (cite it).",
  inputSchema: { incident: z.string(), service: z.string().optional(), from: z.string().optional(), to: z.string().optional(), level: z.enum(["info", "warn", "error"]).optional(), contains: z.string().optional() },
}, guarded(({ incident, service, from, to, level, contains }) => {
  const lines = read(incident, "logs.jsonl").trim().split("\n").map((l) => JSON.parse(l));
  const out = lines.filter((l) => (!service || l.service === service) && (!from || l.ts >= from) && (!to || l.ts <= to) && (!level || l.level === level) && (!contains || l.msg.includes(contains)));
  return { total: out.length, truncated: out.length > MAX_LINES, lines: out.slice(0, MAX_LINES) };
}));

server.registerTool("get_metrics", {
  description: "Metric series (CSV ts,metric,value) for an incident, optionally one metric and a time window.",
  inputSchema: { incident: z.string(), metric: z.string().optional(), from: z.string().optional(), to: z.string().optional() },
}, guarded(({ incident, metric, from, to }) => {
  const rows = read(incident, "metrics.csv").trim().split("\n").slice(1).map((r) => { const [ts, m, v] = r.split(","); return { ts, metric: m, value: Number(v) }; });
  return rows.filter((r) => (!metric || r.metric === metric) && (!from || r.ts >= from) && (!to || r.ts <= to)).slice(0, MAX_LINES);
}));

server.registerTool("get_deploys", { description: "Deploy history for an incident's service.", inputSchema: { incident: z.string() } },
  guarded(({ incident }) => JSON.parse(read(incident, "deploys.json"))));

server.registerTool("get_runbook", { description: "Read a runbook by name (e.g. db-pool-exhaustion). Runbooks are cited, never executed.", inputSchema: { name: z.string().regex(/^[a-z0-9-]+$/) } },
  guarded(({ name }) => readFileSync(inside(RB, join(RB, `${name}.md`)), "utf8")));

await server.connect(new StdioServerTransport());
