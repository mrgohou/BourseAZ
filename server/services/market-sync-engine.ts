import { getActiveMarketDataProvider } from '../providers';
import { MarketDataPublisher } from './market-data-publisher';
import { globalMarketCache } from './market-data-cache';
import { richBourseScraper, RichBourseMarketSnapshot } from './richbourse-scraper';

export interface SyncRunLog {
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

export interface RecoveryLog {
  id: string;
  timestamp: string;
  reason: string;
  actionTaken: string;
  wasLockBroken: boolean;
  restoredAt: string;
}

export interface MarketSyncStatus {
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
  richBourseSourceUrl: string;
  richBourseActive: boolean;
  latestSessionMetrics?: {
    totalSessionValueFcfa: number;
    totalSessionVolume: number;
    totalMarketCapFcfa: number;
    advancesCount: number;
    declinesCount: number;
    unchangedCount: number;
    timestamp: string;
  };
  history: SyncRunLog[];
  recoveryLogs: RecoveryLog[];
}

export class MarketSyncEngine {
  private static instance: MarketSyncEngine;

  // Configuration (5 minutes = 300,000 ms)
  private readonly syncIntervalMs = 5 * 60 * 1000;
  // Watchdog checks every 30 seconds
  private readonly watchdogIntervalMs = 30 * 1000;
  // If a sync is stuck in progress for more than 45 seconds, consider it blocked
  private readonly lockTimeoutMs = 45 * 1000;

  private syncTimer: NodeJS.Timeout | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;

  private isSyncing = false;
  private syncStartTime: number | null = null;
  private lastSyncTime: string | null = null;
  private nextSyncTime: string | null = null;
  private lastDurationMs = 0;
  private lastRecordsCount = 0;
  private consecutiveFailures = 0;
  private totalSyncs = 0;
  private totalRecoveries = 0;

  private currentStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR' | 'RECOVERING' = 'IDLE';

  private history: SyncRunLog[] = [];
  private recoveryLogs: RecoveryLog[] = [];
  private listeners: Array<(status: MarketSyncStatus) => void> = [];

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): MarketSyncEngine {
    if (!MarketSyncEngine.instance) {
      MarketSyncEngine.instance = new MarketSyncEngine();
    }
    return MarketSyncEngine.instance;
  }

  /**
   * Start the background 5-minute synchronization engine and watchdog
   */
  public start(): void {
    if (this.syncTimer) {
      console.log('[MarketSyncEngine] Le moteur est déjà actif.');
      return;
    }

    console.log('[MarketSyncEngine] Démarrage du moteur de synchronisation BRVM (Fréquence: 5 min).');

    // Run initial sync after server startup
    setTimeout(() => {
      this.triggerSync('STARTUP').catch((err) => {
        console.error('[MarketSyncEngine] Erreur synchronisation initiale:', err);
      });
    }, 2000);

    // Schedule periodic 5-minute sync
    this.scheduleNextSync();

    // Start Watchdog monitor
    this.startWatchdog();
  }

