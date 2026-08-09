import { Company, Quote, FinancialPeriod, Dividend } from '../../src/types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import { BrvmClient } from '../services/brvm-client';
import { MarketDataPublisher } from '../services/market-data-publisher';

export class BrvmApiMarketDataProvider implements MarketDataProvider {
  private client: BrvmClient;

  constructor(client?: BrvmClient) {
    this.client = client || new BrvmClient();
  }

  private ensureConfigured(): void {
    if (!this.client.isConfigured()) {
      throw new Error(
        'Erreur de configuration BRVM API: BRVM_API_BASE_URL n\'est pas renseigné dans l\'environnement.'
      );
    }
  }

  public async getCompanies(): Promise<Company[]> {
    this.ensureConfigured();
    const rawList = await this.client.fetchWithRetry<any[]>('companies');

    for (const raw of rawList) {
      MarketDataPublisher.processIncomingRecord('COMPANY', raw, 'API BRVM Officielle');
    }

    return MarketDataPublisher.getCompanies();
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const raw = await this.client.fetchWithRetry<any>(`companies/${sym}/quote`);
      if (!raw) return null;

      MarketDataPublisher.processIncomingRecord('QUOTE', raw, 'API BRVM Officielle');
      return MarketDataPublisher.getQuote(sym);
    } catch {
      return MarketDataPublisher.getQuote(sym);
    }
  }

  public async getHistoricalPrices(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPrice[]> {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const query = `startDate=${encodeURIComponent(startDate || '')}&endDate=${encodeURIComponent(endDate || '')}`;
      const rawList = await this.client.fetchWithRetry<any[]>(`companies/${sym}/prices?${query}`);

      for (const raw of rawList) {
        MarketDataPublisher.processIncomingRecord('PRICE', { ...raw, symbol: sym }, 'API BRVM Officielle');
      }

      return MarketDataPublisher.getHistoricalPrices(sym);
    } catch {
      return MarketDataPublisher.getHistoricalPrices(sym);
    }
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const rawList = await this.client.fetchWithRetry<any[]>(`companies/${sym}/financials`);
      for (const raw of rawList) {
        MarketDataPublisher.processIncomingRecord('FINANCIAL', { ...raw, companySymbol: sym }, 'API BRVM Officielle');
      }
      return MarketDataPublisher.getFinancials(sym);
    } catch {
      return MarketDataPublisher.getFinancials(sym);
    }
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    this.ensureConfigured();
    const sym = symbol.toUpperCase();
    try {
      const rawList = await this.client.fetchWithRetry<any[]>(`companies/${sym}/dividends`);
      for (const raw of rawList) {
        MarketDataPublisher.processIncomingRecord('DIVIDEND', { ...raw, companySymbol: sym }, 'API BRVM Officielle');
      }
      return MarketDataPublisher.getDividends(sym);
    } catch {
      return MarketDataPublisher.getDividends(sym);
    }
  }
}
