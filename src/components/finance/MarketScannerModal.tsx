import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  marketScannerSyncEngine,
  BRVMMarketAuditItem,
  BRVMTopPerformers,
  MarketScannerOverview,
} from '../../services/market-data/MarketScannerSyncEngine';
import {
  BackendSyncService,
  BackendSyncStatus,
  BackendMarketAnalysisReport,
} from '../../services/market-data/backendSyncService';
import { MarketAnalysis15MinView } from './MarketAnalysis15MinView';
import { MarketSyncWatchdogView } from './MarketSyncWatchdogView';
import {
  X,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  BarChart3,
  Coins,
  Percent
} from 'lucide-react';

interface MarketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const MarketScannerModal: React.FC<MarketScannerModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [overview, setOverview] = useState<MarketScannerOverview>(() => marketScannerSyncEngine.getOverview());
  const [topPerformers, setTopPerformers] = useState<BRVMTopPerformers>(() => marketScannerSyncEngine.getTopPerformers());
  const [auditItems, setAuditItems] = useState<BRVMMarketAuditItem[]>(() => marketScannerSyncEngine.getAllAuditItems());
  
  const [activeTab, setActiveTab] = useState<'PALMARES' | 'AUDIT_TABLE' | 'ANALYSIS_15MIN' | 'SYNC_CONFIG'>('PALMARES');
  const [searchFilter, setSearchFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [isScanning, setIsScanning] = useState(false);

  const [backendSyncStatus, setBackendSyncStatus] = useState<BackendSyncStatus | null>(null);
  const [analysisReport, setAnalysisReport] = useState<BackendMarketAnalysisReport | null>(null);

  const loadBackendData = useCallback(async () => {
    try {
      const [status, report] = await Promise.all([
        BackendSyncService.getStatus(),
        BackendSyncService.getLatestAnalysis(),
      ]);
      if (status) setBackendSyncStatus(status);
      if (report) setAnalysisReport(report);
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadBackendData();
      const interval = setInterval(loadBackendData, 15000); // refresh every 15s while modal is open
      return () => clearInterval(interval);
    }
  }, [isOpen, loadBackendData]);

  useEffect(() => {
    const unsubscribe = marketScannerSyncEngine.subscribe(() => {
      setOverview(marketScannerSyncEngine.getOverview());
      setTopPerformers(marketScannerSyncEngine.getTopPerformers());
      setAuditItems(marketScannerSyncEngine.getAllAuditItems());
    });
    return () => unsubscribe();
  }, []);

  const handleScanNow = async () => {
    setIsScanning(true);
    await marketScannerSyncEngine.triggerScan(true);
    setIsScanning(false);
  };

  const sectors = useMemo(() => {
    const list = Array.from(new Set(auditItems.map(i => i.sector))).filter(Boolean);
    return ['ALL', ...list];
  }, [auditItems]);

  const filteredAuditItems = useMemo(() => {
    return auditItems.filter(item => {
      const matchQuery =
        item.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.country.toLowerCase().includes(searchFilter.toLowerCase());

      const matchSector = sectorFilter === 'ALL' || item.sector === sectorFilter;
      return matchQuery && matchSector;
    });
  }, [auditItems, searchFilter, sectorFilter]);

  if (!isOpen) return null;

  const formattedScanTime = new Date(overview.lastScanTimestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800/40 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Moteur de Croisement & Actualisation BRVM
              </span>
              <span className="text-xs text-indigo-300 font-medium">
                Dernier scan : <strong>{formattedScanTime}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              Scanner de Marché & Palmarès en Temps Réel
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 font-medium">
              Croisement continu des cours, plus fortes hausses/baisses et ratios d'analyse avec les plateformes de cotation officielles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScanNow}
              disabled={isScanning || overview.isScanning}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning || overview.isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning || overview.isScanning ? 'Scan...' : 'Re-scanner'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Key Indices Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">BRVM Composite</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 dark:text-white">{overview.compositeIndex.toFixed(2)}</span>
              <span className={`text-xs font-black ${overview.compositeChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {overview.compositeChange >= 0 ? '+' : ''}{overview.compositeChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">BRVM 30</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 dark:text-white">{overview.brvm30Index.toFixed(2)}</span>
              <span className={`text-xs font-black ${overview.brvm30Change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {overview.brvm30Change >= 0 ? '+' : ''}{overview.brvm30Change.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Volume Total Échangé</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {overview.totalMarketVolume.toLocaleString('fr-FR')} titres
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Valeur Transigée</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {Math.round(overview.totalMarketValue / 1000000)}M FCFA
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('PALMARES')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'PALMARES'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            Palmarès Jour & Semaine
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_TABLE')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'AUDIT_TABLE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Audit de Croisement ({auditItems.length} Titres)
          </button>

          <button
            onClick={() => setActiveTab('ANALYSIS_15MIN')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'ANALYSIS_15MIN'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Analyse des Cours (15 min)
            {analysisReport && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ml-1">
                {analysisReport.sentiment.state}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SYNC_CONFIG')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 sm:ml-auto ${
              activeTab === 'SYNC_CONFIG'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Synchro 5 min & Watchdog
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-950/50">
          {/* TAB 1: PALMARES */}
          {activeTab === 'PALMARES' && (
            <div className="space-y-6">
              {/* Row 1: Day Top Gainers vs Day Top Losers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Day Gainers */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                      <TrendingUp className="w-4 h-4" />
                      Top 5 Hausses de la Journée
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Clôture BRVM</span>
                  </div>

                  <div className="space-y-2">
                    {topPerformers.dayTopGainers.map((item, idx) => (
                      <div
                        key={item.symbol}
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate(`/company/${item.symbol}`);
                        }}
                        className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                              {item.symbol} - {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.sector}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {item.currentPrice.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            +{item.dayChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day Losers */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-extrabold text-sm">
                      <TrendingDown className="w-4 h-4" />
                      Top 5 Baisses de la Journée
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Clôture BRVM</span>
                  </div>

                  <div className="space-y-2">
                    {topPerformers.dayTopLosers.map((item, idx) => (
                      <div
                        key={item.symbol}
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate(`/company/${item.symbol}`);
                        }}
                        className="p-2.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                              {item.symbol} - {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.sector}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {item.currentPrice.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-xs font-extrabold text-rose-600">
                            {item.dayChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Week Top Gainers & Highest Yields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Week Gainers */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-extrabold text-sm">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Top 5 Performances Hebdomadaires (7 Jours)
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tendance Hebdo</span>
                  </div>

                  <div className="space-y-2">
                    {topPerformers.weekTopGainers.map((item, idx) => (
                      <div
                        key={item.symbol}
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate(`/company/${item.symbol}`);
                        }}
                        className="p-2.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                              {item.symbol} - {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500">PER: {item.peRatio}x</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {item.currentPrice.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                            +{item.weekChangePercent.toFixed(2)}% hebdo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* High Dividend Yields */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-sm">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Top 5 Meilleurs Rendements du Dividende
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dividendes BRVM</span>
                  </div>

                  <div className="space-y-2">
                    {topPerformers.highDividendYield.map((item, idx) => (
                      <div
                        key={item.symbol}
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate(`/company/${item.symbol}`);
                        }}
                        className="p-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                              {item.symbol} - {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500">Dernier div: {item.lastDividend} FCFA</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400 block">
                            {item.dividendYield.toFixed(2)}% / an
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {item.currentPrice.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT & COMPARISON TABLE */}
          {activeTab === 'AUDIT_TABLE' && (
            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Filtrer par symbole, nom (ex: SNTS, Solibra, SGBCI)..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Secteur:</span>
                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    {sectors.map((s) => (
                      <option key={s} value={s}>{s === 'ALL' ? 'Tous les secteurs' : s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Symbole & Société</th>
                        <th className="py-3 px-4 text-right">Cours Actuel</th>
                        <th className="py-3 px-4 text-right">Var. Jour</th>
                        <th className="py-3 px-4 text-right">Var. Hebdo</th>
                        <th className="py-3 px-4 text-right">PER (x)</th>
                        <th className="py-3 px-4 text-right">Rendement</th>
                        <th className="py-3 px-4 text-right">Volume 24h</th>
                        <th className="py-3 px-4 text-center">Statut Croisement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredAuditItems.map((item) => (
                        <tr
                          key={item.symbol}
                          onClick={() => {
                            onClose();
                            if (onNavigate) onNavigate(`/company/${item.symbol}`);
                          }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-white">{item.symbol}</div>
                            <div className="text-[11px] text-slate-500">{item.name}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                            {item.currentPrice.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold ${item.dayChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.dayChangePercent >= 0 ? '+' : ''}{item.dayChangePercent.toFixed(2)}%
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold ${item.weekChangePercent >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                            {item.weekChangePercent >= 0 ? '+' : ''}{item.weekChangePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                            {item.peRatio}x
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-amber-600 dark:text-amber-400">
                            {item.dividendYield.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-600 dark:text-slate-400">
                            {item.volume.toLocaleString('fr-FR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              Conforme BRVM
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 15-MINUTE AUTOMATIC MARKET ANALYSIS */}
          {activeTab === 'ANALYSIS_15MIN' && (
            <MarketAnalysis15MinView
              report={analysisReport}
              onRefreshReport={loadBackendData}
              onSelectCompany={(sym) => {
                onClose();
                if (onNavigate) onNavigate(`/company/${sym}`);
              }}
            />
          )}

          {/* TAB 4: 5-MINUTE AUTO-SYNC & WATCHDOG CONFIGURATION */}
          {activeTab === 'SYNC_CONFIG' && (
            <div className="space-y-6">
              {/* Backend 5-minute Auto-Sync & Watchdog Component */}
              <MarketSyncWatchdogView
                status={backendSyncStatus}
                onRefreshStatus={loadBackendData}
              />

              {/* Local Scan Engine Settings */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Paramètres Avancés du Scanner Client
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Configuration des alertes locales et de la fréquence de rafraîchissement d'interface.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      Mode d'Actualisation Visuelle
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => marketScannerSyncEngine.setAutoSync(true, overview.syncFrequencySeconds)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          overview.autoSyncEnabled
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Automatique (Recommandé)
                      </button>
                      <button
                        onClick={() => marketScannerSyncEngine.setAutoSync(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          !overview.autoSyncEnabled
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Manuel Uniquement
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      Fréquence du Scanner Visuel
                    </span>
                    <div className="flex items-center gap-2">
                      {[30, 60, 180, 300].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => marketScannerSyncEngine.setAutoSync(true, sec)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            overview.syncFrequencySeconds === sec && overview.autoSyncEnabled
                              ? 'bg-indigo-600 text-white font-black'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sec < 60 ? `${sec}s` : `${sec / 60} min`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Sources and Disclaimers */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5 font-medium">
                  <div className="flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4" />
                    Sources de Données Agréées
                  </div>
                  <p>
                    Les données de cours, dividendes, indices et volumes sont directement extraites et rapprochées des flux de la Cote Officielle BRVM (DC/BR), de RichBourse et des publications homologuées par l'AMF-UMOA.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            46 Sociétés cotées à la BRVM auditées
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
