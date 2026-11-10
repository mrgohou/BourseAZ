import { MarketDataPublisher } from './market-data-publisher';
import { Company } from '../../src/types';
import { richBourseScraper, RichBourseStockItem, RichBourseMarketSnapshot } from './richbourse-scraper';

export interface StockMomentumAnalysis {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  peRatio: number;
  dividendYield: number;
  valueTradedFcfa?: number;
  valuePercent?: number;
  marketCap?: number;
  status: 'SURGE' | 'DIP' | 'STABLE' | 'BREAKOUT';
  analysisNote: string;
}

export interface MarketAnalysisReport {
  id: string;
  timestamp: string;
  analysisIntervalMinutes: number;
  durationMs: number;
  totalSecuritiesAnalyzed: number;
  richBourseSourceUrl: string;
  
  // RichBourse Session Liquidity Metrics
  sessionLiquidity: {
    totalValueFcfa: number;
    totalVolume: number;
    totalMarketCapFcfa: number;
    mostActiveByValue: Array<{
      symbol: string;
      name: string;
      price: number;
      changePercent: number;
      volume: number;
      valueFcfa: number;
      valuePercent: number;
    }>;
    mostActiveByVolume: Array<{
      symbol: string;
      name: string;
      price: number;
      changePercent: number;
      volume: number;
      valueFcfa: number;
    }>;
  };

  // Market Breadth & Sentiment
  sentiment: {
    state: 'HAUSSIER' | 'NEUTRE' | 'PRUDENCE' | 'VOLATILE';
    label: string;
    advancesCount: number;
    declinesCount: number;
    unchangedCount: number;
    marketBreadthRatio: number; // advances / (advances + declines)
    averageVariationPercent: number;
  };

  // Top Movers
  topGainers: StockMomentumAnalysis[];
  topLosers: StockMomentumAnalysis[];

  // Opportunities & Alerts
  undervaluedPicks: StockMomentumAnalysis[]; // Low PE + good fundamentals
  highDividendChampions: StockMomentumAnalysis[]; // High yield (> 7%)
  breakoutAlerts: StockMomentumAnalysis[]; // Unusual surge or drop

  // Sector Highlights
  sectorPerformance: Array<{
    sector: string;
    averageChangePercent: number;
    leadersCount: number;
    trend: 'HAUSSE' | 'STABLE' | 'BAISSE';
  }>;

  // Key Actionable Takeaways (Pedagogical French)
  keyInsights: string[];
}

export class MarketAnalysisEngine {
  private static instance: MarketAnalysisEngine;

