import { Company, Quote, MarketPricePoint } from '../../types';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES } from '../../data/demo-data';

export interface MarketSessionInfo {
  status: 'SESSION_ACTIVE' | 'SESSION_CLOSED' | 'WEEKEND' | 'PRE_OPENING';
  statusLabel: string;
  isMarketOpen: boolean;
  sessionDate: string; // YYYY-MM-DD
  sessionDateFormatted: string; // e.g. "9 novembre 2026"
  serverTimeUtc: string;
  lastUpdated: string;
}

export interface MarketSessionMetrics {
  totalSessionValueFcfa: number;
  totalSessionVolume: number;
  totalMarketCapFcfa: number;
  advancesCount: number;
  declinesCount: number;
  unchangedCount: number;
  totalSecurities: number;
}

export interface DailyQuotesApiResponse {
  success: boolean;
  session: MarketSessionInfo;
  metrics: MarketSessionMetrics;
  topGainers: any[];
  topLosers: any[];
  mostActiveByValue: any[];
  mostActiveByVolume: any[];
  companies: Company[];
  source: string;
  provider: string;
}

const STORAGE_KEY = 'bourse_facile_daily_quotes_v2';
const STORAGE_TS_KEY = 'bourse_facile_daily_quotes_ts';

export class LiveMarketService {
  private static instance: LiveMarketService;
  private cachedCompanies: Company[] = DEMO_COMPANIES;
  private cachedSession: MarketSessionInfo = {
    status: 'SESSION_CLOSED',
    statusLabel: 'Séance clôturée (Cours officiels)',
    isMarketOpen: false,
    sessionDate: new Date().toISOString().split('T')[0],
    sessionDateFormatted: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
    serverTimeUtc: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
  private cachedMetrics: MarketSessionMetrics = {
    totalSessionValueFcfa: 1475541626,
    totalSessionVolume: 944193,
    totalMarketCapFcfa: 15280000000000,
    advancesCount: 15,
    declinesCount: 18,
    unchangedCount: 7,
    totalSecurities: 49,
  };
  private cachedTopGainers: any[] = [];
  private cachedTopLosers: any[] = [];

  private constructor() {
    this.restoreFromStorage();
  }

  public static getInstance(): LiveMarketService {
    if (!LiveMarketService.instance) {
      LiveMarketService.instance = new LiveMarketService();
    }
    return LiveMarketService.instance;
  }

  private restoreFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.companies && parsed.companies.length > 0) {
          this.cachedCompanies = parsed.companies;
        }
        if (parsed.session) {
          this.cachedSession = parsed.session;
        }
        if (parsed.metrics) {
          this.cachedMetrics = parsed.metrics;
        }
        if (parsed.topGainers) this.cachedTopGainers = parsed.topGainers;
        if (parsed.topLosers) this.cachedTopLosers = parsed.topLosers;
      }
    } catch (e) {
      console.warn('[LiveMarketService] Erreur lecture cache local:', e);
    }
  }

  private saveToStorage(payload: DailyQuotesApiResponse) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        session: payload.session,
        metrics: payload.metrics,
        companies: payload.companies,
        topGainers: payload.topGainers,
        topLosers: payload.topLosers,
      }));
      localStorage.setItem(STORAGE_TS_KEY, Date.now().toString());
    } catch (e) {
      console.warn('[LiveMarketService] Erreur sauvegarde cache local:', e);
    }
  }

  public getCachedCompanies(): Company[] {
    return this.cachedCompanies;
  }

  public getCachedSession(): MarketSessionInfo {
    return this.cachedSession;
  }

  public getCachedMetrics(): MarketSessionMetrics {
    return this.cachedMetrics;
  }

  public getCachedTopGainers(): any[] {
    return this.cachedTopGainers;
  }

  public getCachedTopLosers(): any[] {
    return this.cachedTopLosers;
  }

  /**
   * Fetches the complete daily quote package from the server
   */
  public async fetchDailyQuotes(force = false): Promise<DailyQuotesApiResponse> {
    const url = force ? '/api/market/daily-quotes?force=true' : '/api/market/daily-quotes';
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data: DailyQuotesApiResponse = await res.json();
    if (!data.success) {
      throw new Error('Échec de la réponse API des cours quotidiens.');
    }

    this.cachedCompanies = data.companies;
    this.cachedSession = data.session;
    this.cachedMetrics = data.metrics;
    this.cachedTopGainers = data.topGainers || [];
    this.cachedTopLosers = data.topLosers || [];

    this.saveToStorage(data);
    return data;
  }

  /**
   * Triggers an explicit live refresh on the server, bypassing all caches
   */
  public async forceRefresh(): Promise<DailyQuotesApiResponse> {
    const refreshRes = await fetch('/api/market/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!refreshRes.ok) {
      throw new Error(`HTTP ${refreshRes.status}: ${refreshRes.statusText}`);
    }

    return this.fetchDailyQuotes(true);
  }

  /**
   * Generates or adjusts historical prices dynamically so the last point reflects today's live price
   */
  public getDynamicHistoricalPrices(companies: Company[]): Record<string, MarketPricePoint[]> {
    const result: Record<string, MarketPricePoint[]> = {};
    const todayIso = new Date().toISOString().split('T')[0];

    for (const comp of companies) {
      const base = DEMO_HISTORICAL_PRICES[comp.symbol] || DEMO_HISTORICAL_PRICES.SNTS || [];
      if (base.length === 0) continue;

      const copy = base.map(p => ({ ...p }));
      const lastPoint = copy[copy.length - 1];

      // If today's date matches or is newer, attach or adjust the last price point
      if (lastPoint) {
        if (lastPoint.date === todayIso) {
          lastPoint.close = comp.currentPrice;
          lastPoint.high = Math.max(lastPoint.high, comp.currentPrice);
          lastPoint.low = Math.min(lastPoint.low, comp.currentPrice);
        } else {
          // Append today's live point
          copy.push({
            date: todayIso,
            open: comp.previousClose || comp.currentPrice,
            high: Math.max(comp.currentPrice, comp.previousClose || comp.currentPrice),
            low: Math.min(comp.currentPrice, comp.previousClose || comp.currentPrice),
            close: comp.currentPrice,
            volume: comp.volume || 1000,
          });
        }
      }

      result[comp.symbol] = copy;
    }

    return result;
  }
}

export const liveMarketService = LiveMarketService.getInstance();
