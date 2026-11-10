import React, { useState } from 'react';
import {
  BackendMarketAnalysisReport,
  BackendSyncService,
} from '../../services/market-data/backendSyncService';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Zap,
  Coins,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  PieChart,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

interface MarketAnalysis15MinViewProps {
  report: BackendMarketAnalysisReport | null;
  onRefreshReport: () => Promise<void>;
  onSelectCompany?: (symbol: string) => void;
}

export const MarketAnalysis15MinView: React.FC<MarketAnalysis15MinViewProps> = ({
  report,
  onRefreshReport,
  onSelectCompany,
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleManualRun = async () => {
    setIsRunning(true);
    try {
      await BackendSyncService.runAnalysis();
      await onRefreshReport();
    } finally {
      setIsRunning(false);
    }
  };

  if (!report) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Analyse des cours en préparation
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Le module d'analyse backend 15 minutes recueille les cours et variations de la séance.
          </p>
        </div>
        <button
          onClick={handleManualRun}
          disabled={isRunning}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Calculer l'analyse maintenant</span>
        </button>
      </div>
    );
  }

  const sentiment = report.sentiment;
  const formattedTime = new Date(report.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getSentimentBadge = (state: string) => {
    switch (state) {
      case 'HAUSSIER':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700',
          text: 'text-emerald-800 dark:text-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Marché Haussier',
        };
      case 'PRUDENCE':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
          text: 'text-amber-800 dark:text-amber-300',
          dot: 'bg-amber-500',
          label: 'Marché Prudent / Consolidation',
        };
      case 'VOLATILE':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700',
          text: 'text-rose-800 dark:text-rose-300',
          dot: 'bg-rose-500',
          label: 'Volatilité Accrue',
        };
      default:
        return {
          bg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700',
          text: 'text-indigo-800 dark:text-indigo-300',
          dot: 'bg-indigo-500',
          label: 'Marché Neutre & Équilibré',
        };
    }
  };

  const badge = getSentimentBadge(sentiment.state);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Frequency & Execution Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            15m
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                Module d'Analyse Automatique des Cours
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                Cycle 15 min
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dernière analyse : <strong>{formattedTime}</strong> • {report.totalSecuritiesAnalyzed} valeurs analysées en {report.durationMs}ms
            </p>
          </div>
        </div>

        <button
          onClick={handleManualRun}
          disabled={isRunning}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Calcul en cours...' : 'Réanalyser'}</span>
        </button>
      </div>

      {/* Row 1: Market Sentiment & Breadth Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
              {badge.label}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {sentiment.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a
              href="https://www.richbourse.com/common/variation/index"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Source : RichBourse</span>
            </a>
            <span>•</span>
            <div>
              Variation moyenne :{' '}
              <span className={`font-black ${sentiment.averageVariationPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {sentiment.averageVariationPercent >= 0 ? '+' : ''}
                {sentiment.averageVariationPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Market Breadth Bars */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Hausses ({sentiment.advancesCount})
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {Math.round((sentiment.advancesCount / (report.totalSecuritiesAnalyzed || 1)) * 100)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Inchangées ({sentiment.unchangedCount})
            </span>
            <span className="text-lg font-black text-slate-700 dark:text-slate-300">
              {Math.round((sentiment.unchangedCount / (report.totalSecuritiesAnalyzed || 1)) * 100)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
              Baisses ({sentiment.declinesCount})
            </span>
            <span className="text-lg font-black text-rose-700 dark:text-rose-400">
              {Math.round((sentiment.declinesCount / (report.totalSecuritiesAnalyzed || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* RichBourse Session Liquidity Breakdown */}
      {report.sessionLiquidity && report.sessionLiquidity.totalValueFcfa > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Flux de Capitaux & Liquidité RichBourse
              </h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              https://www.richbourse.com/common/variation/index
            </span>
          </div>

          {/* Aggregate metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Capitaux Négociés (Séance)
              </span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                {report.sessionLiquidity.totalValueFcfa.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {(report.sessionLiquidity.totalValueFcfa / 1_000_000_000).toFixed(2)} Milliards FCFA
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Volume Global de Titres
              </span>
              <span className="text-base font-black text-indigo-700 dark:text-indigo-400">
                {report.sessionLiquidity.totalVolume.toLocaleString('fr-FR')} titres
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Transactions de clôture
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                Capitalisation Totale
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {(report.sessionLiquidity.totalMarketCapFcfa / 1_000_000_000_000).toFixed(2)} Billions FCFA
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Cote globale BRVM
              </span>
            </div>
          </div>

          {/* Top Traded Stocks by Value */}
          {report.sessionLiquidity.mostActiveByValue.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Concentration des Capitaux (Top valeurs négociées)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {report.sessionLiquidity.mostActiveByValue.slice(0, 4).map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectCompany?.(item.symbol)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 dark:text-white">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {item.valuePercent.toFixed(1)}% du marché
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {item.name}
                    </span>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {(item.valueFcfa / 1_000_000).toFixed(1)}M FCFA
                      </span>
                      <span className={`text-[10px] font-black ${item.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Key Algorithmic Insights (Pedagogical French) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Synthèse Pédagogique des 15 Dernières Minutes
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.keyInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Grid of Opportunities & Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Undervalued Picks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Opportunités de Valorisation (P/E Attractif)
              </h4>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full">
              P/E &lt; 10x
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {report.undervaluedPicks.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectCompany?.(stock.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-black text-slate-900 dark:text-white mr-1.5">{stock.symbol}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{stock.name}</span>
                  <span className="block text-[10px] text-slate-400">{stock.analysisNote}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 block">
                    PER: {stock.peRatio.toFixed(1)}x
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    Rdt: {stock.dividendYield.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Dividend Champions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Champions du Rendement Dividendes
              </h4>
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
              &gt; 6.5% / an
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {report.highDividendChampions.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectCompany?.(stock.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div>
                  <span className="font-black text-slate-900 dark:text-white mr-1.5">{stock.symbol}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{stock.name}</span>
                  <span className="block text-[10px] text-slate-400">{stock.price.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-amber-700 dark:text-amber-400 block">
                    {stock.dividendYield.toFixed(2)}% / an
                  </span>
                  <span className={`text-[10px] font-bold ${stock.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Sector Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Dynamique par Secteur d'Activité
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {report.sectorPerformance.map((sec) => (
            <div
              key={sec.sector}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate" title={sec.sector}>
                  {sec.sector}
                </span>
                <span
                  className={`text-[11px] font-black ${
                    sec.averageChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {sec.averageChangePercent >= 0 ? '+' : ''}{sec.averageChangePercent}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {sec.leadersCount} titre(s) en progression
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
