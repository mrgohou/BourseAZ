import { Company, Quote, MarketPricePoint, FinancialPeriod, Dividend } from '../../src/types';

export interface HistoricalPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
}

export interface MarketDataProvider {
  getCompanies(): Promise<Company[]>;
  getQuote(symbol: string): Promise<Quote | null>;
  getHistoricalPrices(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPrice[]>;
  getFinancials(symbol: string): Promise<FinancialPeriod[]>;
  getDividends(symbol: string): Promise<Dividend[]>;
}
