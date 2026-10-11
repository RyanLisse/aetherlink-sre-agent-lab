// Cross-platform config check: hooks and MCP must start with plain `node` (no bash, no npx .cmd shim on Windows),
// and the MCP server must work when launched the way .mcp.json describes, from any working directory.
import { readFileSync, mkdtempSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log(`ok   ${name}`); } else { fail++; console.log(`FAIL ${name} ${extra}`); } };

const settings = JSON.parse(readFileSync(join(repo, ".claude/settings.json"), "utf8"));
const hooks = Object.values(settings.hooks).flat().flatMap((m) => m.hooks);
ok("every hook is exec-form node", hooks.length >= 4 && hooks.every((h) => h.command === "node" && Array.isArray(h.args) && h.args.length === 1));
ok("hook scripts use ${CLAUDE_PROJECT_DIR}", hooks.every((h) => h.args[0].startsWith("${CLAUDE_PROJECT_DIR}/.claude/hooks/") && h.args[0].endsWith(".mjs")));
ok("no bash/sh in hook commands", !JSON.stringify(settings.hooks).match(/\b(bash|sh -c|\.sh\b|jq)\b/));
const perms = settings.permissions;
ok("PowerShell mirrors for allow/ask", perms.allow.filter((r) => r.startsWith("Bash(")).every((r) => perms.allow.includes("PowerShell(" + r.slice(5))) && perms.ask.filter((r) => r.startsWith("Bash(")).every((r) => perms.ask.includes("PowerShell(" + r.slice(5))));
ok("bypass mode disabled", perms.disableBypassPermissionsMode === "disable");

const mcp = JSON.parse(readFileSync(join(repo, ".mcp.json"), "utf8")).mcpServers.sre;
ok(".mcp.json starts sre with node", mcp.command === "node" && mcp.type === "stdio");
// Expand ${VAR:-default} the way Claude Code does, then start the server from an unrelated cwd.
const expand = (s) => s.replace(/\$\{([A-Z_]+)(?::-([^}]*))?\}/g, (_, v, d) => process.env[v] ?? (v === "CLAUDE_PROJECT_DIR" ? repo : d ?? ""));
const args = mcp.args.map(expand);
const elsewhere = mkdtempSync(join(tmpdir(), "sre-cwd-"));
const child = spawn(process.execPath, args, { cwd: elsewhere, env: { ...process.env, CLAUDE_PROJECT_DIR: repo, SRE_DATA_ROOT: "" }, stdio: ["pipe", "pipe", "pipe"] });
let buf = "";
const msgs = [];
child.stdout.on("data", (d) => { buf += d; let i; while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { msgs.push(JSON.parse(line)); } catch {} } });
const send = (o) => child.stdin.write(JSON.stringify(o) + "\n");
const waitFor = (id, ms = 15000) => new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { const m = msgs.find((x) => x.id === id); if (m) { clearInterval(iv); res(m); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error("timeout " + id)); } }, 50); });
try {
  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "config-test", version: "0" } } });
  await waitFor(1);
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  const tools = (await waitFor(2)).result.tools.map((t) => t.name).sort();
  ok("MCP lists 5 read-only tools", tools.join() === "get_deploys,get_logs,get_metrics,get_runbook,list_alerts", tools.join());
  send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "list_alerts", arguments: {} } });
  const alerts = JSON.stringify((await waitFor(3)).result);
  ok("MCP finds incidents from another cwd", ["inc-001", "inc-002", "inc-004"].every((i) => alerts.includes(i)));
} catch (e) { ok("MCP handshake", false, String(e)); }
child.kill();
console.log(`pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
