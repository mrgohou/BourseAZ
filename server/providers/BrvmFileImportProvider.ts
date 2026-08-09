import { Company, Quote, FinancialPeriod, Dividend } from '../../src/types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import { BrvmImportService } from '../services/brvm-import-service';
import { MarketDataPublisher } from '../services/market-data-publisher';

export class BrvmFileImportProvider implements MarketDataProvider {
  private syncImportedData(): void {
    const imports = BrvmImportService.getStoredImportedData();
    for (const batch of imports) {
      const sourceName = `Import Fichier (${batch.rawFilename || 'bulletin.csv'})`;

      for (const comp of batch.companies) {
        MarketDataPublisher.processIncomingRecord('COMPANY', comp, sourceName);
      }
      for (const quote of batch.quotes) {
        MarketDataPublisher.processIncomingRecord('QUOTE', quote, sourceName);
      }
      for (const price of batch.prices) {
        MarketDataPublisher.processIncomingRecord('PRICE', price, sourceName);
      }
      for (const fin of batch.financials) {
        MarketDataPublisher.processIncomingRecord('FINANCIAL', fin, sourceName);
      }
      for (const div of batch.dividends) {
        MarketDataPublisher.processIncomingRecord('DIVIDEND', div, sourceName);
      }
    }
  }

  public async getCompanies(): Promise<Company[]> {
    this.syncImportedData();
    const companies = MarketDataPublisher.getCompanies();
    if (companies.length === 0) {
      throw new Error(
        'Aucun fichier de données BRVM n\'a encore été importé. Veuillez importer un fichier CSV/JSON officiel BRVM depuis la console d\'administration.'
      );
    }
    return companies;
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    this.syncImportedData();
    return MarketDataPublisher.getQuote(symbol);
  }

  public async getHistoricalPrices(
    symbol: string,
    _startDate: string,
    _endDate: string
  ): Promise<HistoricalPrice[]> {
    this.syncImportedData();
    return MarketDataPublisher.getHistoricalPrices(symbol);
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    this.syncImportedData();
    return MarketDataPublisher.getFinancials(symbol);
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    this.syncImportedData();
    return MarketDataPublisher.getDividends(symbol);
  }
}
