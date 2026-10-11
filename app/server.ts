// Tiny demo "checkout-api" (sample only). Not run in the lesson; it gives the agent real code to point a fix PR at.
import { createServer } from "node:http";
const POOL_MAX = Number(process.env.DB_POOL_MAX ?? 20);
let inUse = 0;
createServer(async (req, res) => {
  if (req.url === "/health") return void res.end("ok");
  if (inUse >= POOL_MAX) { res.statusCode = 503; return void res.end("timeout acquiring db connection from pool"); }
  inUse++; await new Promise((r) => setTimeout(r, 100)); inUse--;
  res.end(JSON.stringify({ ok: true }));
}).listen(Number(process.env.PORT ?? 3000));
