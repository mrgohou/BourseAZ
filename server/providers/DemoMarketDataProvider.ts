import { Company, Quote, FinancialPeriod, Dividend } from '../../src/types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import {
  DEMO_COMPANIES,
  DEMO_HISTORICAL_PRICES,
  DEMO_FINANCIAL_PERIODS,
  DEMO_DIVIDEND_HISTORY,
} from '../../src/data/demo-data';

export class DemoMarketDataProvider implements MarketDataProvider {
  public async getCompanies(): Promise<Company[]> {
    return DEMO_COMPANIES;
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    const sym = symbol.toUpperCase();
    const company = DEMO_COMPANIES.find(c => c.symbol === sym);
    if (!company) return null;

    const prices = DEMO_HISTORICAL_PRICES[sym] || [];
    const lastPrice = prices.length > 0 ? prices[prices.length - 1] : null;

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

  public async getHistoricalPrices(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPrice[]> {
    const sym = symbol.toUpperCase();
    const rawList = DEMO_HISTORICAL_PRICES[sym] || [];
    const company = DEMO_COMPANIES.find(c => c.symbol === sym);
    const source = company ? company.source : 'Données Officielles Marché BRVM';

    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    return rawList
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
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    const sym = symbol.toUpperCase();
    return DEMO_FINANCIAL_PERIODS[sym] || [];
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    const sym = symbol.toUpperCase();
    const rawList = DEMO_DIVIDEND_HISTORY[sym] || [];
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
}
