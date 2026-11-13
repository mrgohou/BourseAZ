// Use only after seeding a local namespace as described in VERIFICATION.md.
import assert from 'node:assert/strict';
const url = 'http://127.0.0.1:8787/v1/market';
const first = await fetch(url);
assert.equal(first.status, 200);
assert.equal((await first.json()).source, 'LOCAL TEST FIXTURE');
const start = performance.now();
const times = await Promise.all(Array.from({ length: 1000 }, async () => {
  const tick = performance.now();
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).source, 'LOCAL TEST FIXTURE');
  return performance.now() - tick;
}));
times.sort((a, b) => a - b);
console.log(JSON.stringify({ runtime: 'Cloudflare workerd local / KV and Cache API',
  concurrentRequests: 1000, failures: 0, elapsedMs: Math.round(performance.now() - start),
  p95Ms: Math.round(times[949]) }, null, 2));
