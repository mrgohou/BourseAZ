import { MAX_AGE, normalizeUpstream, validateSnapshot } from './market-snapshot.js';
// Public read-only market API. A visitor can NEVER trigger an upstream refresh.
// No private profiles, credentials, trading or AI calls cross this gateway.
const KEY = 'snapshot:v1';
const MAX_SIZE = 256000;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*', // Only public market data; no credentials.
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: { ...headers, 'Cache-Control': 'no-store', ...extra },
});
export { normalizeUpstream, validateSnapshot } from './market-snapshot.js';

async function readBounded(response) {
  if (!response.ok || !(response.headers.get('content-type') ?? '').includes('application/json')) {
    throw new Error('Upstream HTTP error');
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SIZE) throw new Error('Upstream response too large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function synchronize(env, fetcher = fetch) {
  const url = new URL(env.UPSTREAM_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Configure a fixed HTTPS upstream');
  }
  // Fixed server configuration only. Timeout aborts the body as well as headers.
  const response = await fetcher(url.toString(), {
    redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Accept: 'application/json' },
  });
  const snapshot = normalizeUpstream(await readBounded(response));
  await env.MARKET.put(KEY, JSON.stringify(snapshot));
  return snapshot;
}

export async function handle(request, env, ctx, cache = globalThis.caches?.default) {
  const url = new URL(request.url);
  if (url.pathname !== '/v1/market') return json({ error: 'NOT_FOUND' }, 404);
  if (url.search) return json({ error: 'QUERY_NOT_SUPPORTED' }, 400);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'METHOD_NOT_ALLOWED' }, 405, { Allow: 'GET, HEAD, OPTIONS' });
  // Cache key independent of user-controlled headers. No user state or auth.
  const key = new Request(`${url.origin}/v1/market`);
  const hit = await cache?.match(key);
  if (hit) return request.method === 'HEAD' ? new Response(null, { headers: hit.headers }) : hit;
  try {
    const raw = await env.MARKET.get(KEY);
    if (!raw) return json({ error: 'MARKET_NOT_READY' }, 503, { 'Retry-After': '300' });
    if (raw.length > MAX_SIZE) throw new Error('Invalid stored snapshot');
    const data = validateSnapshot(JSON.parse(raw));
    const ageSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(data.asOf)) / 1000));
    const response = json(data, 200, {
      'Cache-Control': `public, max-age=${Math.min(60, Math.max(0, MAX_AGE / 1000 - ageSeconds))}`,
      'X-Data-Age-Seconds': String(ageSeconds),
    });
    if (cache) ctx.waitUntil(cache.put(key, response.clone()));
    return request.method === 'HEAD' ? new Response(null, { headers: response.headers }) : response;
  } catch (_) {
    return json({ error: 'MARKET_UNAVAILABLE' }, 503, { 'Retry-After': '300' });
  }
}

export default {
  fetch: handle,
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(synchronize(env).catch(() => {
      // Preserve the last valid snapshot on upstream failure. No fake freshness.
      console.error('MARKET_SYNC_FAILED');
    }));
  },
};