  /**
   * Stop timers (useful for graceful shutdown or tests)
   */
  public stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.isSyncing = false;
    this.currentStatus = 'IDLE';
    console.log('[MarketSyncEngine] Moteur de synchronisation arrêté.');
  }

  /**
   * Schedules the next periodic 5-minute sync
   */
  private scheduleNextSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.nextSyncTime = new Date(Date.now() + this.syncIntervalMs).toISOString();

    this.syncTimer = setInterval(() => {
      this.triggerSync('AUTOMATIC_5MIN').catch((err) => {
        console.error('[MarketSyncEngine] Erreur sync périodique 5 min:', err);
      });
    }, this.syncIntervalMs);
  }

  /**
   * Watchdog loop: checks every 30 seconds if a sync is stalled or blocked
   */
  private startWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }

    this.watchdogTimer = setInterval(() => {
      this.runWatchdogCheck();
    }, this.watchdogIntervalMs);
  }

  /**
   * Inspects current lock and automatically breaks stuck locks or rescues failed state
   */
  public runWatchdogCheck(): boolean {
    const now = Date.now();

    // Check if sync has been in progress longer than lockTimeoutMs (45 seconds)
    if (this.isSyncing && this.syncStartTime && now - this.syncStartTime > this.lockTimeoutMs) {
      const stuckDurationSec = Math.round((now - this.syncStartTime) / 1000);
      console.warn(`[MarketSyncWatchdog] Blocage détecté ! La synchronisation est figée depuis ${stuckDurationSec}s.`);

      this.recoverAndForceSync(
        `Blocage détecté : processus figé depuis ${stuckDurationSec} secondes (dépassement du seuil de ${this.lockTimeoutMs / 1000}s).`
      );
      return true;
    }

    // Check if next scheduled sync has passed by more than 2 minutes without triggering
    if (this.nextSyncTime) {
      const nextTime = new Date(this.nextSyncTime).getTime();
      if (now - nextTime > 2 * 60 * 1000 && !this.isSyncing) {
        console.warn('[MarketSyncWatchdog] Échéance de synchronisation manquée. Relance préventive.');
        this.triggerSync('WATCHDOG_RECOVERY').catch(() => {});
        return true;
      }
    }

    return false;
  }

  /**
   * Self-Healing: Forcibly breaks any lock, resets state, logs recovery, and executes an immediate sync
   */
  public async recoverAndForceSync(reason = 'Déblocage forcé demandé'): Promise<SyncRunLog> {
    this.totalRecoveries++;
    const wasStuck = this.isSyncing;

    // Reset lock and timers
    this.isSyncing = false;
    this.syncStartTime = null;
    this.currentStatus = 'RECOVERING';

    const recoveryEvent: RecoveryLog = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      reason,
      actionTaken: 'Verrou débloqué, caches réinitialisés, relance immédiate du cycle de synchronisation BRVM.',
      wasLockBroken: wasStuck,
      restoredAt: new Date().toISOString(),
    };

    this.recoveryLogs.unshift(recoveryEvent);
    if (this.recoveryLogs.length > 30) this.recoveryLogs.pop();

    console.log(`[MarketSyncEngine] Action d'auto-guérison déclenchée: ${reason}`);

    // Invalidate stale caches to ensure fresh data fetch
    globalMarketCache.invalidate();

    // Trigger immediate clean synchronization
    return this.executeSync('WATCHDOG_RECOVERY', true);
  }

  /**
   * Triggers a sync cycle (manual or automatic)
   */
  public async triggerSync(triggerType: SyncRunLog['triggerType'] = 'MANUAL_TRIGGER'): Promise<SyncRunLog> {
    if (this.isSyncing) {
      console.warn('[MarketSyncEngine] Une synchronisation est déjà en cours. Requête ignorée.');
      return {
        id: `skip-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'ERROR',
        recordsUpdated: 0,
        durationMs: 0,
        provider: process.env.BRVM_DATA_PROVIDER || 'brvm-data-platform',
        message: 'Synchronisation déjà en cours. Attente du prochain cycle ou utilisation de la récupération forcée.',
        triggerType,
      };
    }

    return this.executeSync(triggerType, false);
  }

  /**
   * Internal execution of data synchronization
   */
  private async executeSync(triggerType: SyncRunLog['triggerType'], isRecovery = false): Promise<SyncRunLog> {
    this.isSyncing = true;
    this.syncStartTime = Date.now();
    this.currentStatus = isRecovery ? 'RECOVERING' : 'SYNCING';
    this.notify();

    const providerName = process.env.BRVM_DATA_PROVIDER || 'richbourse';
    const startTime = Date.now();
    let recordsUpdated = 0;

    try {
      const provider = getActiveMarketDataProvider();

      // Fetch fresh companies and RichBourse live variations
      const fetchPromise = Promise.all([
        provider.getCompanies(),
        richBourseScraper.fetchVariations(isRecovery),
      ]);

      // Guard with internal timeout (25 seconds maximum for single sync)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Dépassement du délai de réponse du fournisseur (25s)')), 25000)
      );

      const [companies, rbSnapshot] = await Promise.race([fetchPromise, timeoutPromise]);

      if (Array.isArray(companies) && companies.length > 0) {
        recordsUpdated = companies.length;

        // Ensure quotes and companies are published and validated when price changes or company is new
        for (const company of companies) {
          const existingQuote = MarketDataPublisher.getQuote(company.symbol);
          const priceChanged = !existingQuote || existingQuote.price !== company.currentPrice;

          if (priceChanged) {
            const compRecord = MarketDataPublisher.processIncomingRecord(
              'COMPANY',
              company,
              `AutoSync-5min (${providerName})`
            );
            MarketDataPublisher.publishItem(compRecord);

            const quoteRecord = MarketDataPublisher.processIncomingRecord(
              'QUOTE',
              company,
              `AutoSync-5min (${providerName})`
            );
            MarketDataPublisher.publishItem(quoteRecord);
          }
        }
      }

      // Invalidate memory cache so endpoints serve the newly synced quotes
      globalMarketCache.invalidate();

      const durationMs = Date.now() - startTime;
      this.lastSyncTime = new Date().toISOString();
      this.lastDurationMs = durationMs;
      this.lastRecordsCount = recordsUpdated;
      this.consecutiveFailures = 0;
      this.totalSyncs++;
      this.currentStatus = 'SUCCESS';

      const successLog: SyncRunLog = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: this.lastSyncTime,
        status: isRecovery ? 'RECOVERED' : 'SUCCESS',
        recordsUpdated,
        durationMs,
        provider: 'RichBourse (common/variation/index)',
        message: `Synchronisation RichBourse réussie: ${recordsUpdated} cours BRVM actualisés (Capitaux: ${rbSnapshot.totalSessionValueFcfa.toLocaleString('fr-FR')} FCFA, Volume: ${rbSnapshot.totalSessionVolume.toLocaleString('fr-FR')} titres) en ${durationMs}ms.`,
        triggerType,
        richBourseMetrics: {
          totalSessionValueFcfa: rbSnapshot.totalSessionValueFcfa,
          totalSessionVolume: rbSnapshot.totalSessionVolume,
          advances: rbSnapshot.advancesCount,
          declines: rbSnapshot.declinesCount,
          unchanged: rbSnapshot.unchangedCount,
        },
      };

      this.history.unshift(successLog);
      if (this.history.length > 40) this.history.pop();

      console.log(`[MarketSyncEngine] ✅ Synchronisation 5min RichBourse terminée: ${recordsUpdated} titres actualisés (${durationMs}ms).`);

      // Reset next scheduled time
      this.scheduleNextSync();

      return successLog;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.consecutiveFailures++;
      this.currentStatus = 'ERROR';

      const errorMessage = err?.message || 'Erreur inconnue durant la synchronisation.';
      console.error(`[MarketSyncEngine] ❌ Échec synchronisation (${this.consecutiveFailures} consécutifs):`, errorMessage);

      const errorLog: SyncRunLog = {
        id: `sync-err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        status: 'ERROR',
        recordsUpdated: 0,
        durationMs,
        provider: providerName,
        message: `Échec de la synchronisation BRVM: ${errorMessage}`,
        error: errorMessage,
        triggerType,
      };

      this.history.unshift(errorLog);
      if (this.history.length > 40) this.history.pop();

      // Auto-retry with backoff if consecutive failures
      this.scheduleRetry(this.consecutiveFailures);

      return errorLog;
    } finally {
      this.isSyncing = false;
      this.syncStartTime = null;
      this.notify();
    }
  }

  /**
   * When an error occurs, schedule an auto-retry before the standard 5 minutes
   */
  private scheduleRetry(failureCount: number): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    // Exponential backoff: 15s, 30s, 60s
    const retryDelay = Math.min(15000 * Math.pow(2, failureCount - 1), 60000);
    console.log(`[MarketSyncEngine] Nouvelle tentative programmée dans ${retryDelay / 1000}s.`);

    this.retryTimer = setTimeout(() => {
      this.recoverAndForceSync(`Reprise automatique suite à l'erreur précédente (Tentative #${failureCount})`).catch(() => {});
    }, retryDelay);
  }

  /**
   * Returns complete real-time status of the synchronization engine
   */
  public getStatus(): MarketSyncStatus {
    const lastRbSnapshot = richBourseScraper.getLastSnapshot();

    return {
      status: this.currentStatus,
      isSyncing: this.isSyncing,
      intervalMinutes: 5,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.nextSyncTime,
      lastSyncDurationMs: this.lastDurationMs,
      lastRecordsUpdated: this.lastRecordsCount,
      consecutiveFailures: this.consecutiveFailures,
      totalSyncsCount: this.totalSyncs,
      totalRecoveriesCount: this.totalRecoveries,
      watchdogActive: !!this.watchdogTimer,
      provider: process.env.BRVM_DATA_PROVIDER || 'richbourse',
      richBourseSourceUrl: 'https://www.richbourse.com/common/variation/index',
      richBourseActive: true,
      latestSessionMetrics: lastRbSnapshot
        ? {
            totalSessionValueFcfa: lastRbSnapshot.totalSessionValueFcfa,
            totalSessionVolume: lastRbSnapshot.totalSessionVolume,
            totalMarketCapFcfa: lastRbSnapshot.totalMarketCapFcfa,
            advancesCount: lastRbSnapshot.advancesCount,
            declinesCount: lastRbSnapshot.declinesCount,
            unchangedCount: lastRbSnapshot.unchangedCount,
            timestamp: lastRbSnapshot.timestamp,
          }
        : undefined,
      history: [...this.history],
      recoveryLogs: [...this.recoveryLogs],
    };
  }

  /**
   * Event listener subscription for UI or other services
   */
  public subscribe(callback: (status: MarketSyncStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('[MarketSyncEngine] Erreur notification auditeur:', err);
      }
    });
  }
}

export const marketSyncEngine = MarketSyncEngine.getInstance();
