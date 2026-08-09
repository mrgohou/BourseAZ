export interface CacheOptions {
  /** Default Time To Live in milliseconds (e.g., 300000 = 5 minutes) */
  defaultTtlMs?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/** Standard TTL presets in milliseconds for BRVM market data types */
export const BRVM_CACHE_TTL = {
  /** Real-time or delayed stock quotes (1 minute) */
  QUOTE: 60 * 1000,
  /** List of listed companies and summary quotes (5 minutes) */
  COMPANIES: 5 * 60 * 1000,
  /** Historical daily stock prices (1 hour) */
  HISTORICAL_PRICES: 60 * 60 * 1000,
  /** Financial statements & fundamental ratios (12 hours) */
  FINANCIALS: 12 * 60 * 60 * 1000,
  /** Dividend announcements and history (12 hours) */
  DIVIDENDS: 12 * 60 * 60 * 1000,
};

export class MarketDataCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTtlMs: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs ?? BRVM_CACHE_TTL.COMPANIES;
  }

  /**
   * Retrieves a cached value if present and not expired.
   * Returns null if missing or expired.
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Stores a value in the cache with an optional custom TTL in milliseconds.
   */
  public set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const now = Date.now();
    this.store.set(key, {
      value,
      createdAt: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Checks whether a valid (non-expired) cache entry exists for the given key.
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidates a specific key from the cache.
   */
  public invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clears all entries from the cache.
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Higher-order utility: fetches and caches data if absent or expired.
   * Prevents multiple identical in-flight requests using a shared promise map.
   */
  private inFlightRequests = new Map<string, Promise<unknown>>();

  public async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests for the same key
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }

    const fetchPromise = (async () => {
      try {
        const freshData = await fetchFn();
        this.set(key, freshData, ttlMs);
        return freshData;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  /** Returns statistics about the cache state */
  public getStats() {
    let activeEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();

    for (const [, entry] of this.store) {
      if (now <= entry.expiresAt) {
        activeEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.store.size,
      activeEntries,
      expiredEntries,
    };
  }
}

/** Global singleton cache instance for application-wide BRVM data */
export const globalMarketDataCache = new MarketDataCache();
