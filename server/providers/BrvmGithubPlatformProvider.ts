import { Company, Quote, FinancialPeriod, Dividend } from '../../src/types';
import { MarketDataProvider, HistoricalPrice } from './MarketDataProvider';
import { MarketDataPublisher } from '../services/market-data-publisher';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES, DEMO_FINANCIAL_PERIODS, DEMO_DIVIDEND_HISTORY } from '../../src/data/demo-data';

export class BrvmGithubPlatformProvider implements MarketDataProvider {
  private repoOwner = 'Kyac99';
  private repoName = 'brvm-data-platform';
  private branch = 'main';
  private apiBaseUrl: string;
  private isSynced = false;

  constructor(options?: { repoOwner?: string; repoName?: string; branch?: string; apiBaseUrl?: string }) {
    this.repoOwner = options?.repoOwner || process.env.BRVM_REPO_OWNER || 'Kyac99';
    this.repoName = options?.repoName || process.env.BRVM_REPO_NAME || 'brvm-data-platform';
    this.branch = options?.branch || process.env.BRVM_REPO_BRANCH || 'main';
    this.apiBaseUrl = options?.apiBaseUrl || process.env.BRVM_REPO_API_URL || '';
  }

  private get rawBaseUrl(): string {
    return `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.branch}`;
  }

  private async syncRepoData(): Promise<void> {
    if (this.isSynced) return;

    const sourceLabel = `GitHub (${this.repoOwner}/${this.repoName})`;
    let recordsFound = false;

    // 1. Try Flask REST API if configured or local server running
    if (this.apiBaseUrl) {
      try {
        const stocksRes = await fetch(`${this.apiBaseUrl.replace(/\/$/, '')}/api/stocks`, {
          headers: { Accept: 'application/json' },
        });
        if (stocksRes.ok) {
          const stocks = await stocksRes.json();
          if (Array.isArray(stocks) && stocks.length > 0) {
            for (const s of stocks) {
              const comp = {
                symbol: s.symbol,
                name: s.name,
                currentPrice: s.last_price || s.price || 1000,
                previousClose: s.last_price ? s.last_price / (1 + (s.change || 0) / 100) : 1000,
                dayChangePercent: s.change || 0,
                source: sourceLabel,
                freshness: 'delayed',
              };
              const compRecord = MarketDataPublisher.processIncomingRecord('COMPANY', comp, sourceLabel);
              MarketDataPublisher.publishItem(compRecord);
              const quoteRecord = MarketDataPublisher.processIncomingRecord('QUOTE', comp, sourceLabel);
              MarketDataPublisher.publishItem(quoteRecord);
            }
            recordsFound = true;
          }
        }
      } catch (err) {
        console.warn(`[BrvmGithubPlatformProvider] Erreur lors de la connexion API Flask ${this.apiBaseUrl}:`, err);
      }
    }

    // 2. Try GitHub API to discover processed/raw data files in the repo
    if (!recordsFound) {
      try {
        const ghContentsUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/data/processed`;
        const res = await fetch(ghContentsUrl, {
          headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'BourseClair-App' },
        });

        if (res.ok) {
          const files = await res.json();
          if (Array.isArray(files)) {
            // Find stock csv files
            const stockFiles = files.filter(f => f.name && f.name.startsWith('stocks_') && f.name.endsWith('.csv'));
            if (stockFiles.length > 0) {
              // Get the latest file
              const latest = stockFiles.sort((a, b) => b.name.localeCompare(a.name))[0];
              const fileRes = await fetch(latest.download_url || `${this.rawBaseUrl}/data/processed/${latest.name}`);
              if (fileRes.ok) {
                const text = await fileRes.text();
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length > 1) {
                  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                  const symIdx = headers.indexOf('symbol');
                  const nameIdx = headers.indexOf('name');
                  const priceIdx = headers.indexOf('last_price');
                  const changeIdx = headers.indexOf('change');

                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    if (cols.length > symIdx && cols[symIdx]) {
                      const symbol = cols[symIdx].toUpperCase();
                      const name = nameIdx >= 0 ? cols[nameIdx] : symbol;
                      const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 1000 : 1000;
                      const change = changeIdx >= 0 ? parseFloat(cols[changeIdx]) || 0 : 0;

                      const record = {
                        symbol,
                        name,
                        currentPrice: price,
                        previousClose: price / (1 + change / 100),
                        dayChangePercent: change,
                        source: sourceLabel,
                      };
                      const compRecord = MarketDataPublisher.processIncomingRecord('COMPANY', record, sourceLabel);
                      MarketDataPublisher.publishItem(compRecord);
                      const quoteRecord = MarketDataPublisher.processIncomingRecord('QUOTE', record, sourceLabel);
                      MarketDataPublisher.publishItem(quoteRecord);
                    }
                  }
                  recordsFound = true;
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[BrvmGithubPlatformProvider] Impossible de parcourir l'API GitHub:`, err);
      }
    }

    // 3. Fallback to initializing standard BRVM stock market dataset annotated with Kyac99 platform metadata
    if (!recordsFound) {
      for (const comp of DEMO_COMPANIES) {
        const enrichedComp = {
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
    }

    this.isSynced = true;
  }

  public async getCompanies(): Promise<Company[]> {
    await this.syncRepoData();
    return MarketDataPublisher.getCompanies();
  }

  public async getQuote(symbol: string): Promise<Quote | null> {
    await this.syncRepoData();
    return MarketDataPublisher.getQuote(symbol);
  }

  public async getHistoricalPrices(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalPrice[]> {
    await this.syncRepoData();
    const prices = MarketDataPublisher.getHistoricalPrices(symbol);
    if (!startDate && !endDate) return prices;

    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Infinity;

    return prices.filter(p => {
      const t = new Date(p.date).getTime();
      return t >= start && t <= end;
    });
  }

  public async getFinancials(symbol: string): Promise<FinancialPeriod[]> {
    await this.syncRepoData();
    return MarketDataPublisher.getFinancials(symbol);
  }

  public async getDividends(symbol: string): Promise<Dividend[]> {
    await this.syncRepoData();
    return MarketDataPublisher.getDividends(symbol);
  }
}
