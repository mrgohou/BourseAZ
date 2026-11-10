import https from 'https';

export interface RichBourseStockItem {
  symbol: string;
  mappedSymbols: string[];
  name: string;
  changePercent: number;
  currentPrice: number;
  previousClose: number;
  volume: number;
  valueFcfa: number;
  valuePercent: number;
  marketCap: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface RichBourseMarketSnapshot {
  timestamp: string;
  sourceUrl: string;
  sourceLabel: string;
  status: 'LIVE_FETCH' | 'CACHED_FALLBACK' | 'INITIAL_FALLBACK';
  fetchDurationMs: number;
  totalSecurities: number;
  totalSessionValueFcfa: number;
  totalSessionVolume: number;
  totalMarketCapFcfa: number;
  advancesCount: number;
  declinesCount: number;
  unchangedCount: number;
  topGainers: RichBourseStockItem[];
  topLosers: RichBourseStockItem[];
  mostActiveByValue: RichBourseStockItem[];
  mostActiveByVolume: RichBourseStockItem[];
  stocks: RichBourseStockItem[];
}

/**
 * Symbol mapping for BRVM tickers that may differ slightly between RichBourse and official listings
 */
const SYMBOL_ALIAS_MAP: Record<string, string[]> = {
  CBIBF: ['CBBF', 'CBIBF'],
  CBBF: ['CBIBF', 'CBBF'],
  BICB: ['BIIC', 'BICB'],
  BIIC: ['BICB', 'BIIC'],
  BOABF: ['BOAB', 'BOABF'],
  BOAB: ['BOABF', 'BOAB'],
  TTLC: ['TTLCI', 'TTLC', 'TTLS'],
  TTLCI: ['TTLC', 'TTLCI', 'TTLS'],
  ORAC: ['ORGT', 'ORAC', 'ORA'],
  ORGT: ['ORAC', 'ORGT'],
  PRSC: ['TTRC', 'PRSC'],
  TTRC: ['PRSC', 'TTRC'],
  SAFC: ['SAFCA', 'SAFC'],
  SAFCA: ['SAFC', 'SAFCA'],
  SOGC: ['SOGB', 'SOGC'],
  SOGB: ['SOGC', 'SOGB'],
  SIVC: ['SIVC', 'ERIUM', 'AIR LIQUIDE'],
  SDSC: ['SDSC', 'BOLLORE', 'AGL'],
  NTLC: ['NTLC', 'NESTLE'],
};

function parseFrenchNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

export class RichBourseScraperService {
  private static instance: RichBourseScraperService;
  private readonly targetUrl = 'https://www.richbourse.com/common/variation/index';
  private lastSnapshot: RichBourseMarketSnapshot | null = null;
  private isFetching = false;

  private constructor() {}

  public static getInstance(): RichBourseScraperService {
    if (!RichBourseScraperService.instance) {
      RichBourseScraperService.instance = new RichBourseScraperService();
    }
    return RichBourseScraperService.instance;
  }

  /**
   * Fetches and parses the live variation table from https://www.richbourse.com/common/variation/index
   */
  public async fetchVariations(force = false): Promise<RichBourseMarketSnapshot> {
    const now = Date.now();

    // Return in-memory cached snapshot if fresher than 2 minutes and not forced
    if (
      !force &&
      this.lastSnapshot &&
      now - new Date(this.lastSnapshot.timestamp).getTime() < 2 * 60 * 1000
    ) {
      return this.lastSnapshot;
    }

    if (this.isFetching && this.lastSnapshot) {
      return this.lastSnapshot;
    }

    this.isFetching = true;
    const startTime = Date.now();

    try {
      const html = await this.downloadPageHtml();
      const parsedStocks = this.parseVariationTable(html);

      if (parsedStocks.length === 0) {
        throw new Error('Aucune ligne de cotation extraite de la table RichBourse.');
      }

      // Aggregate macro market data
      const totalSessionValueFcfa = parsedStocks.reduce((sum, s) => sum + s.valueFcfa, 0);
      const totalSessionVolume = parsedStocks.reduce((sum, s) => sum + s.volume, 0);
      const totalMarketCapFcfa = parsedStocks.reduce((sum, s) => sum + s.marketCap, 0);

      const advances = parsedStocks.filter((s) => s.changePercent > 0.001);
      const declines = parsedStocks.filter((s) => s.changePercent < -0.001);
      const unchanged = parsedStocks.filter(
        (s) => Math.abs(s.changePercent) <= 0.001
      );

      const topGainers = [...advances]
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

      const topLosers = [...declines]
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5);

      const mostActiveByValue = [...parsedStocks]
        .sort((a, b) => b.valueFcfa - a.valueFcfa)
        .slice(0, 6);

      const mostActiveByVolume = [...parsedStocks]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 6);

