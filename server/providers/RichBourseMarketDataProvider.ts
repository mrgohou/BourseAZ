import { Company, Quote, FinancialPeriod, Dividend } from '../../src/types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import { MarketDataPublisher } from '../services/market-data-publisher';
import {
  DEMO_COMPANIES,
  DEMO_HISTORICAL_PRICES,
  DEMO_FINANCIAL_PERIODS,
  DEMO_DIVIDEND_HISTORY,
} from '../../src/data/demo-data';
import { richBourseScraper, RichBourseStockItem } from '../services/richbourse-scraper';

export class RichBourseMarketDataProvider implements MarketDataProvider {
  private isInitialized = false;

  constructor() {
    this.initBaselineData();
    // Warm up RichBourse scraper
    richBourseScraper.fetchVariations().catch((err) => {
      console.warn('[RichBourseProvider] Warmup fetch error:', err.message);
    });
  }

  private initBaselineData(): void {
    if (this.isInitialized || MarketDataPublisher.getCompanies().length > 0) {
      this.isInitialized = true;
      return;
    }

    const sourceLabel = 'RichBourse (Initialisation Cote BRVM)';
    for (const comp of DEMO_COMPANIES) {
      const enrichedComp: Company = {
        ...comp,
        source: sourceLabel,
        freshness: 'delayed',
      };
      const cRec = MarketDataPublisher.processIncomingRecord('COMPANY', enrichedComp, sourceLabel);
      MarketDataPublisher.publishItem(cRec);
      const qRec = MarketDataPublisher.processIncomingRecord('QUOTE', enrichedComp, sourceLabel);
      MarketDataPublisher.publishItem(qRec);

      const prices = DEMO_HISTORICAL_PRICES[comp.symbol] || [];
      for (const p of prices) {
        const pRec = MarketDataPublisher.processIncomingRecord(
          'PRICE',
          { ...p, symbol: comp.symbol, source: sourceLabel },
          sourceLabel
        );
        MarketDataPublisher.publishItem(pRec);
      }

      const financials = DEMO_FINANCIAL_PERIODS[comp.symbol] || [];
      for (const f of financials) {
        const fRec = MarketDataPublisher.processIncomingRecord('FINANCIAL', { ...f, source: sourceLabel }, sourceLabel);
        MarketDataPublisher.publishItem(fRec);
      }

      const dividends = DEMO_DIVIDEND_HISTORY[comp.symbol] || [];
      for (const d of dividends) {
        const dRec = MarketDataPublisher.processIncomingRecord('DIVIDEND', { ...d, source: sourceLabel }, sourceLabel);
        MarketDataPublisher.publishItem(dRec);
      }
    }

    this.isInitialized = true;
  }

