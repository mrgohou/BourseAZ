import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Company, Quote, MarketPricePoint } from '../../types';
import {
  liveMarketService,
  MarketSessionInfo,
  MarketSessionMetrics,
  DailyQuotesApiResponse,
} from '../../services/market-data/liveMarketService';

interface MarketContextType {
  companies: Company[];
  companyMap: Map<string, Company>;
  quotesMap: Map<string, Quote>;
  historicalPrices: Record<string, MarketPricePoint[]>;
  marketSession: MarketSessionInfo;
  marketMetrics: MarketSessionMetrics;
  topGainers: any[];
  topLosers: any[];
  isRefreshing: boolean;
  lastUpdated: Date | null;
  getCompany: (symbol: string) => Company | undefined;
  getQuote: (symbol: string) => Quote | null;
  refreshMarketData: (force?: boolean) => Promise<void>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => liveMarketService.getCachedCompanies());
  const [marketSession, setMarketSession] = useState<MarketSessionInfo>(() => liveMarketService.getCachedSession());
  const [marketMetrics, setMarketMetrics] = useState<MarketSessionMetrics>(() => liveMarketService.getCachedMetrics());
  const [topGainers, setTopGainers] = useState<any[]>(() => liveMarketService.getCachedTopGainers());
  const [topLosers, setTopLosers] = useState<any[]>(() => liveMarketService.getCachedTopLosers());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date());

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    for (const c of companies) {
      map.set(c.symbol.toUpperCase(), c);
    }
    return map;
  }, [companies]);

  const quotesMap = useMemo(() => {
    const map = new Map<string, Quote>();
    for (const c of companies) {
      map.set(c.symbol.toUpperCase(), {
        symbol: c.symbol,
        price: c.currentPrice,
        previousClose: c.previousClose,
        changePercent: c.dayChangePercent,
        high: Math.max(c.currentPrice, c.previousClose),
        low: Math.min(c.currentPrice, c.previousClose),
        open: c.previousClose,
        volume: c.volume || 0,
        valueTradedFcfa: c.valueTradedFcfa,
        valuePercent: c.valuePercent,
        marketCap: c.marketCap,
        timestamp: c.lastUpdated,
        source: c.source,
        freshness: c.freshness,
      });
    }
    return map;
  }, [companies]);

  const historicalPrices = useMemo(() => {
    return liveMarketService.getDynamicHistoricalPrices(companies);
  }, [companies]);

  const refreshMarketData = useCallback(async (force = false) => {
    setIsRefreshing(true);
    try {
      let data: DailyQuotesApiResponse;
      if (force) {
        data = await liveMarketService.forceRefresh();
      } else {
        data = await liveMarketService.fetchDailyQuotes(false);
      }
      setCompanies(data.companies);
      setMarketSession(data.session);
      setMarketMetrics(data.metrics);
      if (data.topGainers) setTopGainers(data.topGainers);
      if (data.topLosers) setTopLosers(data.topLosers);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[MarketContext] Échec du rafraîchissement des cours:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load & automatic daily/interval polling
  useEffect(() => {
    // Immediate initial sync
    refreshMarketData(false);

    // Periodic refresh: every 60 seconds during trading hours, every 5 minutes outside
    const intervalMs = marketSession.isMarketOpen ? 60000 : 300000;
    const interval = setInterval(() => {
      refreshMarketData(false);
    }, intervalMs);

    // Refresh when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshMarketData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMarketData, marketSession.isMarketOpen]);

  const getCompany = useCallback((symbol: string): Company | undefined => {
    if (!symbol) return undefined;
    return companyMap.get(symbol.toUpperCase());
  }, [companyMap]);

  const getQuote = useCallback((symbol: string): Quote | null => {
    if (!symbol) return null;
    return quotesMap.get(symbol.toUpperCase()) || null;
  }, [quotesMap]);

  const value = {
    companies,
    companyMap,
    quotesMap,
    historicalPrices,
    marketSession,
    marketMetrics,
    topGainers,
    topLosers,
    isRefreshing,
    lastUpdated,
    getCompany,
    getQuote,
    refreshMarketData,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export function useMarketData(): MarketContextType {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketProvider');
  }
  return context;
}
