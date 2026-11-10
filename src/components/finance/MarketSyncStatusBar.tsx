import React, { useState, useEffect } from 'react';
import { marketScannerSyncEngine, MarketScannerOverview } from '../../services/market-data/MarketScannerSyncEngine';
import {
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2,
  Sliders,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface MarketSyncStatusBarProps {
  onOpenAuditModal?: () => void;
  className?: string;
}

export const MarketSyncStatusBar: React.FC<MarketSyncStatusBarProps> = ({
  onOpenAuditModal,
  className = '',
}) => {
  const [overview, setOverview] = useState<MarketScannerOverview>(() => marketScannerSyncEngine.getOverview());
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const unsubscribe = marketScannerSyncEngine.subscribe(() => {
      setOverview(marketScannerSyncEngine.getOverview());
    });
    return () => unsubscribe();
  }, []);

  const handleManualScan = async () => {
    setIsRotating(true);
    await marketScannerSyncEngine.triggerScan(true);
    setTimeout(() => setIsRotating(false), 500);
  };

  const formattedTime = new Date(overview.lastScanTimestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${className}`}
    >
      {/* Left side: Status badge & Indices */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline font-extrabold uppercase tracking-wide text-[10px]">
            Flux BRVM Actif
          </span>
          <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
            {overview.isScanning ? 'Scan en cours...' : `Synchro : ${formattedTime}`}
          </span>
        </div>

        {/* BRVM Composite */}
        <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase">
            BRVM Composite:
          </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-200">
            {overview.compositeIndex.toFixed(2)} pts
          </span>
          <span
            className={`font-black text-[11px] flex items-center gap-0.5 ${
              overview.compositeChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {overview.compositeChange >= 0 ? '+' : ''}
            {overview.compositeChange.toFixed(2)}%
          </span>
        </div>

        {/* BRVM 30 */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          <span className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase">
            BRVM 30:
          </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-200">
            {overview.brvm30Index.toFixed(2)} pts
          </span>
          <span
            className={`font-black text-[11px] flex items-center gap-0.5 ${
              overview.brvm30Change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {overview.brvm30Change >= 0 ? '+' : ''}
            {overview.brvm30Change.toFixed(2)}%
          </span>
        </div>

        {/* Market Breadth Pill */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-black">▲ {overview.gainersCount}</span>
          <span className="text-rose-600 font-black">▼ {overview.losersCount}</span>
          <span className="text-slate-400">■ {overview.unchangedCount}</span>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
        {/* Manual Scan Trigger */}
        <button
          onClick={handleManualScan}
          disabled={overview.isScanning}
          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          title="Scanner et rapprocher immédiatement les cours avec les plateformes BRVM"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${
              overview.isScanning || isRotating ? 'animate-spin' : ''
            }`}
          />
          <span>{overview.isScanning ? 'Scan en cours...' : 'Actualiser'}</span>
        </button>

        {/* Cross Audit Modal Opener */}
        {onOpenAuditModal && (
          <button
            onClick={onOpenAuditModal}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scanner & Palmarès BRVM</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>
        )}
      </div>
    </div>
  );
};