  public async getCompanies(): Promise<Company[]> {
    this.initBaselineData();

    // Pull live variations from RichBourse
    const snapshot = await richBourseScraper.fetchVariations();
    const existingCompanies = MarketDataPublisher.getCompanies();
    const sourceLabel = 'RichBourse (https://www.richbourse.com/common/variation/index)';

    const updatedMap = new Map<string, Company>();

    // First populate from existing store
    for (const comp of existingCompanies) {
      updatedMap.set(comp.symbol.toUpperCase(), { ...comp });
    }

    // Update with RichBourse variation prices
    const matchedRichBourseStocks = new Set<string>();

    for (const [symbol, comp] of updatedMap.entries()) {
      const match = snapshot.stocks.find((s) => richBourseScraper.matchesSymbol(s, symbol));
      if (match) {
        matchedRichBourseStocks.add(match.symbol);
        comp.currentPrice = match.currentPrice;
        comp.previousClose = match.previousClose;
        comp.dayChangePercent = match.changePercent;
        comp.volume = match.volume;
        comp.valueTradedFcfa = match.valueFcfa;
        comp.valuePercent = match.valuePercent;
        comp.marketCap = match.marketCap;
        comp.source = sourceLabel;
        comp.freshness = 'delayed';
        comp.lastUpdated = snapshot.timestamp;

        // Recalculate dynamic ratios
        if (comp.eps && comp.eps > 0 && comp.currentPrice > 0) {
          comp.per = parseFloat((comp.currentPrice / comp.eps).toFixed(2));
        }
        if (comp.lastDividend && comp.lastDividend > 0 && comp.currentPrice > 0) {
          comp.dividendYield = parseFloat(((comp.lastDividend / comp.currentPrice) * 100).toFixed(2));
        }

        // Publish updated records
        const cRec = MarketDataPublisher.processIncomingRecord('COMPANY', comp, sourceLabel);
        MarketDataPublisher.publishItem(cRec);

        const quotePayload: Quote = {
          symbol: comp.symbol,
          price: comp.currentPrice,
          previousClose: comp.previousClose,
          changePercent: comp.dayChangePercent,
          high: Math.max(comp.currentPrice, comp.previousClose),
          low: Math.min(comp.currentPrice, comp.previousClose),
          open: comp.previousClose,
          volume: comp.volume,
          valueTradedFcfa: comp.valueTradedFcfa,
          valuePercent: comp.valuePercent,
          marketCap: comp.marketCap,
          timestamp: snapshot.timestamp,
          source: sourceLabel,
          freshness: 'delayed',
        };
        const qRec = MarketDataPublisher.processIncomingRecord('QUOTE', quotePayload, sourceLabel);
        MarketDataPublisher.publishItem(qRec);
      }
    }

    // Add any RichBourse securities not previously in the catalog (e.g. SAFC)
    for (const stock of snapshot.stocks) {
      if (!matchedRichBourseStocks.has(stock.symbol) && !updatedMap.has(stock.symbol)) {
        const newComp: Company = {
          id: `comp-${stock.symbol.toLowerCase()}`,
          symbol: stock.symbol,
          name: stock.name,
          sector: 'Services Financiers & Divers',
          country: 'UEMOA',
          market: 'BRVM - Cote Principale',
          description: `Société ${stock.name} (${stock.symbol}) cotée à la BRVM.`,
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose,
          dayChangePercent: stock.changePercent,
          volume: stock.volume,
          valueTradedFcfa: stock.valueFcfa,
          valuePercent: stock.valuePercent,
          marketCap: stock.marketCap,
          freshness: 'delayed',
          lastUpdated: snapshot.timestamp,
          source: sourceLabel,
          isDemo: false,
          lifecycle: 'MATURITE',
          status: 'PUBLISHED',
        };

        updatedMap.set(stock.symbol, newComp);
        const cRec = MarketDataPublisher.processIncomingRecord('COMPANY', newComp, sourceLabel);
        MarketDataPublisher.publishItem(cRec);
      }
    }

    return Array.from(updatedMap.values());
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    const sym = symbol.toUpperCase().trim();
    let quote = MarketDataPublisher.getQuote(sym);

    if (!quote) {
      const companies = await this.getCompanies();
      const comp = companies.find((c) => c.symbol === sym || c.id === `comp-${sym.toLowerCase()}`);
      if (comp) {
        quote = {
          symbol: comp.symbol,
          price: comp.currentPrice,
          previousClose: comp.previousClose,
          changePercent: comp.dayChangePercent,
          high: Math.max(comp.currentPrice, comp.previousClose),
          low: Math.min(comp.currentPrice, comp.previousClose),
          open: comp.previousClose,
          volume: comp.volume || 0,
          valueTradedFcfa: comp.valueTradedFcfa,
          valuePercent: comp.valuePercent,
          marketCap: comp.marketCap,
          timestamp: comp.lastUpdated,
          source: comp.source,
          freshness: comp.freshness,
        };
      }
    }

    return quote || null;
  }

  public async getHistoricalPrices(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPrice[]> {
    const sym = symbol.toUpperCase().trim();
    let prices = MarketDataPublisher.getHistoricalPrices(sym);

    if (prices.length === 0) {
      const rawList = DEMO_HISTORICAL_PRICES[sym] || [];
      prices = rawList.map((p) => ({
        symbol: sym,
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        source: 'RichBourse / BRVM',
      }));
    }

    return prices.filter((p) => {
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      return true;
    });
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    const sym = symbol.toUpperCase().trim();
    const stored = MarketDataPublisher.getFinancials(sym);
    if (stored.length > 0) return stored;
    return DEMO_FINANCIAL_PERIODS[sym] || [];
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    const sym = symbol.toUpperCase().trim();
    const stored = MarketDataPublisher.getDividends(sym);
    if (stored.length > 0) return stored;
    return DEMO_DIVIDEND_HISTORY[sym] || [];
  }
}
