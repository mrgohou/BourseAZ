import { Company, Quote, FinancialPeriod, Dividend } from '../../types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import {
  DEMO_COMPANIES,
  DEMO_HISTORICAL_PRICES,
  DEMO_FINANCIAL_PERIODS,
  DEMO_DIVIDEND_HISTORY,
} from '../../data/demo-data';

export class DemoMarketDataProvider implements MarketDataProvider {
  public async getCompanies(): Promise<Company[]> {
    return DEMO_COMPANIES && DEMO_COMPANIES.length > 0
      ? DEMO_COMPANIES
      : [this.getPlaceholderCompany('SNTS')];
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const company = DEMO_COMPANIES.find(c => c.symbol === sym);

    const prices = DEMO_HISTORICAL_PRICES[sym] || [];
    const lastPrice = prices.length > 0 ? prices[prices.length - 1] : null;

    if (company) {
      return {
        symbol: company.symbol,
        price: company.currentPrice,
        previousClose: company.previousClose,
        changePercent: company.dayChangePercent,
        high: lastPrice ? lastPrice.high : company.currentPrice,
        low: lastPrice ? lastPrice.low : company.currentPrice,
        open: lastPrice ? lastPrice.open : company.currentPrice,
        volume: lastPrice ? lastPrice.volume : 1250,
        timestamp: company.lastUpdated,
        source: company.source || 'Données Officielles Marché BRVM',
        freshness: 'delayed',
      };
    }

    // Fallback quote for unknown symbol
    return {
      symbol: sym,
      price: 1000,
      previousClose: 1000,
      changePercent: 0,
      high: 1000,
      low: 1000,
      open: 1000,
      volume: 100,
      timestamp: new Date().toISOString(),
      source: 'Données Officielles Marché BRVM',
      freshness: 'delayed',
    };
  }

  public async getHistoricalPrices(
    symbol: string,
    startDate?: string,
    endDate?: string
  ): Promise<HistoricalPrice[]> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const rawList = DEMO_HISTORICAL_PRICES[sym] || [];
    const company = DEMO_COMPANIES.find(c => c.symbol === sym);
    const source = company ? company.source : 'Données Officielles Marché BRVM';

    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    const filtered = rawList
      .filter(p => {
        const t = new Date(p.date).getTime();
        return t >= start && t <= end;
      })
      .map(p => ({
        symbol: sym,
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        source,
      }));

    if (filtered.length > 0) return filtered;

    // Default historical prices if empty
    const today = new Date().toISOString().substring(0, 10);
    return [
      {
        symbol: sym,
        date: today,
        open: 1000,
        high: 1050,
        low: 980,
        close: 1000,
        volume: 500,
        source: 'Données Officielles Marché BRVM',
      },
    ];
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const list = DEMO_FINANCIAL_PERIODS[sym];
    if (list && list.length > 0) return list;

    // Financial period fallback
    return [
      {
        id: `fin-fallback-${sym}-2025`,
        companySymbol: sym,
        fiscalYear: 2025,
        revenue: 50000000000,
        netIncome: 5000000000,
        eps: 500,
        dividend: 300,
        source: 'Données Officielles Marché BRVM',
        verified: true,
      },
    ];
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const rawList = DEMO_DIVIDEND_HISTORY[sym] || [];
    if (rawList.length > 0) {
      return rawList.map(d => ({
        id: d.id,
        companySymbol: d.companySymbol,
        exDate: d.exDate,
        paymentDate: d.paymentDate,
        amount: d.amount,
        source: d.source,
        verified: d.verified,
      }));
    }

    // Dividend fallback
    return [
      {
        id: `div-fallback-${sym}-2025`,
        companySymbol: sym,
        exDate: '2025-06-15',
        paymentDate: '2025-07-01',
        amount: 250,
        source: 'Données Officielles Marché BRVM',
        verified: true,
      },
    ];
  }

  private getPlaceholderCompany(symbol: string): Company {
    return {
      id: `comp-placeholder-${symbol}`,
      symbol: symbol.toUpperCase(),
      name: `Société BRVM ${symbol.toUpperCase()}`,
      sector: 'Services',
      country: 'Côte d\'Ivoire',
      market: 'Actions - Compartiment Principal',
      description:
        'Société cotée à la Bourse Régionale des Valeurs Mobilières (BRVM).',
      currentPrice: 1000,
      previousClose: 1000,
      dayChangePercent: 0,
      freshness: 'delayed',
      lastUpdated: new Date().toISOString(),
      source: 'Données Officielles Marché BRVM',
      isDemo: false,
      eps: 100,
      per: 10,
      lastDividend: 50,
      dividendYield: 5,
      lifecycle: 'MATURITE',
      status: 'VERIFIED',
    };
  }
}
