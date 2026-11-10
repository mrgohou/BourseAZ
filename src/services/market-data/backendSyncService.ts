export interface BackendSyncRunLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR' | 'RECOVERED';
  recordsUpdated: number;
  durationMs: number;
  provider: string;
  message: string;
  error?: string;
  triggerType: 'AUTOMATIC_5MIN' | 'MANUAL_TRIGGER' | 'WATCHDOG_RECOVERY' | 'STARTUP';
  richBourseMetrics?: {
    totalSessionValueFcfa: number;
    totalSessionVolume: number;
    advances: number;
    declines: number;
    unchanged: number;
  };
}

export interface BackendRecoveryLog {
  id: string;
  timestamp: string;
  reason: string;
  actionTaken: string;
  wasLockBroken: boolean;
  restoredAt: string;
}

export interface BackendSyncStatus {
  status: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR' | 'RECOVERING';
  isSyncing: boolean;
  intervalMinutes: number;
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  lastSyncDurationMs: number;
  lastRecordsUpdated: number;
  consecutiveFailures: number;
  totalSyncsCount: number;
  totalRecoveriesCount: number;
  watchdogActive: boolean;
  provider: string;
  richBourseSourceUrl?: string;
  richBourseActive?: boolean;
  latestSessionMetrics?: {
    totalSessionValueFcfa: number;
    totalSessionVolume: number;
    totalMarketCapFcfa: number;
    advancesCount: number;
    declinesCount: number;
    unchangedCount: number;
    timestamp: string;
  };
  history: BackendSyncRunLog[];
  recoveryLogs: BackendRecoveryLog[];
}

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

export interface BackendMarketAnalysisReport {
  id: string;
  timestamp: string;
  analysisIntervalMinutes: number;
  durationMs: number;
  totalSecuritiesAnalyzed: number;
  richBourseSourceUrl?: string;
  sessionLiquidity?: {
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
  sentiment: {
    state: 'HAUSSIER' | 'NEUTRE' | 'PRUDENCE' | 'VOLATILE';
    label: string;
    advancesCount: number;
    declinesCount: number;
    unchangedCount: number;
    marketBreadthRatio: number;
    averageVariationPercent: number;
  };
  topGainers: StockMomentumAnalysis[];
  topLosers: StockMomentumAnalysis[];
  undervaluedPicks: StockMomentumAnalysis[];
  highDividendChampions: StockMomentumAnalysis[];
  breakoutAlerts: StockMomentumAnalysis[];
  sectorPerformance: Array<{
    sector: string;
    averageChangePercent: number;
    leadersCount: number;
    trend: 'HAUSSE' | 'STABLE' | 'BAISSE';
  }>;
  keyInsights: string[];
}

export interface RichBourseSnapshotData {
  timestamp: string;
  sourceUrl: string;
  sourceLabel: string;
  status: string;
  fetchDurationMs: number;
  totalSecurities: number;
  totalSessionValueFcfa: number;
  totalSessionVolume: number;
  totalMarketCapFcfa: number;
  advancesCount: number;
  declinesCount: number;
  unchangedCount: number;
  topGainers: Array<any>;
  topLosers: Array<any>;
  mostActiveByValue: Array<any>;
  mostActiveByVolume: Array<any>;
  stocks: Array<any>;
}

export class BackendSyncService {
  public static async getStatus(): Promise<BackendSyncStatus | null> {
    try {
      const res = await fetch('/api/market-sync/status');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  public static async triggerSync(reason = 'MANUAL_TRIGGER'): Promise<BackendSyncRunLog | null> {
    try {
      const res = await fetch('/api/market-sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  public static async recoverAndUnblock(reason = 'Déblocage et relance forcée'): Promise<BackendSyncRunLog | null> {
    try {
      const res = await fetch('/api/market-sync/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  public static async getLatestAnalysis(): Promise<BackendMarketAnalysisReport | null> {
    try {
      const res = await fetch('/api/market-analysis/latest');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  public static async getAnalysisHistory(): Promise<BackendMarketAnalysisReport[]> {
    try {
      const res = await fetch('/api/market-analysis/history');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch {
      return [];
    }
  }

  public static async runAnalysis(): Promise<BackendMarketAnalysisReport | null> {
    try {
      const res = await fetch('/api/market-analysis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  public static async getRichBourseData(force = false): Promise<RichBourseSnapshotData | null> {
    try {
      const res = await fetch(`/api/market-data/richbourse${force ? '?force=true' : ''}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }
}
