export const MAX_AGE = 7 * 86400000;
const text = (value, max = 160) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function validateSnapshot(data, now = Date.now()) {
  if (data?.version !== 1 || data.demo !== false || !text(data.source, 200) ||
      !Array.isArray(data.stocks) || data.stocks.length < 1 || data.stocks.length > 200) {
    throw new Error('Invalid market snapshot');
  }
  const date = Date.parse(data.asOf);
  if (!Number.isFinite(date) || date > now + 300000 || now - date > MAX_AGE) {
    throw new Error('Invalid market timestamp');
  }
  const symbols = new Set();
  for (const stock of data.stocks) {
    if (!/^[A-Z0-9]{2,12}$/.test(stock.symbol) || symbols.has(stock.symbol) ||
        !text(stock.name) || !text(stock.sector, 100) ||
        !Number.isFinite(stock.price) || stock.price <= 0 ||
        !Number.isFinite(stock.change)) throw new Error('Invalid quote');
    symbols.add(stock.symbol);
  }
  return data;
}

// Adapt the existing Express endpoint, without carrying its admin or user API.
export function normalizeUpstream(payload, now = Date.now()) {
  if (payload?.success !== true || !Array.isArray(payload.companies) ||
      !text(payload.source, 200) || /demo/i.test(payload.provider ?? '') || payload.dataStatus === 'INITIAL_FALLBACK') {
    throw new Error('Upstream feed is unavailable or synthetic');
  }
  const dates = [payload.session?.lastUpdated];
  // Legacy feeds sometimes label catalog seeds as isDemo=false. Provenance wins.
  const candidates = payload.companies.filter(c => c.isDemo !== true &&
    !/demo|initialisation|initialization|exemples pédagogiques/i.test(c.source ?? '') &&
    !/demo/i.test(c.freshness ?? ''));
  const stocks = candidates.map(c => {
    if (c.isDemo !== false || /demo/i.test(c.freshness ?? '') || !c.lastUpdated) {
      throw new Error('Synthetic or undated quote rejected');
    }
    dates.push(c.lastUpdated);
    return { symbol: c.symbol, name: c.name, sector: c.sector,
      price: c.currentPrice, change: c.dayChangePercent };
  });
  const times = dates.map(d => Date.parse(d));
  if (times.some(t => !Number.isFinite(t))) throw new Error('Undated source');
  return validateSnapshot({ version: 1, demo: false, source: payload.source,
    asOf: new Date(Math.min(...times)).toISOString(), stocks }, now);
}

