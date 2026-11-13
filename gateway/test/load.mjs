// Local HTTP harness, not a claim about deployed Cloudflare or upstream capacity.
import http from 'node:http';
import assert from 'node:assert/strict';
import { handle } from '../src/worker.js';
const data = JSON.stringify({ version: 1, demo: false, source: 'Load test fixture',
  asOf: new Date().toISOString(), stocks: [{ symbol: 'SNTS', name: 'Sonatel', sector: 'Télécoms', price: 24000, change: 1 }] });
let reads = 0;
const cache = new Map();
const env = { MARKET: { get: async () => { reads++; return data; } } };
const pending = [];
const ctx = { waitUntil: p => pending.push(p) };
const edgeCache = { match: async req => cache.get(req.url)?.clone(),
  put: async (req, res) => { cache.set(req.url, res); } };
const server = http.createServer(async (req, res) => {
  try {
    const response = await handle(new Request(`http://localhost${req.url}`), env, ctx, edgeCache);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (_) { res.writeHead(500); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/v1/market`;
try {
  await fetch(url); await Promise.all(pending);
  const before = reads;
  const start = performance.now();
  const latencies = await Promise.all(Array.from({ length: 1000 }, async () => {
    const tick = performance.now();
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).stocks[0].symbol, 'SNTS');
    return performance.now() - tick;
  }));
  latencies.sort((a, b) => a - b);
  assert.equal(reads, before, 'Warm traffic must not hit KV or upstream');
  console.log(JSON.stringify({ environment: 'local Node HTTP harness / mock edge cache',
    concurrentRequests: 1000, failures: 0, elapsedMs: Math.round(performance.now() - start),
    p95Ms: Math.round(latencies[949]), kvReadsDuringBurst: reads - before, upstreamRequests: 0 }, null, 2));
} finally { server.closeAllConnections(); server.close(); }
