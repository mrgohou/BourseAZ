import type { Company, Quote, FinancialPeriod, Dividend } from '../../types';

export type { Company, Quote, FinancialPeriod, Dividend };


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
    startDate?: string,
    endDate?: string
  ): Promise<HistoricalPrice[]>;
  getFinancials(symbol: string): Promise<FinancialPeriod[]>;
  getDividends(symbol: string): Promise<Dividend[]>;
}
