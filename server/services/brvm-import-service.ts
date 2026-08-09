import { Company, Quote, FinancialPeriod, Dividend } from '../../src/types';
import { HistoricalPrice } from '../providers/MarketDataProvider';

export interface ParsedImportData {
  companies: Partial<Company>[];
  quotes: Partial<Quote>[];
  prices: Partial<HistoricalPrice>[];
  financials: Partial<FinancialPeriod>[];
  dividends: Partial<Dividend>[];
  rawFilename?: string;
  importedAt: string;
}

export class BrvmImportService {
  private static importedStorage: ParsedImportData[] = [];

  public static parseCsv(content: string, filename?: string): ParsedImportData {
    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new Error('Le fichier CSV est vide.');
    }

    const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
    const rows = lines.slice(1);

    const result: ParsedImportData = {
      companies: [],
      quotes: [],
      prices: [],
      financials: [],
      dividends: [],
      rawFilename: filename || 'import_brvm.csv',
      importedAt: new Date().toISOString(),
    };

    const isQuoteFile = header.includes('cours') || header.includes('close') || header.includes('dernier');
    const isCompanyFile = header.includes('secteur') || header.includes('pays');
    const isFinancialFile = header.includes('bpa') || header.includes('eps') || header.includes('chiffre_affaires');
    const isDividendFile = header.includes('dividende') || header.includes('dividend');

    for (const rowLine of rows) {
      const cols = rowLine.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;

      const recordObj: Record<string, string> = {};
      header.forEach((h, idx) => {
        recordObj[h] = cols[idx] || '';
      });

      const symbol = (recordObj['symbol'] || recordObj['symbole'] || recordObj['action'] || recordObj['code'] || '').toUpperCase();
      if (!symbol) continue;

      if (isCompanyFile) {
        result.companies.push({
          symbol,
          name: recordObj['name'] || recordObj['nom'] || symbol,
          sector: recordObj['sector'] || recordObj['secteur'] || 'Inconnu',
          country: recordObj['country'] || recordObj['pays'] || 'UEMOA',
          market: recordObj['market'] || recordObj['marche'] || 'BRVM - Cote Officielle',
          description: recordObj['description'] || 'Données fournies par import officiel BRVM',
          currentPrice: parseFloat(recordObj['currentprice'] || recordObj['cours'] || '0') || 0,
          previousClose: parseFloat(recordObj['previousclose'] || recordObj['veille'] || '0') || 0,
          eps: recordObj['eps'] || recordObj['bpa'] ? parseFloat(recordObj['eps'] || recordObj['bpa']) : undefined,
          lastDividend: recordObj['dividend'] || recordObj['dividende'] ? parseFloat(recordObj['dividend'] || recordObj['dividende']) : undefined,
        });
      }

      if (isQuoteFile) {
        const price = parseFloat(recordObj['cours'] || recordObj['close'] || recordObj['dernier'] || recordObj['prix'] || '0');
        const prev = parseFloat(recordObj['veille'] || recordObj['previousclose'] || recordObj['ouverture'] || String(price));
        result.quotes.push({
          symbol,
          price,
          previousClose: prev,
          changePercent: prev > 0 ? parseFloat((((price - prev) / prev) * 100).toFixed(2)) : 0,
          high: parseFloat(recordObj['plus_haut'] || recordObj['high'] || String(price)) || price,
          low: parseFloat(recordObj['plus_bas'] || recordObj['low'] || String(price)) || price,
          open: parseFloat(recordObj['ouverture'] || recordObj['open'] || String(price)) || price,
          volume: parseInt(recordObj['volume'] || recordObj['titres_echanges'] || '0', 10) || 0,
          timestamp: recordObj['date'] ? new Date(recordObj['date']).toISOString() : new Date().toISOString(),
          source: filename ? `Import Fichier (${filename})` : 'Import Officiel BRVM',
          freshness: 'end_of_day',
        });
      }

      if (isFinancialFile) {
        result.financials.push({
          companySymbol: symbol,
          fiscalYear: parseInt(recordObj['annee'] || recordObj['fiscalyear'] || String(new Date().getFullYear()), 10),
          revenue: parseFloat(recordObj['chiffre_affaires'] || recordObj['revenue'] || '0') || 0,
          netIncome: parseFloat(recordObj['resultat_net'] || recordObj['netincome'] || '0') || 0,
          eps: parseFloat(recordObj['bpa'] || recordObj['eps'] || '0') || 0,
          dividend: parseFloat(recordObj['dividende'] || recordObj['dividend'] || '0') || 0,
          source: filename ? `Import Fichier (${filename})` : 'Import Officiel BRVM',
          verified: true,
        });
      }

      if (isDividendFile) {
        result.dividends.push({
          id: `div-imp-${symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          companySymbol: symbol,
          exDate: recordObj['date_detachement'] || recordObj['exdate'] || new Date().toISOString().split('T')[0],
          paymentDate: recordObj['date_paiement'] || recordObj['paymentdate'] || new Date().toISOString().split('T')[0],
          amount: parseFloat(recordObj['montant'] || recordObj['amount'] || recordObj['dividende'] || '0') || 0,
          source: filename ? `Import Fichier (${filename})` : 'Import Officiel BRVM',
          verified: true,
        });
      }
    }

    BrvmImportService.importedStorage.push(result);
    return result;
  }

  public static parseJson(content: string, filename?: string): ParsedImportData {
    let parsed: any;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      throw new Error('Format JSON invalide.');
    }

    const result: ParsedImportData = {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
      prices: Array.isArray(parsed.prices) ? parsed.prices : [],
      financials: Array.isArray(parsed.financials) ? parsed.financials : [],
      dividends: Array.isArray(parsed.dividends) ? parsed.dividends : [],
      rawFilename: filename || 'import_brvm.json',
      importedAt: new Date().toISOString(),
    };

    BrvmImportService.importedStorage.push(result);
    return result;
  }

  public static getStoredImportedData(): ParsedImportData[] {
    return [...BrvmImportService.importedStorage];
  }

  public static clearStoredImportedData(): void {
    BrvmImportService.importedStorage = [];
  }
}
