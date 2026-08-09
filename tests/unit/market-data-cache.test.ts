import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketDataCache, BRVM_CACHE_TTL } from '../../src/services/market-data/market-data-cache';

describe('MarketDataCache', () => {
  let cache: MarketDataCache;

  beforeEach(() => {
    cache = new MarketDataCache({ defaultTtlMs: 1000 });
  });

  it('stores and retrieves cached entries before expiration', () => {
    cache.set('company:SNTS', { symbol: 'SNTS', price: 16500 });
    const data = cache.get<{ symbol: string; price: number }>('company:SNTS');
    expect(data).toEqual({ symbol: 'SNTS', price: 16500 });
  });

  it('returns null and invalidates expired entries', async () => {
    cache.set('quote:SNTS', { price: 16500 }, 10); // 10ms TTL
    await new Promise(resolve => setTimeout(resolve, 20));

    const data = cache.get('quote:SNTS');
    expect(data).toBeNull();
    expect(cache.has('quote:SNTS')).toBe(false);
  });

  it('getOrFetch caches results and deduplicates concurrent fetch calls', async () => {
    const fetchFn = vi.fn().mockImplementation(async () => {
      return [{ symbol: 'SNTS' }, { symbol: 'SLBC' }];
    });

    // Fire two concurrent calls
    const [res1, res2] = await Promise.all([
      cache.getOrFetch('companies', fetchFn, BRVM_CACHE_TTL.COMPANIES),
      cache.getOrFetch('companies', fetchFn, BRVM_CACHE_TTL.COMPANIES),
    ]);

    expect(res1).toEqual(res2);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Subsequent call hits cache
    const res3 = await cache.getOrFetch('companies', fetchFn, BRVM_CACHE_TTL.COMPANIES);
    expect(res3).toEqual(res1);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('supports invalidating and clearing cache', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');

    cache.invalidate('k1');
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBe('v2');

    cache.clear();
    expect(cache.get('k2')).toBeNull();
  });
});