  // Frequency: 15 minutes (900,000 ms)
  private readonly analysisIntervalMs = 15 * 60 * 1000;
  private analysisTimer: NodeJS.Timeout | null = null;
  private isAnalyzing = false;
  private lastAnalysisTime: string | null = null;
  private nextAnalysisTime: string | null = null;
  private history: MarketAnalysisReport[] = [];

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): MarketAnalysisEngine {
    if (!MarketAnalysisEngine.instance) {
      MarketAnalysisEngine.instance = new MarketAnalysisEngine();
    }
    return MarketAnalysisEngine.instance;
  }

  /**
   * Starts the 15-minute background analysis loop
   */
  public start(): void {
    if (this.analysisTimer) {
      console.log('[MarketAnalysisEngine] Le moteur d\'analyse est déjà actif.');
      return;
    }

    console.log('[MarketAnalysisEngine] Démarrage du moteur d\'analyse BRVM (Fréquence: 15 min).');

    // Run first analysis shortly after server start
    setTimeout(() => {
      this.runAnalysis('INITIAL_STARTUP').catch((err) => {
        console.error('[MarketAnalysisEngine] Erreur première analyse:', err);
      });
    }, 5000);

    this.scheduleNextAnalysis();
  }

  public stop(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    this.isAnalyzing = false;
    console.log('[MarketAnalysisEngine] Moteur d\'analyse arrêté.');
  }

  private scheduleNextAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    this.nextAnalysisTime = new Date(Date.now() + this.analysisIntervalMs).toISOString();

    this.analysisTimer = setInterval(() => {
      this.runAnalysis('PERIODIC_15MIN').catch((err) => {
        console.error('[MarketAnalysisEngine] Erreur analyse périodique 15 min:', err);
      });
    }, this.analysisIntervalMs);
  }

  /**
   * Executes a full 15-minute algorithmic analysis on all BRVM stocks
   */
  public async runAnalysis(triggerReason = 'PERIODIC_15MIN'): Promise<MarketAnalysisReport> {
    if (this.isAnalyzing) {
      if (this.history.length > 0) {
        return this.history[0];
      }
    }

    this.isAnalyzing = true;
    const startTime = Date.now();

    try {
      const companies = MarketDataPublisher.getCompanies();
      const report = this.performAlgorithmicAnalysis(companies, startTime, triggerReason);

      this.lastAnalysisTime = report.timestamp;
      this.history.unshift(report);
      // Keep up to 48 reports (covers last 12 hours of 15-min intervals)
      if (this.history.length > 48) {
        this.history.pop();
      }

      console.log(
        `[MarketAnalysisEngine] 📊 Analyse 15min terminée (${report.totalSecuritiesAnalyzed} titres analysés, sentiment: ${report.sentiment.state}, durée: ${report.durationMs}ms).`
      );

      this.scheduleNextAnalysis();
      return report;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Computes market statistics, sector trends, momentum signals, and actionable insights
   */
  private performAlgorithmicAnalysis(
    companies: Company[],
    startTime: number,
    _triggerReason: string
  ): MarketAnalysisReport {
    const list = [...companies];
    const totalCount = list.length;
    const rbSnapshot = richBourseScraper.getLastSnapshot();

    // Advances, Declines, Unchanged
    let advances = 0;
    let declines = 0;
    let unchanged = 0;
    let totalVariation = 0;

    const analyzedItems: StockMomentumAnalysis[] = list.map((c) => {
      const change = c.dayChangePercent || 0;
      const pe = c.per || (c as any).peRatio || 12;
      const yieldPct = c.dividendYield || 0;
      const price = c.currentPrice || 1000;
      const volume = c.volume || (c as any).volume || 0;
      const valueTradedFcfa = c.valueTradedFcfa;
      const valuePercent = c.valuePercent;
      const marketCap = c.marketCap;

      if (change > 0.05) advances++;
      else if (change < -0.05) declines++;
      else unchanged++;

      totalVariation += change;

      let status: StockMomentumAnalysis['status'] = 'STABLE';
      let note = 'Cours stable au sein du corridor habituel';

      if (change >= 3.0) {
        status = 'BREAKOUT';
        note = `Forte progression (+${change.toFixed(2)}%) avec pression acheteuse active`;
      } else if (change >= 1.0) {
        status = 'SURGE';
        note = `Dynamique haussière soutenue (+${change.toFixed(2)}%)`;
      } else if (change <= -2.5) {
        status = 'DIP';
        note = `Correction marquée (${change.toFixed(2)}%), opportunité possible de rebond`;
      }

      return {
        symbol: c.symbol,
        name: c.name,
        price,
        changePercent: change,
        volume,
        peRatio: pe,
        dividendYield: yieldPct,
        valueTradedFcfa,
        valuePercent,
        marketCap,
        status,
        analysisNote: note,
      };
    });

    const avgVariation = totalCount > 0 ? totalVariation / totalCount : 0;
    const activeMoves = advances + declines;
    const breadthRatio = activeMoves > 0 ? advances / activeMoves : 0.5;

    // Market Sentiment Calculation
    let state: MarketAnalysisReport['sentiment']['state'] = 'NEUTRE';
    let label = 'Marché équilibré • Consolidation des cours';

    if (breadthRatio >= 0.65 && avgVariation > 0.3) {
      state = 'HAUSSIER';
      label = 'Marché haussier soutenu par de larges flux acheteurs';
    } else if (breadthRatio <= 0.35 && avgVariation < -0.3) {
      state = 'PRUDENCE';
      label = 'Prudence recommandée • Prises de bénéfices dominantes';
    } else if (Math.abs(avgVariation) > 1.2) {
      state = 'VOLATILE';
      label = 'Volatilité prononcée sur les valeurs vedettes';
    }

    // Sort for top gainers & top losers
    const sortedByChange = [...analyzedItems].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedByChange.slice(0, 5).filter((s) => s.changePercent > 0);
    const topLosers = [...analyzedItems].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5).filter((s) => s.changePercent < 0);

    // Breakout alerts (large move > 2.5%)
    const breakoutAlerts = analyzedItems.filter((s) => Math.abs(s.changePercent) >= 2.5);

    // Undervalued picks: P/E between 2 and 10 with positive or stable return
    const undervaluedPicks = analyzedItems
      .filter((s) => s.peRatio > 0 && s.peRatio <= 10.5 && s.dividendYield >= 4.0)
      .sort((a, b) => a.peRatio - b.peRatio)
      .slice(0, 5);

    // High dividend champions: yield >= 6.5%
    const highDividendChampions = analyzedItems
      .filter((s) => s.dividendYield >= 6.5)
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, 5);

    // Sector breakdown
    const sectorMap = new Map<string, { totalChange: number; count: number; gainers: number }>();
    for (const c of list) {
      const sec = c.sector || 'Autres';
      const existing = sectorMap.get(sec) || { totalChange: 0, count: 0, gainers: 0 };
      existing.totalChange += c.dayChangePercent || 0;
      existing.count++;
      if ((c.dayChangePercent || 0) > 0) existing.gainers++;
      sectorMap.set(sec, existing);
    }

    const sectorPerformance = Array.from(sectorMap.entries()).map(([sector, data]) => {
      const avg = data.count > 0 ? data.totalChange / data.count : 0;
      let trend: 'HAUSSE' | 'STABLE' | 'BAISSE' = 'STABLE';
      if (avg > 0.3) trend = 'HAUSSE';
      else if (avg < -0.3) trend = 'BAISSE';

      return {
        sector,
        averageChangePercent: parseFloat(avg.toFixed(2)),
        leadersCount: data.gainers,
        trend,
      };
    }).sort((a, b) => b.averageChangePercent - a.averageChangePercent);

    // RichBourse session liquidity formatting
    const mostActiveByValue = rbSnapshot?.mostActiveByValue.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: s.currentPrice,
      changePercent: s.changePercent,
      volume: s.volume,
      valueFcfa: s.valueFcfa,
      valuePercent: s.valuePercent,
    })) || [];

    const mostActiveByVolume = rbSnapshot?.mostActiveByVolume.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: s.currentPrice,
      changePercent: s.changePercent,
      volume: s.volume,
      valueFcfa: s.valueFcfa,
    })) || [];

    const totalValueFcfa = rbSnapshot?.totalSessionValueFcfa || 0;
    const totalVolume = rbSnapshot?.totalSessionVolume || 0;
    const totalMarketCapFcfa = rbSnapshot?.totalMarketCapFcfa || 0;

    // Actionable French Pedagogical Insights enriched with RichBourse metrics
    const keyInsights: string[] = [];

    if (totalValueFcfa > 0) {
      keyInsights.push(
        `💵 Liquidité RichBourse : La séance comptabilise ${totalVolume.toLocaleString('fr-FR')} titres négociés pour ${(totalValueFcfa / 1_000_000).toFixed(1)} millions FCFA de transactions globales.`
      );
    }

    if (mostActiveByValue.length > 0) {
      const leader = mostActiveByValue[0];
      keyInsights.push(
        `🏆 Pôle de liquidité : ${leader.name} (${leader.symbol}) draine ${leader.valuePercent.toFixed(1)}% des capitaux du marché avec ${(leader.valueFcfa / 1_000_000).toFixed(1)}M FCFA transigés.`
      );
    }

    if (topGainers.length > 0) {
      keyInsights.push(
        `🚀 Dynamisme de séance : ${topGainers[0].name} (${topGainers[0].symbol}) mène les hausses avec +${topGainers[0].changePercent.toFixed(2)}% à ${topGainers[0].price.toLocaleString('fr-FR')} FCFA.`
      );
    }

    if (highDividendChampions.length > 0) {
      const topDiv = highDividendChampions[0];
      keyInsights.push(
        `💰 Opportunité Rendement : ${topDiv.name} (${topDiv.symbol}) offre un rendement dividende attractif de ${topDiv.dividendYield.toFixed(2)}% / an avec un P/E de ${topDiv.peRatio.toFixed(1)}x.`
      );
    }

    if (sectorPerformance.length > 0) {
      const bestSector = sectorPerformance[0];
      keyInsights.push(
        `📈 Secteur en tête : Le compartiment ${bestSector.sector} affiche la meilleure performance globale avec une variation moyenne de +${bestSector.averageChangePercent.toFixed(2)}%.`
      );
    }

    if (breakoutAlerts.length > 0) {
      keyInsights.push(
        `⚡ Alerte Volatilité : ${breakoutAlerts.length} valeur(s) enregistrent une variation supérieure à ±2.5%, surveillez les volumes de clôture.`
      );
    } else {
      keyInsights.push(
        `🛡️ Stabilité : La majorité des cours évolue avec une volatilité maîtrisée sans à-coup spéculatif.`
      );
    }

    const durationMs = Date.now() - startTime;

    return {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      analysisIntervalMinutes: 15,
      durationMs,
      totalSecuritiesAnalyzed: totalCount,
      richBourseSourceUrl: 'https://www.richbourse.com/common/variation/index',
      sessionLiquidity: {
        totalValueFcfa,
        totalVolume,
        totalMarketCapFcfa,
        mostActiveByValue,
        mostActiveByVolume,
      },
      sentiment: {
        state,
        label,
        advancesCount: advances,
        declinesCount: declines,
        unchangedCount: unchanged,
        marketBreadthRatio: parseFloat(breadthRatio.toFixed(3)),
        averageVariationPercent: parseFloat(avgVariation.toFixed(2)),
      },
      topGainers,
      topLosers,
      undervaluedPicks,
      highDividendChampions,
      breakoutAlerts,
      sectorPerformance,
      keyInsights,
    };
  }

  /**
   * Returns the most recently computed report, or runs one immediately if empty
   */
  public async getLatestAnalysis(): Promise<MarketAnalysisReport> {
    if (this.history.length > 0) {
      return this.history[0];
    }
    return this.runAnalysis('ON_DEMAND_FETCH');
  }

  /**
   * Returns list of recent analyses
   */
  public getHistory(): MarketAnalysisReport[] {
    return [...this.history];
  }

  public getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      intervalMinutes: 15,
      lastAnalysisTime: this.lastAnalysisTime,
      nextAnalysisTime: this.nextAnalysisTime,
      totalReportsStored: this.history.length,
      latestSentiment: this.history[0]?.sentiment.state || 'NEUTRE',
    };
  }
}

export const marketAnalysisEngine = MarketAnalysisEngine.getInstance();
