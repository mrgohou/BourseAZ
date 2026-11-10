import React, { useState, useEffect } from 'react';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES } from '../../data/demo-data';
import { ComparisonChart } from '../../components/charts/ComparisonChart';
import { DividendYieldComparer } from '../../components/finance/DividendYieldComparer';
import { StockPerformanceOverlay } from '../../components/finance/StockPerformanceOverlay';
import { Button } from '../../components/ui/Button';
import { SkeletonChart, SkeletonTable } from '../../components/ui/Skeleton';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { calculatePER, calculateROE, calculatePBR } from '../../lib/calculations';
import { useAuth } from '../../features/auth/AuthContext';
import { DailyMarketSessionBadge } from '../../components/finance/DailyMarketSessionBadge';
import { useMarketData } from '../../features/market/MarketContext';
import {
  BarChart2,
  Plus,
  X,
  Trophy,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Coins,
  Layers,
  Lock,
  Compass,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface ComparisonPageProps {
  initialSymbol?: string;
  onNavigate: (path: string) => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ initialSymbol, onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'OVERLAY' | 'DIVIDENDS'>('OVERVIEW');
  const [overviewChartMode, setOverviewChartMode] = useState<'STANDARD' | 'OVERLAY_1V1'>('STANDARD');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    return initialSymbol ? [initialSymbol] : [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbols([initialSymbol]);
    }
  }, [initialSymbol]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 450);
  };

  const addCompany = (symbol: string) => {
    if (selectedSymbols.length < 3 && !selectedSymbols.includes(symbol)) {
      setLoading(true);
      setSelectedSymbols([...selectedSymbols, symbol]);
      setTimeout(() => setLoading(false), 300);
    }
  };

  const removeCompany = (symbol: string) => {
    setLoading(true);
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
    setTimeout(() => setLoading(false), 250);
  };

  const { companies, historicalPrices: allHistoricalPrices, marketSession } = useMarketData();

  const companiesToCompare = selectedSymbols.map(sym => {
    const company = companies.find(c => c.symbol === sym) || DEMO_COMPANIES.find(c => c.symbol === sym) || DEMO_COMPANIES[0];
    const prices = allHistoricalPrices[sym] || DEMO_HISTORICAL_PRICES[sym] || [];
    return {
      company,
      prices,
    };
  });

  // Calculate winner stock based on 1-year performance
  let winner = companiesToCompare[0];
  let maxChange = -999;

  companiesToCompare.forEach(item => {
    const prices = item.prices;
    if (prices.length > 1) {
      const first = prices[0].close;
      const last = prices[prices.length - 1].close;
      const change = ((last - first) / first) * 100;
      if (change > maxChange) {
        maxChange = change;
        winner = item;
      }
    }
  });

  const chartDataCompanies = companiesToCompare.map(item => ({
    symbol: item.company.symbol,
    name: item.company.name,
    prices: item.prices,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            BENCHMARK COMPARATIF & ANALYSE BRVM
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
            Comparateur d’Entreprises BRVM
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
            Mettez en concurrence jusqu’à 3 sociétés cotées sur la BRVM. Comparez leurs cours en direct, PER, rendements de dividendes, marges nettes et retours sur fonds propres (ROE).
          </p>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-emerald-200 font-bold">Sélection active :</span>
              <span className="font-black text-white">{selectedSymbols.length} / 3 entreprises</span>
              {selectedSymbols.length > 0 && (
                <span className="text-emerald-300 font-extrabold bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-600/50">
                  {selectedSymbols.join(' vs ')}
                </span>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading || selectedSymbols.length === 0}
              className="px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Calcul...' : 'Rafraîchir les ratios'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Daily Live Market Session Bar */}
      <DailyMarketSessionBadge />

      {/* Navigation Tabs */}
      <div className="p-1.5 bg-slate-200/60 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-300/60 dark:border-slate-700/60 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Comparateur Global & Ratios</span>
        </button>

        <button
          onClick={() => setActiveTab('OVERLAY')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'OVERLAY'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Superposition Graphique (2 Actions)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
            1v1 Interactif
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DIVIDENDS')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'DIVIDENDS'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Rendements & Dividendes Historiques</span>
        </button>
      </div>

      {activeTab === 'OVERLAY' ? (
        <StockPerformanceOverlay
          initialSymbolA={selectedSymbols[0] || 'SNTS'}
          initialSymbolB={selectedSymbols[1] || 'ORAC'}
          onNavigate={onNavigate}
        />
      ) : activeTab === 'DIVIDENDS' ? (
        <DividendYieldComparer
          selectedSymbols={selectedSymbols}
          onSelectedSymbolsChange={setSelectedSymbols}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          {/* Stock Selection Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-100/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Actions sélectionnées ({selectedSymbols.length} / 3)
              </label>
              {selectedSymbols.length > 0 && (
                <button
                  onClick={() => setSelectedSymbols([])}
                  className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  Réinitialiser la sélection
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {selectedSymbols.map(sym => {
                const comp = DEMO_COMPANIES.find(c => c.symbol === sym);
                return (
                  <div
                    key={sym}
                    className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-2xs"
                  >
                    <span>{comp?.name} ({sym})</span>
                    <button
                      onClick={() => removeCompany(sym)}
                      className="p-0.5 text-emerald-700 dark:text-emerald-300 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer transition-colors"
                      title="Retirer de la comparaison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {selectedSymbols.length < 3 && (
                <div className="relative">
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        addCompany(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl outline-none border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                  >
                    <option value="">
                      {selectedSymbols.length === 0 ? '+ Sélectionner une action...' : '+ Ajouter une autre action...'}
                    </option>
                    {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).filter(c => !selectedSymbols.includes(c.symbol)).map(c => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.name} ({c.symbol}) - {formatFCFA(c.currentPrice)} ({c.dayChangePercent >= 0 ? `+${c.dayChangePercent}%` : `${c.dayChangePercent}%`})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {selectedSymbols.length === 0 ? (
            /* Empty State when no stock selected */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 text-center space-y-5 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <BarChart2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Aucune action sélectionnée
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Veuillez choisir 1 à 3 actions dans le menu déroulant ci-dessus pour comparer leur cours actuel, cours intrinsèque, dernier dividende, rendement, BPA et PER.
                </p>
              </div>
              <div className="pt-2">
                <select
                  onChange={e => {
                    if (e.target.value) {
                      addCompany(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl cursor-pointer transition shadow-sm outline-none"
                >
                  <option value="" className="text-slate-900 bg-white">+ Choisir une première action à comparer...</option>
                  {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).map(c => (
                    <option key={c.symbol} value={c.symbol} className="text-slate-900 bg-white">
                      {c.name} ({c.symbol}) - {formatFCFA(c.currentPrice)} ({c.dayChangePercent >= 0 ? `+${c.dayChangePercent}%` : `${c.dayChangePercent}%`})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Winner Spotlight Banner (if companies selected) */}
              {winner && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 shadow-lg">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-amber-300 uppercase tracking-widest mb-1">
                        Action en tête sur la sélection ({companiesToCompare.length})
                      </div>
                      <h2 className="text-2xl font-black">{winner.company.name} ({winner.company.symbol})</h2>
                      <p className="text-xs text-slate-300 mt-1">
                        Performance historique : <strong className="text-emerald-400 font-black">+{maxChange.toFixed(2)} %</strong> sur la période analysée.
                      </p>
                    </div>
                  </div>

                  <Button size="md" variant="secondary" onClick={() => onNavigate(`/company/${winner.company.symbol}`)}>
                    Voir l'analyse détaillée <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* 1v1 Duel Superposition Callout Banner when 2 stocks are selected */}
              {selectedSymbols.length === 2 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white border-2 border-emerald-700/80 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shrink-0 shadow-sm">
                      <Layers className="w-6 h-6 text-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-amber-300">Face-à-Face 1v1 Détecté</span>
                        <span className="text-xs bg-emerald-800/80 px-2 py-0.5 rounded-md font-bold text-emerald-200">
                          {selectedSymbols[0]} vs {selectedSymbols[1]}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100/90 mt-0.5">
                        Superposez leurs courbes historiques en % ou en FCFA, comparez l'écart d'alpha et analysez leur corrélation dans l'outil interactif.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setOverviewChartMode(overviewChartMode === 'OVERLAY_1V1' ? 'STANDARD' : 'OVERLAY_1V1')}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
                    >
                      {overviewChartMode === 'OVERLAY_1V1' ? 'Afficher Graphique Standard' : 'Superposer Directement Ici'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('OVERLAY')}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                    >
                      <span>Ouvrir l'Outil Dédié</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Comparison Chart or Skeleton or Inline 1v1 Overlay */}
              {loading ? (
                <div className="space-y-6">
                  <SkeletonChart />
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
                    <SkeletonTable rows={5} />
                  </div>
                </div>
              ) : selectedSymbols.length === 2 && overviewChartMode === 'OVERLAY_1V1' ? (
                <StockPerformanceOverlay
                  initialSymbolA={selectedSymbols[0]}
                  initialSymbolB={selectedSymbols[1]}
                  onNavigate={onNavigate}
                />
              ) : (
                <ComparisonChart companies={chartDataCompanies} />
              )}

              {/* Detailed Ratios Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Tableau de Comparaison des Ratios Financiers</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Accès public : Cours, Coût intrinsèque, Dividende, Rendement, BPA et PER.
                    </p>
                  </div>
                  {!isAuthenticated && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Mode Invité (Ratios avancés verrouillés)
                    </span>
                  )}
                </div>

                {!isAuthenticated && (
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>Ratios réservés aux membres :</strong> Connectez-vous gratuitement pour débloquer le ROE, le PBR, la plus-value historique et la phase de cycle de vie.
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('/auth')}
                      className="shrink-0 px-5 py-2 rounded-full bg-amber-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                    >
                      Se connecter
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Critère Financier</th>
                        {companiesToCompare.map(item => (
                          <th key={item.company.symbol} className="p-4 text-slate-900 dark:text-white font-extrabold">
                            {item.company.name} ({item.company.symbol})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                      {/* 1. Cours Actuel - PUBLIC */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                          Cours Actuel
                        </td>
                        {companiesToCompare.map(item => (
                          <td key={item.company.symbol} className="p-4 font-extrabold text-slate-900 dark:text-white">
                            {formatFCFA(item.company.currentPrice)}
                          </td>
                        ))}
                      </tr>

                      {/* 2. Coût Intrinsèque - PUBLIC */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                          Coût Intrinsèque (Prix d'Entrée / IPO)
                        </td>
                        {companiesToCompare.map(item => (
                          <td key={item.company.symbol} className="p-4 font-bold text-indigo-900 dark:text-indigo-300">
                            {item.company.ipoPrice ? `${formatFCFA(item.company.ipoPrice)} ${item.company.ipoDate ? `(${item.company.ipoDate})` : ''}` : '1 000 FCFA'}
                          </td>
                        ))}
                      </tr>

                      {/* 3. Dernier Dividende - PUBLIC */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                          Dernier Dividende
                        </td>
                        {companiesToCompare.map(item => (
                          <td key={item.company.symbol} className="p-4 font-bold text-slate-900 dark:text-white">
                            {item.company.lastDividend ? formatFCFA(item.company.lastDividend) : '0 FCFA'}
                          </td>
                        ))}
                      </tr>

                      {/* 4. Rendement du Dividende - PUBLIC */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                          Rendement du Dividende
                        </td>
                        {companiesToCompare.map(item => (
                          <td key={item.company.symbol} className="p-4 font-extrabold text-emerald-700 dark:text-emerald-400">
                            {item.company.dividendYield ? formatPercent(item.company.dividendYield, false) : '0 %'}
                          </td>
                        ))}
                      </tr>

                      {/* 5. BPA (Bénéfice Par Action) - PUBLIC */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                          BPA (Bénéfice Par Action)
                        </td>
                        {companiesToCompare.map(item => (
                          <td key={item.company.symbol} className="p-4 font-bold text-slate-900 dark:text-white">
                            {item.company.eps !== undefined ? `${item.company.eps} FCFA` : 'N/A'}
                          </td>
                        ))}
                      </tr>

                      {/* 6. PER (Price Earning Ratio) - PUBLIC */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40">
                          PER (Price Earning Ratio)
                        </td>
                        {companiesToCompare.map(item => {
                          const perCalc = calculatePER(item.company.currentPrice, item.company.eps);
                          return (
                            <td key={item.company.symbol} className="p-4">
                              {perCalc.status === 'VALID' ? (
                                <span className="font-extrabold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-md">
                                  {perCalc.per}x
                                </span>
                              ) : (
                                <span className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-1 rounded-md text-[11px] font-bold">
                                  Non disp. ({perCalc.status})
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 7. Plus-value depuis l'Entrée - LOCKED FOR GUESTS */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                          <span>Plus-value depuis l'Entrée</span>
                          {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                        </td>
                        {companiesToCompare.map(item => {
                          const ipo = item.company.ipoPrice || 1000;
                          const diff = item.company.currentPrice - ipo;
                          const pct = (diff / ipo) * 100;
                          return (
                            <td key={item.company.symbol} className="p-4 font-extrabold">
                              {isAuthenticated ? (
                                <span className={`px-2 py-1 rounded-md text-xs ${pct >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                                  {pct >= 0 ? '+' : ''}{pct.toFixed(0)} %
                                </span>
                              ) : (
                                <button
                                  onClick={() => onNavigate('/auth')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-200 transition cursor-pointer"
                                  title="Connectez-vous pour débloquer cette donnée"
                                >
                                  <Lock className="w-3 h-3 text-amber-500" /> Réservé membres
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 8. ROE - LOCKED FOR GUESTS */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                          <span>ROE (Rentabilité Capitaux Propres)</span>
                          {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                        </td>
                        {companiesToCompare.map(item => {
                          const roeCalc = calculateROE(item.company.roe);
                          return (
                            <td key={item.company.symbol} className="p-4">
                              {isAuthenticated ? (
                                roeCalc.roe !== null ? (
                                  <span className={`font-extrabold px-2 py-1 rounded-md ${
                                    roeCalc.roe >= 18 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                    roeCalc.roe >= 12 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                  }`}>
                                    {roeCalc.roe}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">N/A</span>
                                )
                              ) : (
                                <button
                                  onClick={() => onNavigate('/auth')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-200 transition cursor-pointer"
                                  title="Connectez-vous pour débloquer cette donnée"
                                >
                                  <Lock className="w-3 h-3 text-amber-500" /> Réservé membres
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 9. PBR - LOCKED FOR GUESTS */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                          <span>PBR (Price-to-Book Ratio)</span>
                          {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                        </td>
                        {companiesToCompare.map(item => {
                          const pbrCalc = calculatePBR(item.company.currentPrice, item.company.bookValuePerShare, item.company.pbr);
                          return (
                            <td key={item.company.symbol} className="p-4">
                              {isAuthenticated ? (
                                pbrCalc.pbr !== null ? (
                                  <span className={`font-extrabold px-2 py-1 rounded-md ${
                                    pbrCalc.pbr < 1.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                    pbrCalc.pbr <= 2.0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}>
                                    {pbrCalc.pbr}x
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">N/A</span>
                                )
                              ) : (
                                <button
                                  onClick={() => onNavigate('/auth')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-200 transition cursor-pointer"
                                  title="Connectez-vous pour débloquer cette donnée"
                                >
                                  <Lock className="w-3 h-3 text-amber-500" /> Réservé membres
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* 10. Cycle de Vie - LOCKED FOR GUESTS */}
                      <tr>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                          <span>Phase de Cycle de Vie</span>
                          {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                        </td>
                        {companiesToCompare.map(item => (
                          <td key={item.company.symbol} className="p-4 font-bold uppercase text-[11px]">
                            {isAuthenticated ? (
                              item.company.lifecycle
                            ) : (
                              <button
                                onClick={() => onNavigate('/auth')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-950 dark:hover:text-amber-200 transition cursor-pointer"
                                title="Connectez-vous pour débloquer cette donnée"
                              >
                                <Lock className="w-3 h-3 text-amber-500" /> Réservé membres
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Educational Info Card below table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                      Guide Stratégique BRVM
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Comment bien choisir une action grâce aux 3 facteurs différenciants (BPA, PER & Rendement) ?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Lors de la comparaison entre plusieurs entreprises de la BRVM, ces trois indicateurs financiers fondamentaux vous permettent de déceler les meilleures opportunités.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Facteur 1: BPA */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        Rentabilité
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" /> BPA (Bénéfice Par Action)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Le BPA mesure la part de bénéfice net générée par l'entreprise pour chaque action en circulation.
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                      <div className="font-extrabold text-blue-700 dark:text-blue-400">💡 Conseil d'analyse :</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Privilégiez les sociétés affichant un BPA élevé et en progression régulière d'une année sur l'autre. C'est le moteur principal de la hausse future du cours.
                      </p>
                    </div>
                  </div>

                  {/* Facteur 2: PER */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center">
                        2
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        Prix & Valorisation
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> PER (Price Earnings Ratio)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Le PER indique combien de fois le bénéfice annuel vous payez en achetant l'action au cours actuel (Cours / BPA).
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                      <div className="font-extrabold text-indigo-700 dark:text-indigo-400">💡 Conseil d'analyse :</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Un PER faible (&lt; 8x à 10x sur la BRVM) peut signaler une opportunité sous-évaluée. Comparez toujours 2 sociétés du <strong>même secteur</strong> (ex: SGBCI vs BOA).
                      </p>
                    </div>
                  </div>

                  {/* Facteur 3: Rendement du Dividende */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                        3
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        Revenu Cash Annuel
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Rendement du Dividende
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Indique le pourcentage net du prix investi restitué directement chaque année en argent comptant.
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                      <div className="font-extrabold text-emerald-700 dark:text-emerald-400">💡 Conseil d'analyse :</div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Sur la BRVM, un rendement &gt; 7 % à 9 % net est excellent pour générer un revenu passif régulier. Vérifiez que la société conserve assez de bénéfices pour réinvestir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Golden Rule Banner */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    <strong>Règle d'or pour bien choisir :</strong> L'action idéale réunit un <strong>BPA solide et croissant</strong>, un <strong>PER attractif</strong> par rapport à ses concurrents, et un <strong>Rendement de dividende soutenable</strong> versé chaque année.
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
