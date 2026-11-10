import React from 'react';
import { useMarketData } from '../../features/market/MarketContext';
import { Activity, RefreshCw, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';
import { formatFCFA } from '../../lib/formatters';

interface DailyMarketSessionBadgeProps {
  className?: string;
  variant?: 'banner' | 'compact' | 'pill';
}

export const DailyMarketSessionBadge: React.FC<DailyMarketSessionBadgeProps> = ({
  className = '',
  variant = 'banner',
}) => {
  const { marketSession, marketMetrics, isRefreshing, refreshMarketData, lastUpdated } = useMarketData();

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refreshMarketData(true);
  };

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          marketSession.isMarketOpen
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60'
            : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700/50'
        } ${className}`}
      >
        <span className="relative flex h-2 w-2">
          {marketSession.isMarketOpen && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              marketSession.isMarketOpen ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
        </span>
        <span className="font-semibold">{marketSession.sessionDateFormatted}</span>
        <span className="hidden sm:inline opacity-70">|</span>
        <span className="hidden sm:inline">{marketSession.statusLabel}</span>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Actualiser les cours du jour"
          className="ml-1 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Actualiser les cours"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`group flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${marketSession.isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        <span>Cours BRVM du {marketSession.sessionDateFormatted}</span>
        <RefreshCw className={`w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
      </button>
    );
  }

  // Full Banner Variant (default)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all ${
        marketSession.isMarketOpen
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border-emerald-200 dark:border-emerald-800/60 shadow-sm'
          : 'bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/20 border-amber-200 dark:border-amber-800/40 shadow-sm'
      } ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status & Session Date */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              marketSession.isMarketOpen
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-amber-600 text-white shadow-amber-500/20'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                BRVM OFFICIEL
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  marketSession.isMarketOpen
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${marketSession.isMarketOpen ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                {marketSession.statusLabel}
              </span>
              {formattedTime && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Dernière MAJ à {formattedTime}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
              Séance du {marketSession.sessionDateFormatted} – Cours actualisés quotidiennement
            </h3>
          </div>
        </div>

        {/* Center / Right: Session Metrics & Refresh Button */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-between md:justify-end">
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="hidden lg:block text-slate-600 dark:text-slate-300">
              <span className="text-xs text-slate-400 block">Capitaux échangés</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatFCFA(marketMetrics.totalSessionValueFcfa)}
              </span>
            </div>

            <div className="hidden sm:block text-slate-600 dark:text-slate-300">
              <span className="text-xs text-slate-400 block">Volume du jour</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {marketMetrics.totalSessionVolume.toLocaleString('fr-FR')} titres
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-emerald-600 font-bold">+{marketMetrics.advancesCount}</span>
              <span className="text-slate-400">/</span>
              <span className="text-rose-600 font-bold">-{marketMetrics.declinesCount}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500 font-medium">={marketMetrics.unchangedCount}</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-sm transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualisation...' : 'Actualiser les cours'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
