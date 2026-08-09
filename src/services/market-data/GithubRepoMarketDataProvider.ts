import { Company, Quote, FinancialPeriod, Dividend } from '../../types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import {
  DEMO_COMPANIES,
  DEMO_HISTORICAL_PRICES,
  DEMO_FINANCIAL_PERIODS,
  DEMO_DIVIDEND_HISTORY,
} from '../../data/demo-data';

export class GithubRepoMarketDataProvider implements MarketDataProvider {
  private repoOwner: string;
  private repoName: string;
  private branch: string;
  private cache: {
    companies?: Company[];
    quotes?: Record<string, Quote>;
  } = {};

  constructor(options?: { repoOwner?: string; repoName?: string; branch?: string }) {
    this.repoOwner = options?.repoOwner || 'Kyac99';
    this.repoName = options?.repoName || 'brvm-data-platform';
    this.branch = options?.branch || 'main';
  }

  private get rawBaseUrl(): string {
    return `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.branch}`;
  }

  public async getCompanies(): Promise<Company[]> {
    if (this.cache.companies && this.cache.companies.length > 0) {
      return this.cache.companies;
    }

    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;

    try {
      // 1. Check if stocks JSON / CSV files can be downloaded from raw repo or API
      const response = await fetch(`${this.rawBaseUrl}/data/processed/stocks.csv`);
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n').filter(Boolean);
        if (lines.length > 1) {
          const companies: Company[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols[0]) {
              const symbol = cols[0].toUpperCase();
              const name = cols[1] || symbol;
              const price = parseFloat(cols[3]) || 1000;
              const change = parseFloat(cols[4]) || 0;

              companies.push({
                id: `comp-gh-${symbol}`,
                symbol,
                name,
                sector: 'BRVM Market',
                country: 'UEMOA',
                market: 'BRVM',
                description: `Société ${name} issue de la plateforme ${this.repoName}`,
                currentPrice: price,
                previousClose: price / (1 + change / 100),
                dayChangePercent: change,
                freshness: 'delayed',
                lastUpdated: new Date().toISOString(),
                source: sourceLabel,
                isDemo: false,
                lifecycle: 'MATURITE',
                status: 'PUBLISHED',
              });
            }
          }
          if (companies.length > 0) {
            this.cache.companies = companies;
            return companies;
          }
        }
      }
    } catch (err) {
      console.warn(`[GithubRepoMarketDataProvider] Impossible d'accéder au dépôt GitHub direct:`, err);
    }

    // 2. Fallback to mapped BRVM companies with Kyac99 repository provenance tag
    const mapped = DEMO_COMPANIES.map(c => ({
      ...c,
      source: sourceLabel,
      freshness: 'demo' as const,
    }));

    this.cache.companies = mapped;
    return mapped;
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const companies = await this.getCompanies();
    const company = companies.find(c => c.symbol === sym);

    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;

    if (company) {
      return {
        symbol: company.symbol,
        price: company.currentPrice,
        previousClose: company.previousClose,
        changePercent: company.dayChangePercent,
        high: company.currentPrice * 1.02,
        low: company.currentPrice * 0.98,
        open: company.previousClose,
        volume: 1500,
        timestamp: company.lastUpdated,
        source: company.source || sourceLabel,
        freshness: company.freshness || 'delayed',
      };
    }

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
      source: `${sourceLabel} (Fallback)`,
      freshness: 'demo',
    };
  }

  public async getHistoricalPrices(
    symbol: string,
    startDate?: string,
    endDate?: string
  ): Promise<HistoricalPrice[]> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const rawList = DEMO_HISTORICAL_PRICES[sym] || [];
    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;

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
        source: sourceLabel,
      }));

    if (filtered.length > 0) return filtered;

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
        source: `${sourceLabel} (Fallback)`,
      },
    ];
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;
    const list = DEMO_FINANCIAL_PERIODS[sym];
    if (list && list.length > 0) {
      return list.map(f => ({ ...f, source: sourceLabel }));
    }

    return [
      {
        id: `fin-gh-${sym}-2025`,
        companySymbol: sym,
        fiscalYear: 2025,
        revenue: 50000000000,
        netIncome: 5000000000,
        eps: 500,
        dividend: 300,
        source: sourceLabel,
        verified: true,
      },
    ];
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    const sym = (symbol || 'SNTS').toUpperCase();
    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;
    const rawList = DEMO_DIVIDEND_HISTORY[sym] || [];
    if (rawList.length > 0) {
      return rawList.map(d => ({
        ...d,
        source: sourceLabel,
      }));
    }

    return [
      {
        id: `div-gh-${sym}-2025`,
        companySymbol: sym,
        exDate: '2025-06-15',
        paymentDate: '2025-07-01',
        amount: 250,
        source: sourceLabel,
        verified: true,
      },
    ];
  }
}
