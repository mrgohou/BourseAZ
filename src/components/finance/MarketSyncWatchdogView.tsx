import React, { useState } from 'react';
import {
  BackendSyncStatus,
  BackendSyncService,
} from '../../services/market-data/backendSyncService';
import {
  RefreshCw,
  ShieldCheck,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  History,
  LifeBuoy,
} from 'lucide-react';

interface MarketSyncWatchdogViewProps {
  status: BackendSyncStatus | null;
  onRefreshStatus: () => Promise<void>;
}

export const MarketSyncWatchdogView: React.FC<MarketSyncWatchdogViewProps> = ({
  status,
  onRefreshStatus,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await BackendSyncService.triggerSync('MANUAL_TRIGGER');
      await onRefreshStatus();
      if (res && res.status !== 'ERROR') {
        setFeedback({
          type: 'success',
          message: `Synchronisation réussie : ${res.recordsUpdated} titres actualisés en ${res.durationMs}ms.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res?.message || 'Erreur lors de la synchronisation.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Échec de la synchronisation.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceRecovery = async () => {
    setIsRecovering(true);
    setFeedback(null);
    try {
      const res = await BackendSyncService.recoverAndUnblock('Déblocage forcé déclenché par l\'utilisateur');
      await onRefreshStatus();
      setFeedback({
        type: 'success',
        message: 'Action Watchdog exécutée : Verrou réinitialisé et synchronisation relancée avec succès !',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erreur lors du déblocage forcé.',
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const formattedLastSync = status?.lastSyncTime
    ? new Date(status.lastSyncTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'En attente';

  const formattedNextSync = status?.nextSyncTime
    ? new Date(status.nextSyncTime).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Dans ~5 min';

  const isStalled = status?.consecutiveFailures && status.consecutiveFailures > 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feedback banner if action taken */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* RichBourse Source Live Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              Flux Live Connecté : RichBourse
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">
              BRVM Cote Officielle
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Source :{' '}
            <a
              href="https://www.richbourse.com/common/variation/index"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-indigo-300 hover:text-white underline"
            >
              https://www.richbourse.com/common/variation/index
            </a>
          </p>
        </div>

        {status?.latestSessionMetrics && (
          <div className="flex items-center gap-4 text-xs font-medium border-t md:border-t-0 md:border-l border-indigo-800/80 pt-2 md:pt-0 md:pl-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Capitaux Séance</span>
              <strong className="text-emerald-400 font-black">
                {(status.latestSessionMetrics.totalSessionValueFcfa / 1_000_000).toFixed(1)} M FCFA
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Volume Titres</span>
              <strong className="text-indigo-300 font-black">
                {status.latestSessionMetrics.totalSessionVolume.toLocaleString('fr-FR')}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bilan</span>
              <span className="text-[11px] font-bold">
                <span className="text-emerald-400">+{status.latestSessionMetrics.advancesCount}</span> /{' '}
                <span className="text-rose-400">-{status.latestSessionMetrics.declinesCount}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 5-Minute Auto-Sync Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-black">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Synchronisation Périodique 5 min
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Trigger automatique toutes les 5 minutes
                </span>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                status?.isSyncing
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status?.isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              {status?.isSyncing ? 'Synchronisation...' : 'Opérationnel'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Dernière Synchro
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formattedLastSync}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {status?.lastRecordsUpdated || 0} titres vérifiés ({status?.lastSyncDurationMs || 0}ms)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Prochain Déclenchement
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formattedNextSync}
              </span>
              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                Cycle automatique
              </span>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || status?.isSyncing}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing || status?.isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing || status?.isSyncing ? 'Synchronisation en cours...' : 'Forcer la synchronisation maintenant'}</span>
          </button>
        </div>

        {/* Card 2: Watchdog & Auto-Unblock Tool */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Watchdog Anti-Blocage & Auto-Guérison
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Surveillance continue (vérification 30s)
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Actif (45s max)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Seuil de blocage détecté :</span>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">45 secondes</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total des relances automatiques :</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{status?.totalRecoveriesCount || 0} relance(s)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Échecs consécutifs en cours :</span>
              <strong className={`font-bold ${isStalled ? 'text-rose-600' : 'text-emerald-600'}`}>
                {status?.consecutiveFailures || 0}
              </strong>
            </div>
          </div>

          {/* Rescue Button */}
          <button
            onClick={handleForceRecovery}
            disabled={isRecovering}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
          >
            <LifeBuoy className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />
            <span>{isRecovering ? 'Déblocage et relance...' : 'Débloquer & Relancer la synchro (Watchdog Rescue)'}</span>
          </button>
        </div>
      </div>

      {/* Synchronizations & Recovery Logs Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Journal des Synchronisations Récentes
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {status?.history?.length || 0} cycles enregistrés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Horodatage</th>
                <th className="py-2.5 px-3">Déclencheur</th>
                <th className="py-2.5 px-3">Statut</th>
                <th className="py-2.5 px-3 text-right">Titres</th>
                <th className="py-2.5 px-3 text-right">Durée</th>
                <th className="py-2.5 px-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {(status?.history || []).slice(0, 8).map((log) => {
                const time = new Date(log.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-bold">{time}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {log.triggerType === 'AUTOMATIC_5MIN'
                        ? 'Auto 5 min'
                        : log.triggerType === 'WATCHDOG_RECOVERY'
                        ? 'Watchdog Rescue'
                        : log.triggerType === 'STARTUP'
                        ? 'Démarrage'
                        : 'Manuel'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : log.status === 'RECOVERED'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? 'Succès' : log.status === 'RECOVERED' ? 'Récupéré' : 'Erreur'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                      {log.recordsUpdated}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{log.durationMs}ms</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-[240px]">
                      {log.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
