import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const connect = async () => {
  const c = new Client({ name: "test", version: "0" });
  await c.connect(new StdioClientTransport({ command: "npx", args: ["tsx", "mcp/server.ts"] }));
  return c;
};
const body = (r: any) => r.content[0].text as string;

test("exposes exactly the five read-only tools", async () => {
  const c = await connect();
  const names = (await c.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["get_deploys", "get_logs", "get_metrics", "get_runbook", "list_alerts"]);
  await c.close();
});

test("list_alerts + get_logs return the evidence needed for inc-001", async () => {
  const c = await connect();
  const alerts = JSON.parse(body(await c.callTool({ name: "list_alerts", arguments: {} })));
  assert.equal(alerts[0].incident, "inc-001-db-pool");
  const logs = JSON.parse(body(await c.callTool({ name: "get_logs", arguments: { incident: "inc-001-db-pool", level: "error", contains: "pool" } })));
  assert.ok(logs.total >= 5);
  assert.match(logs.lines[0].id, /^L\d{4}$/);
  const deploys = JSON.parse(body(await c.callTool({ name: "get_deploys", arguments: { incident: "inc-001-db-pool" } })));
  assert.ok(deploys.some((d: any) => d.changes.join(" ").includes("DB_POOL_MAX 20 -> 5")));
  await c.close();
});

test("path traversal is refused as a tool error, not a crash", async () => {
  const c = await connect();
  const r: any = await c.callTool({ name: "get_logs", arguments: { incident: "../../.claude" } });
  assert.equal(r.isError, true);
  assert.match(body(r), /outside data root|ENOENT/);
  const rb: any = await c.callTool({ name: "get_runbook", arguments: { name: "../package" } });
  assert.equal(rb.isError, true);
  await c.close();
});

test("list_alerts shows the three built incidents; inc-002 and inc-004 carry their key evidence", async () => {
  const c = await connect();
  const alerts = JSON.parse(body(await c.callTool({ name: "list_alerts", arguments: {} })));
  assert.deepEqual(alerts.map((a: any) => a.incident).sort(), ["inc-001-db-pool", "inc-002-bad-deploy", "inc-004-upstream-timeout"]);
  const te = JSON.parse(body(await c.callTool({ name: "get_logs", arguments: { incident: "inc-002-bad-deploy", level: "error", contains: "TypeError" } })));
  assert.ok(te.total > 0 && te.lines.every((l: any) => l.currency === "EUR"));
  const d4 = JSON.parse(body(await c.callTool({ name: "get_deploys", arguments: { incident: "inc-004-upstream-timeout" } })));
  assert.ok(d4.find((d: any) => d.deploy_id === "d-0160").changes.every((x: string) => x.startsWith("docs:")));
  const rb = body(await c.callTool({ name: "get_runbook", arguments: { name: "upstream-timeout" } }));
  assert.match(rb, /PSP_CIRCUIT_BREAKER/);
  const p95 = JSON.parse(body(await c.callTool({ name: "get_metrics", arguments: { incident: "inc-004-upstream-timeout", metric: "psp_latency_p95_ms", from: "2026-10-13T11:05:00Z" } })));
  assert.ok(p95.every((r: any) => r.value >= 4800));
  await c.close();
});