      const durationMs = Date.now() - startTime;

      const snapshot: RichBourseMarketSnapshot = {
        timestamp: new Date().toISOString(),
        sourceUrl: this.targetUrl,
        sourceLabel: 'RichBourse (Palmarès des actions - Variations des cours)',
        status: 'LIVE_FETCH',
        fetchDurationMs: durationMs,
        totalSecurities: parsedStocks.length,
        totalSessionValueFcfa,
        totalSessionVolume,
        totalMarketCapFcfa,
        advancesCount: advances.length,
        declinesCount: declines.length,
        unchangedCount: unchanged.length,
        topGainers,
        topLosers,
        mostActiveByValue,
        mostActiveByVolume,
        stocks: parsedStocks,
      };

      this.lastSnapshot = snapshot;
      console.log(
        `[RichBourseScraper] ✅ Données synchronisées depuis ${this.targetUrl} : ${parsedStocks.length} actions, ` +
        `Volume total: ${totalSessionVolume.toLocaleString('fr-FR')} titres, ` +
        `Capitaux: ${totalSessionValueFcfa.toLocaleString('fr-FR')} FCFA (${durationMs}ms)`
      );

      return snapshot;
    } catch (err: any) {
      console.warn(`[RichBourseScraper] ⚠️ Impossible de rafraîchir en direct (${err.message}). Utilisation du cache.`);
      if (this.lastSnapshot) {
        return {
          ...this.lastSnapshot,
          status: 'CACHED_FALLBACK',
          fetchDurationMs: Date.now() - startTime,
        };
      }

      // If no snapshot exists yet, construct initial fallback with standard BRVM quotes
      return this.generateInitialFallback();
    } finally {
      this.isFetching = false;
    }
  }

  public getLastSnapshot(): RichBourseMarketSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * HTTP downloader with macOS Safari headers to bypass Cloudflare/CDN rate limiting
   */
  private downloadPageHtml(): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        timeout: 12000,
      };

      const req = https.get(this.targetUrl, options, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(
            new Error(`Erreur HTTP RichBourse ${res.statusCode}: ${res.statusMessage}`)
          );
        }

        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve(body);
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Délai d\'attente dépassé lors de la requête RichBourse (12s).'));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Parses the HTML table extracted from /common/variation/index
   */
  private parseVariationTable(html: string): RichBourseStockItem[] {
    const trRegex = /<tr data-key="(\d+)">([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    const stocks: RichBourseStockItem[] = [];

    while ((rowMatch = trRegex.exec(html)) !== null) {
      const rowHtml = rowMatch[2];
      const tds: string[] = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch: RegExpExecArray | null;

      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      if (tds.length >= 10) {
        const symbol = tds[1].toUpperCase();
        const name = tds[2];
        const changePercent = parseFrenchNumber(tds[3].replace('%', ''));
        const currentPrice = parseFrenchNumber(tds[4]);
        const previousClose = parseFrenchNumber(tds[5]);
        const volume = parseFrenchNumber(tds[6]);
        const valueFcfa = parseFrenchNumber(tds[7]);
        const valuePercent = parseFrenchNumber(tds[8].replace('%', ''));
        const marketCap = parseFrenchNumber(tds[9]);

        let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        if (changePercent > 0.001) trend = 'UP';
        else if (changePercent < -0.001) trend = 'DOWN';

        const mappedSymbols = SYMBOL_ALIAS_MAP[symbol] || [symbol];

        stocks.push({
          symbol,
          mappedSymbols,
          name,
          changePercent,
          currentPrice,
          previousClose,
          volume,
          valueFcfa,
          valuePercent,
          marketCap,
          trend,
        });
      }
    }

    return stocks;
  }

  /**
   * Helper to check if a symbol matches a given RichBourse item
   */
  public matchesSymbol(stock: RichBourseStockItem, querySymbol: string): boolean {
    const q = querySymbol.toUpperCase().trim();
    if (stock.symbol === q) return true;
    if (stock.mappedSymbols.includes(q)) return true;
    const aliases = SYMBOL_ALIAS_MAP[q] || [];
    return aliases.includes(stock.symbol);
  }

  /**
   * Built-in fallback in case network is disconnected on the first startup attempt
   */
  private generateInitialFallback(): RichBourseMarketSnapshot {
    return {
      timestamp: new Date().toISOString(),
      sourceUrl: this.targetUrl,
      sourceLabel: 'RichBourse (Sauvegarde locale - En attente du prochain cycle 5min)',
      status: 'INITIAL_FALLBACK',
      fetchDurationMs: 0,
      totalSecurities: 40,
      totalSessionValueFcfa: 2307014025,
      totalSessionVolume: 1064835,
      totalMarketCapFcfa: 12500000000000,
      advancesCount: 15,
      declinesCount: 18,
      unchangedCount: 7,
      topGainers: [
        {
          symbol: 'CBIBF',
          mappedSymbols: ['CBBF', 'CBIBF'],
          name: 'CORIS BANK',
          changePercent: 6.19,
          currentPrice: 32500,
          previousClose: 30605,
          volume: 2191,
          valueFcfa: 70788125,
          valuePercent: 3.07,
          marketCap: 1040000000000,
          trend: 'UP',
        },
        {
          symbol: 'SPHC',
          mappedSymbols: ['SPHC'],
          name: 'SAPH',
          changePercent: 5.64,
          currentPrice: 10300,
          previousClose: 9750,
          volume: 10580,
          valueFcfa: 106017035,
          valuePercent: 4.60,
          marketCap: 263247451500,
          trend: 'UP',
        },
        {
          symbol: 'CFAC',
          mappedSymbols: ['CFAC'],
          name: 'CFAO MOTORS',
          changePercent: 4.46,
          currentPrice: 1755,
          previousClose: 1680,
          volume: 2802,
          valueFcfa: 4917375,
          valuePercent: 0.21,
          marketCap: 318307684500,
          trend: 'UP',
        },
      ],
      topLosers: [
        {
          symbol: 'BNBC',
          mappedSymbols: ['BNBC'],
          name: 'BERNABE',
          changePercent: -7.50,
          currentPrice: 2220,
          previousClose: 2400,
          volume: 11385,
          valueFcfa: 26027985,
          valuePercent: 1.13,
          marketCap: 14705280000,
          trend: 'DOWN',
        },
        {
          symbol: 'SICC',
          mappedSymbols: ['SICC'],
          name: 'SICOR',
          changePercent: -3.62,
          currentPrice: 7995,
          previousClose: 8295,
          volume: 24,
          valueFcfa: 197745,
          valuePercent: 0.01,
          marketCap: 4797000000,
          trend: 'DOWN',
        },
      ],
      mostActiveByValue: [
        {
          symbol: 'SNTS',
          mappedSymbols: ['SNTS'],
          name: 'SONATEL',
          changePercent: 0.41,
          currentPrice: 37150,
          previousClose: 37000,
          volume: 8293,
          valueFcfa: 311129560,
          valuePercent: 13.49,
          marketCap: 3715000000000,
          trend: 'UP',
        },
        {
          symbol: 'SDSC',
          mappedSymbols: ['SDSC', 'BOLLORE', 'AGL'],
          name: 'BOLLORE - AGL',
          changePercent: 0.34,
          currentPrice: 2935,
          previousClose: 2925,
          volume: 56409,
          valueFcfa: 163645520,
          valuePercent: 7.09,
          marketCap: 159767605500,
          trend: 'UP',
        },
        {
          symbol: 'SPHC',
          mappedSymbols: ['SPHC'],
          name: 'SAPH',
          changePercent: 5.64,
          currentPrice: 10300,
          previousClose: 9750,
          volume: 10580,
          valueFcfa: 106017035,
          valuePercent: 4.60,
          marketCap: 263247451500,
          trend: 'UP',
        },
        {
          symbol: 'SIBC',
          mappedSymbols: ['SIBC'],
          name: 'SIB',
          changePercent: 1.09,
          currentPrice: 9300,
          previousClose: 9200,
          volume: 11461,
          valueFcfa: 105612145,
          valuePercent: 4.58,
          marketCap: 930000000000,
          trend: 'UP',
        },
      ],
      mostActiveByVolume: [
        {
          symbol: 'SDSC',
          mappedSymbols: ['SDSC'],
          name: 'BOLLORE - AGL',
          changePercent: 0.34,
          currentPrice: 2935,
          previousClose: 2925,
          volume: 56409,
          valueFcfa: 163645520,
          valuePercent: 7.09,
          marketCap: 159767605500,
          trend: 'UP',
        },
      ],
      stocks: [],
    };
  }
}

export const richBourseScraper = RichBourseScraperService.getInstance();
