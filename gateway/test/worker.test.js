import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, normalizeUpstream, synchronize, validateSnapshot } from '../src/worker.js';

export const snapshot = () => ({ version: 1, demo: false, source: 'Fixture BRVM',
  asOf: new Date().toISOString(), stocks: [{ symbol: 'SNTS', name: 'Sonatel', sector: 'Télécoms', price: 24000, change: 1 }] });
const request = (suffix = '', method = 'GET') => new Request(`https://market.example/v1/market${suffix}`, { method });
const context = { waitUntil: p => p.catch(() => {}) };
const env = data => ({ MARKET: { get: async () => data == null ? null : JSON.stringify(data) } });
const upstream = () => ({ success: true, source: 'Fixture', provider: 'brvm',
  session: { lastUpdated: new Date().toISOString() }, companies: [{
    symbol: 'SNTS', name: 'Sonatel', sector: 'Télécoms', currentPrice: 24000,
    dayChangePercent: 1, isDemo: false, freshness: 'END_OF_DAY', lastUpdated: new Date().toISOString(),
  }] });

test('public readers only access validated snapshots', async () => {
  const response = await handle(request(), env(snapshot()), context);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).demo, false);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.match(response.headers.get('cache-control'), /public/);
});
test('missing or expired data is unavailable, never replaced with fabricated live quotes', async () => {
  assert.equal((await handle(request(), env(null), context)).status, 503);
  const old = snapshot(); old.asOf = '2020-01-01';
  assert.equal((await handle(request(), env(old), context)).status, 503);
});
test('visitor cannot force synchronization, post or reach other APIs', async () => {
  let reads = 0;
  const e = { MARKET: { get: async () => { reads++; return null; } } };
  assert.equal((await handle(request('?force=true'), e, context)).status, 400);
  assert.equal((await handle(request('', 'POST'), e, context)).status, 405);
  assert.equal((await handle(new Request('https://market.example/api/admin'), e, context)).status, 404);
  assert.equal(reads, 0);
});
test('malformed, duplicated, synthetic, future and non-finite quotes are rejected', () => {
  for (const mutate of [d => d.stocks.push(d.stocks[0]), d => d.demo = true,
    d => d.stocks[0].price = -1, d => d.stocks[0].change = NaN,
    d => d.asOf = '2100-01-01', d => d.stocks[0].symbol = '<script>']) {
    const data = snapshot(); mutate(data);
    assert.throws(() => validateSnapshot(data));
  }
});
test('normalizer preserves oldest source date and rejects demo upstream', () => {
  const data = upstream();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  data.companies[0].lastUpdated = yesterday;
  assert.equal(normalizeUpstream(data).asOf, yesterday);
  data.companies[0].isDemo = true;
  assert.throws(() => normalizeUpstream(data));
});
test('legacy initialization quotes cannot pass as real merely by setting isDemo=false', () => {
  const data = upstream();
  data.companies[0].source = 'RichBourse (Initialisation Cote BRVM)';
  assert.throws(() => normalizeUpstream(data));
  const real = { ...data.companies[0], symbol: 'ORAC', source: 'RichBourse (https://www.richbourse.com/common/variation/index)' };
  data.companies.push(real);
  const normalized = normalizeUpstream(data);
  assert.equal(normalized.stocks.length, 1);
  assert.equal(normalized.stocks[0].symbol, 'ORAC');
  data.dataStatus = 'INITIAL_FALLBACK';
  assert.throws(() => normalizeUpstream(data));
});
test('scheduled sync saves only valid data and does not clear a good snapshot on error', async () => {
  let writes = 0;
  const e = { UPSTREAM_URL: 'https://api.example/api/market/daily-quotes',
    MARKET: { put: async () => { writes++; } } };
  await synchronize(e, async () => new Response(JSON.stringify(upstream()), { headers: { 'content-type': 'application/json' } }));
  assert.equal(writes, 1);
  await assert.rejects(synchronize(e, async () => new Response('bad', { status: 500 })));
  assert.equal(writes, 1);
  await assert.rejects(synchronize({ ...e, UPSTREAM_URL: 'http://api.example' }));
});
test('warm edge cache serves requests without KV or upstream reads', async () => {
  const cache = { match: async () => new Response(JSON.stringify(snapshot())) };
  const response = await handle(request(), { MARKET: { get: () => assert.fail('Unexpected KV read') } }, context, cache);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).stocks.length, 1);
});
test('HEAD and preflight have no response body', async () => {
  assert.equal(await (await handle(request('', 'HEAD'), env(snapshot()), context)).text(), '');
  assert.equal((await handle(request('', 'OPTIONS'), env(snapshot()), context)).status, 204);
});
