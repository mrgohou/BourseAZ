import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES } from '../../data/demo-data';
import { useMarketData } from '../../features/market/MarketContext';
import { Company, MarketPricePoint } from '../../types';
import { formatFCFA, formatPercent, formatDateShort } from '../../lib/formatters';
import { Button } from '../ui/Button';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Download,
  Info,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  Zap,
  BarChart2,
  Percent,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface StockPerformanceOverlayProps {
  initialSymbolA?: string;
  initialSymbolB?: string;
  onNavigate?: (path: string) => void;
}

type ComparisonMode = 'PERCENT' | 'PRICE_FCFA' | 'SPREAD';
type TimeFrame = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'MAX';

interface PredefinedDuel {
  id: string;
  label: string;
  category: string;
  symbolA: string;
  symbolB: string;
  description: string;
}

const PREDEFINED_DUELS: PredefinedDuel[] = [
  {
    id: 'telecoms',
    label: 'Sonatel vs Orange CI',
    category: '📱 Télécoms',
    symbolA: 'SNTS',
    symbolB: 'ORAC',
    description: 'Le choc des géants télécoms et mobile money de l\'UEMOA.',
  },
  {
    id: 'banking',
    label: 'SGBCI vs Ecobank CI',
    category: '🏦 Banques Leaders',
    symbolA: 'SGBC',
    symbolB: 'ECOC',
    description: 'Deux piliers majeurs du secteur bancaire ouest-africain.',
  },
  {
    id: 'energy',
    label: 'Total CI vs Vivo Energy',
    category: '⛽ Énergie & Pétrole',
    symbolA: 'TTLC',
    symbolB: 'SHEC',
    description: 'Duel de la distribution pétrolière et des stations-services.',
  },
  {
    id: 'utilities',
    label: 'CIE vs SODECI',
    category: '💡 Concessions Publiques',
    symbolA: 'CIEC',
    symbolB: 'SDCC',
    description: 'Les deux concessionnaires historiques électricité & eau.',
  },
  {
    id: 'agro',
    label: 'Palm CI vs SOGB',
    category: '🌾 Agro-Industrie',
    symbolA: 'PALC',
    symbolB: 'SOGC',
    description: 'Les champions de l\'huile de palme et du caoutchouc naturel.',
  },
  {
    id: 'trade',
    label: 'CFAO Motors vs Bernabé',
    category: '🚗 Distribution & BTP',
    symbolA: 'CFAC',
    symbolB: 'BNBC',
    description: 'Leaders de la distribution automobile et du matériel industriel.',
  },
];

export const StockPerformanceOverlay: React.FC<StockPerformanceOverlayProps> = ({
  initialSymbolA = 'SNTS',
  initialSymbolB = 'ORAC',
  onNavigate,
}) => {
  const [symbolA, setSymbolA] = useState<string>(initialSymbolA);
  const [symbolB, setSymbolB] = useState<string>(initialSymbolB);
  const [mode, setMode] = useState<ComparisonMode>('PERCENT');
  const [timeframe, setTimeframe] = useState<TimeFrame>('1Y');
  const [chartVisual, setChartVisual] = useState<'area' | 'line'>('area');
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  const { companies, historicalPrices: allHistoricalPrices } = useMarketData();

  // Retrieve company metadata with live daily quotes
  const companyA: Company = useMemo(() => {
    return (companies && companies.length > 0 ? companies : DEMO_COMPANIES).find(c => c.symbol === symbolA) || DEMO_COMPANIES[0];
  }, [symbolA, companies]);

  const companyB: Company = useMemo(() => {
    return (companies && companies.length > 0 ? companies : DEMO_COMPANIES).find(c => c.symbol === symbolB) || DEMO_COMPANIES[1] || DEMO_COMPANIES[0];
  }, [symbolB, companies]);

  // Swap companies A & B
  const handleSwap = () => {
    setSymbolA(symbolB);
    setSymbolB(symbolA);
  };

  // Raw price points with today's live daily point attached
  const rawPricesA = useMemo(() => allHistoricalPrices[symbolA] || DEMO_HISTORICAL_PRICES[symbolA] || [], [symbolA, allHistoricalPrices]);
  const rawPricesB = useMemo(() => allHistoricalPrices[symbolB] || DEMO_HISTORICAL_PRICES[symbolB] || [], [symbolB, allHistoricalPrices]);

  // Align dates and apply timeframe slice
  const { chartData, stats } = useMemo(() => {
    if (!rawPricesA.length || !rawPricesB.length) {
      return { chartData: [], stats: null };
    }

    // Determine points limit by timeframe
    let daysCount = 365;
    if (timeframe === '1M') daysCount = 30;
    else if (timeframe === '3M') daysCount = 90;
    else if (timeframe === '6M') daysCount = 180;
    else if (timeframe === '1Y') daysCount = 365;
    else if (timeframe === 'YTD') {
      const now = new Date();
      const jan1 = new Date(now.getFullYear(), 0, 1);
      const diffTime = Math.abs(now.getTime() - jan1.getTime());
      daysCount = Math.max(10, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else if (timeframe === 'MAX') {
      daysCount = Math.min(rawPricesA.length, rawPricesB.length);
    }

    const sliceA = rawPricesA.slice(-daysCount);
    const sliceB = rawPricesB.slice(-daysCount);
    const minLen = Math.min(sliceA.length, sliceB.length);

    if (minLen < 2) {
      return { chartData: [], stats: null };
    }

    const trimmedA = sliceA.slice(-minLen);
    const trimmedB = sliceB.slice(-minLen);

    const initialPriceA = trimmedA[0].close || 1;
    const initialPriceB = trimmedB[0].close || 1;

    const data: Array<{
      date: string;
      priceA: number;
      priceB: number;
      pctA: number;
      pctB: number;
      spread: number;
      spreadPositive: number | null;
      spreadNegative: number | null;
      volumeA: number;
      volumeB: number;
    }> = [];

    // Daily returns array for correlation and volatility
    const returnsA: number[] = [];
    const returnsB: number[] = [];

    let highestPriceA = -Infinity;
    let lowestPriceA = Infinity;
    let highestPriceB = -Infinity;
    let lowestPriceB = Infinity;

    for (let i = 0; i < minLen; i++) {
      const ptA = trimmedA[i];
      const ptB = trimmedB[i];

      const pA = ptA.close;
      const pB = ptB.close;

      if (pA > highestPriceA) highestPriceA = pA;
      if (pA < lowestPriceA) lowestPriceA = pA;
      if (pB > highestPriceB) highestPriceB = pB;
      if (pB < lowestPriceB) lowestPriceB = pB;

      if (i > 0) {
        const prevA = trimmedA[i - 1].close;
        const prevB = trimmedB[i - 1].close;
        returnsA.push((pA - prevA) / prevA);
        returnsB.push((pB - prevB) / prevB);
      }

      const pctA = ((pA - initialPriceA) / initialPriceA) * 100;
      const pctB = ((pB - initialPriceB) / initialPriceB) * 100;
      const spread = pctA - pctB;

      data.push({
        date: ptA.date,
        priceA: pA,
        priceB: pB,
        pctA: Number(pctA.toFixed(2)),
        pctB: Number(pctB.toFixed(2)),
        spread: Number(spread.toFixed(2)),
        spreadPositive: spread >= 0 ? Number(spread.toFixed(2)) : null,
        spreadNegative: spread < 0 ? Number(spread.toFixed(2)) : null,
        volumeA: ptA.volume || 0,
        volumeB: ptB.volume || 0,
      });
    }

    // Performance totals
    const finalPctA = data[data.length - 1].pctA;
    const finalPctB = data[data.length - 1].pctB;
    const finalSpread = finalPctA - finalPctB;
    const winnerSymbol = finalPctA >= finalPctB ? symbolA : symbolB;

    // Volatility calculation (annualized standard deviation of daily returns)
    const meanA = returnsA.reduce((sum, r) => sum + r, 0) / (returnsA.length || 1);
    const meanB = returnsB.reduce((sum, r) => sum + r, 0) / (returnsB.length || 1);

    const varianceA =
      returnsA.reduce((sum, r) => sum + Math.pow(r - meanA, 2), 0) / (returnsA.length - 1 || 1);
    const varianceB =
      returnsB.reduce((sum, r) => sum + Math.pow(r - meanB, 2), 0) / (returnsB.length - 1 || 1);

    const stdDevA = Math.sqrt(varianceA);
    const stdDevB = Math.sqrt(varianceB);

    const annualizedVolA = stdDevA * Math.sqrt(252) * 100;
    const annualizedVolB = stdDevB * Math.sqrt(252) * 100;

    // Pearson Correlation coefficient (r)
    let covariance = 0;
    for (let i = 0; i < returnsA.length; i++) {
      covariance += (returnsA[i] - meanA) * (returnsB[i] - meanB);
    }
    covariance = covariance / (returnsA.length - 1 || 1);

    const correlation =
      stdDevA > 0 && stdDevB > 0 ? covariance / (stdDevA * stdDevB) : 0;

    return {
      chartData: data,
      stats: {
        initialPriceA,
        initialPriceB,
        finalPriceA: trimmedA[trimmedA.length - 1].close,
        finalPriceB: trimmedB[trimmedB.length - 1].close,
        finalPctA,
        finalPctB,
        finalSpread,
        winnerSymbol,
        highestPriceA,
        lowestPriceA,
        highestPriceB,
        lowestPriceB,
        annualizedVolA,
        annualizedVolB,
        correlation: Number(correlation.toFixed(2)),
        pointsCount: minLen,
      },
    };
  }, [rawPricesA, rawPricesB, timeframe, symbolA, symbolB]);

  // Download CSV export
  const handleExportCSV = () => {
    if (!chartData.length) return;
    const header = `Date,${symbolA}_Prix_FCFA,${symbolB}_Prix_FCFA,${symbolA}_Perf_Pct,${symbolB}_Perf_Pct,Spread_Alpha_Pct\n`;
    const rows = chartData
      .map(
        d =>
          `${d.date},${d.priceA},${d.priceB},${d.pctA}%,${d.pctB}%,${d.spread}%`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `superposition_${symbolA}_vs_${symbolB}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color tokens
  const colorA = '#059669'; // Emerald BRVM
  const colorB = '#d97706'; // Amber / Gold BRVM

  // Custom rich tooltip
  const CustomOverlayTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const isALeading = dataPoint.pctA >= dataPoint.pctB;
      const absSpread = Math.abs(dataPoint.pctA - dataPoint.pctB).toFixed(2);

      return (
        <div className="bg-slate-950/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs space-y-3 min-w-[260px] animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-400">
              {new Date(dataPoint.date).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isALeading
                  ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-900/80 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isALeading ? `${symbolA} en tête` : `${symbolB} en tête`}
            </span>
          </div>

          {/* Action A */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="font-black text-white block">{symbolA}</span>
                <span className="text-[10px] text-slate-400">{companyA.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-white">
                {formatFCFA(dataPoint.priceA)}
              </div>
              <div
                className={`text-[11px] font-extrabold ${
                  dataPoint.pctA >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dataPoint.pctA >= 0 ? '+' : ''}
                {dataPoint.pctA.toFixed(2)} %
              </div>
            </div>
          </div>

          {/* Action B */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="font-black text-white block">{symbolB}</span>
                <span className="text-[10px] text-slate-400">{companyB.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-white">
                {formatFCFA(dataPoint.priceB)}
              </div>
              <div
                className={`text-[11px] font-extrabold ${
                  dataPoint.pctB >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {dataPoint.pctB >= 0 ? '+' : ''}
                {dataPoint.pctB.toFixed(2)} %
              </div>
            </div>
          </div>

          {/* Spread Callout */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] bg-slate-900/80 p-2 rounded-xl">
            <span className="text-slate-400 font-medium">Écart de performance :</span>
            <span
              className={`font-black ${
                isALeading ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              +{absSpread} pts ({isALeading ? symbolA : symbolB})
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Box with Interactive 1v1 Arena Selectors */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              SUPERPOSITION GRAPHIQUE 1 CONTRE 1
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Face-à-Face & Superposition de Performance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Superposez deux actions de la BRVM pour analyser leur dynamique de cours, mesurer l'alpha relatif et vérifier la corrélation historique.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* 2 Stock Selector Cards + Swap Button in the Center */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Card Action A */}
          <div className="md:col-span-5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400/80 dark:border-emerald-700 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                Action A (Titre Référence)
              </span>
              <span className="text-xs font-mono font-black text-emerald-900 dark:text-emerald-200">
                {formatFCFA(companyA.currentPrice)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                Sélectionner la première action :
              </label>
              <select
                value={symbolA}
                onChange={e => {
                  const val = e.target.value;
                  if (val === symbolB) handleSwap();
                  else setSymbolA(val);
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-600 rounded-xl font-bold text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
              >
                {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).map(comp => (
                  <option key={`a-${comp.symbol}`} value={comp.symbol}>
                    {comp.name} ({comp.symbol}) • {formatFCFA(comp.currentPrice)} ({comp.dayChangePercent >= 0 ? `+${comp.dayChangePercent}%` : `${comp.dayChangePercent}%`})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-300 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <span className="truncate max-w-[170px]">{companyA.sector}</span>
              <span
                className={`font-bold ${
                  companyA.dayChangePercent >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {companyA.dayChangePercent >= 0 ? '+' : ''}
                {companyA.dayChangePercent.toFixed(2)}% séance
              </span>
            </div>
          </div>

          {/* Swap Button (Center) */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              title="Inverser les deux actions sélectionnées (A ⇄ B)"
              className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all transform hover:rotate-180 active:scale-95 shadow-md border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <ArrowRightLeft className="w-5 h-5 text-slate-800 dark:text-white" />
            </button>
          </div>

          {/* Card Action B */}
          <div className="md:col-span-5 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-400/80 dark:border-amber-700 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                Action B (Titre Comparé)
              </span>
              <span className="text-xs font-mono font-black text-amber-900 dark:text-amber-200">
                {formatFCFA(companyB.currentPrice)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                Sélectionner la deuxième action :
              </label>
              <select
                value={symbolB}
                onChange={e => {
                  const val = e.target.value;
                  if (val === symbolA) handleSwap();
                  else setSymbolB(val);
                }}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600 rounded-xl font-bold text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
              >
                {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).map(comp => (
                  <option key={`b-${comp.symbol}`} value={comp.symbol}>
                    {comp.name} ({comp.symbol}) • {formatFCFA(comp.currentPrice)} ({comp.dayChangePercent >= 0 ? `+${comp.dayChangePercent}%` : `${comp.dayChangePercent}%`})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-300 border-t border-amber-200/60 dark:border-amber-800/60">
              <span className="truncate max-w-[170px]">{companyB.sector}</span>
              <span
                className={`font-bold ${
                  companyB.dayChangePercent >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {companyB.dayChangePercent >= 0 ? '+' : ''}
                {companyB.dayChangePercent.toFixed(2)}% séance
              </span>
            </div>
          </div>
        </div>

        {/* Quick Duel Presets Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Duels Populaires BRVM (1 clic) :
            </span>
            <span className="text-[10px] text-slate-400 italic hidden sm:inline">
              Sélectionnez un match sectoriel prédéfini
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PREDEFINED_DUELS.map(duel => {
              const isSelected =
                (symbolA === duel.symbolA && symbolB === duel.symbolB) ||
                (symbolA === duel.symbolB && symbolB === duel.symbolA);

              return (
                <button
                  key={duel.id}
                  type="button"
                  onClick={() => {
                    setSymbolA(duel.symbolA);
                    setSymbolB(duel.symbolB);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{duel.category}</span>
                  <span className="font-extrabold">{duel.symbolA} vs {duel.symbolB}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Chart Canvas Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Controls Bar: Mode & Timeframe */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-start">
            <button
              type="button"
              onClick={() => setMode('PERCENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'PERCENT'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Performance Relative (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('PRICE_FCFA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'PRICE_FCFA'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Cours en FCFA (Double Axe)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('SPREAD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'SPREAD'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Écart d'Alpha (A - B)</span>
            </button>
          </div>

          {/* Timeframe & Display Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              {(['1M', '3M', '6M', '1Y', 'YTD', 'MAX'] as TimeFrame[]).map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setChartVisual('area')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartVisual === 'area'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Aires
              </button>
              <button
                type="button"
                onClick={() => setChartVisual('line')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartVisual === 'line'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Lignes
              </button>
            </div>
          </div>
        </div>

        {/* Chart Legend & Summary Headline */}
        {stats && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block" />
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {companyA.name} ({symbolA}) :
                </span>
                <span
                  className={`font-black ${
                    stats.finalPctA >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
                  }`}
                >
                  {stats.finalPctA >= 0 ? '+' : ''}
                  {stats.finalPctA.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-600 inline-block" />
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {companyB.name} ({symbolB}) :
                </span>
                <span
                  className={`font-black ${
                    stats.finalPctB >= 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-600'
                  }`}
                >
                  {stats.finalPctB >= 0 ? '+' : ''}
                  {stats.finalPctB.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Surperformance nette :</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-black text-xs ${
                  stats.finalSpread >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                }`}
              >
                {stats.finalSpread >= 0
                  ? `+${stats.finalSpread.toFixed(2)} pts pour ${symbolA}`
                  : `+${Math.abs(stats.finalSpread).toFixed(2)} pts pour ${symbolB}`}
              </span>
            </div>
          </div>
        )}

        {/* The Graph Canvas */}
        <div className="h-80 sm:h-96 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'PERCENT' ? (
              chartVisual === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOverlayA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colorA} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colorA} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradOverlayB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colorB} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colorB} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#94a3b8"
                    strokeOpacity={0.4}
                  />
                  <YAxis
                    tickFormatter={val => `${val > 0 ? '+' : ''}${val}%`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    orientation="right"
                    stroke="#94a3b8"
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <RechartsTooltip content={<CustomOverlayTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="pctA"
                    name={`${symbolA} (${companyA.name})`}
                    stroke={colorA}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradOverlayA)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pctB"
                    name={`${symbolB} (${companyB.name})`}
                    stroke={colorB}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradOverlayB)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#94a3b8"
                    strokeOpacity={0.4}
                  />
                  <YAxis
                    tickFormatter={val => `${val > 0 ? '+' : ''}${val}%`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    orientation="right"
                    stroke="#94a3b8"
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <RechartsTooltip content={<CustomOverlayTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="pctA"
                    name={`${symbolA} (${companyA.name})`}
                    stroke={colorA}
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pctB"
                    name={`${symbolB} (${companyB.name})`}
                    stroke={colorB}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              )
            ) : mode === 'PRICE_FCFA' ? (
              /* Dual Y-Axis Chart for actual FCFA prices */
              <LineChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#94a3b8"
                  strokeOpacity={0.4}
                />
                {/* Left Y Axis for Action A */}
                <YAxis
                  yAxisId="left"
                  tickFormatter={val => `${val.toLocaleString()} F`}
                  tick={{ fontSize: 10, fill: colorA }}
                  orientation="left"
                  stroke={colorA}
                  strokeOpacity={0.8}
                />
                {/* Right Y Axis for Action B */}
                <YAxis
                  yAxisId="right"
                  tickFormatter={val => `${val.toLocaleString()} F`}
                  tick={{ fontSize: 10, fill: colorB }}
                  orientation="right"
                  stroke={colorB}
                  strokeOpacity={0.8}
                />
                <RechartsTooltip content={<CustomOverlayTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="priceA"
                  name={`${symbolA} (FCFA)`}
                  stroke={colorA}
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="priceB"
                  name={`${symbolB} (FCFA)`}
                  stroke={colorB}
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            ) : (
              /* Spread Mode: Alpha difference */
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSpread" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorA} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={colorB} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#94a3b8"
                  strokeOpacity={0.4}
                />
                <YAxis
                  tickFormatter={val => `${val > 0 ? '+' : ''}${val} pts`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  orientation="right"
                  stroke="#94a3b8"
                  strokeOpacity={0.4}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} label={{ value: 'Équilibre (0 pt)', fill: '#64748b', fontSize: 10 }} />
                <RechartsTooltip content={<CustomOverlayTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spread"
                  name={`Alpha (${symbolA} - ${symbolB})`}
                  stroke={colorA}
                  strokeWidth={2.5}
                  fill="url(#gradSpread)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Toggle Data Table */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showDataTable ? 'Masquer la série de données journalières' : 'Afficher la série de données journalières'}</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            {chartData.length} séances comparées ({timeframe})
          </span>
        </div>

        {/* Collapsible Data Table */}
        {showDataTable && (
          <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">{symbolA} (FCFA)</th>
                  <th className="p-2.5">{symbolB} (FCFA)</th>
                  <th className="p-2.5">Perf. {symbolA}</th>
                  <th className="p-2.5">Perf. {symbolB}</th>
                  <th className="p-2.5">Écart Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {chartData.slice().reverse().map(row => (
                  <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 font-mono text-slate-500">{row.date}</td>
                    <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">{formatFCFA(row.priceA)}</td>
                    <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-white">{formatFCFA(row.priceB)}</td>
                    <td className={`p-2.5 font-black ${row.pctA >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.pctA >= 0 ? '+' : ''}{row.pctA}%
                    </td>
                    <td className={`p-2.5 font-black ${row.pctB >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {row.pctB >= 0 ? '+' : ''}{row.pctB}%
                    </td>
                    <td className={`p-2.5 font-bold ${row.spread >= 0 ? 'text-emerald-700 font-black' : 'text-amber-700 font-black'}`}>
                      {row.spread >= 0 ? `+${row.spread} pts (${symbolA})` : `${row.spread} pts (${symbolB})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Deep Face-to-Face Metrics & Fundamentals Comparison Grid */}
      {stats && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Tableau de Bord Face-à-Face : {symbolA} vs {symbolB}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statistiques historiques calculées en direct sur la période ({timeframe}) et ratios financiers fondamentaux.
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Période : {timeframe}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Performance Rendement */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Performance Période</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{symbolA}</span>
                  <span className="font-black text-sm">
                    {stats.finalPctA >= 0 ? '+' : ''}{stats.finalPctA.toFixed(2)} %
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">{symbolB}</span>
                  <span className="font-black text-sm">
                    {stats.finalPctB >= 0 ? '+' : ''}{stats.finalPctB.toFixed(2)} %
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                Leader : <strong className="text-emerald-700 dark:text-emerald-400">{stats.winnerSymbol}</strong> (+{Math.abs(stats.finalSpread).toFixed(2)} pts)
              </div>
            </div>

            {/* Metric 2: Volatilité Annualisée (Risque) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Volatilité (Risque)</span>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{symbolA}</span>
                  <span className="font-mono font-bold text-xs">
                    {stats.annualizedVolA.toFixed(1)}% / an
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">{symbolB}</span>
                  <span className="font-mono font-bold text-xs">
                    {stats.annualizedVolB.toFixed(1)}% / an
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                Plus défensif : <strong>{stats.annualizedVolA <= stats.annualizedVolB ? symbolA : symbolB}</strong>
              </div>
            </div>

            {/* Metric 3: Corrélation Historique */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Corrélation (r)</span>
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {stats.correlation > 0 ? `+${stats.correlation}` : stats.correlation}
                </div>
                <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md inline-block">
                  {stats.correlation > 0.7
                    ? 'Forte corrélation'
                    : stats.correlation > 0.3
                    ? 'Corrélation modérée'
                    : 'Faible / Décorrélation'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                {stats.correlation > 0.6
                  ? 'Les 2 actions ont tendance à bouger dans le même sens.'
                  : 'Bonne complémentarité pour réduire le risque global du portefeuille.'}
              </p>
            </div>

            {/* Metric 4: Ratios de Valorisation PER & Rendement */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>PER & Rendement</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">PER {symbolA} / {symbolB} :</span>
                  <span className="font-mono font-bold">
                    {companyA.per ? `${companyA.per}x` : 'N/A'} vs {companyB.per ? `${companyB.per}x` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rdt Div. {symbolA} / {symbolB} :</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {companyA.dividendYield ? `${companyA.dividendYield}%` : 'N/A'} vs {companyB.dividendYield ? `${companyB.dividendYield}%` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-500">
                {companyA.dividendYield && companyB.dividendYield && (
                  <span>
                    Meilleur rendement : <strong>{companyA.dividendYield >= companyB.dividendYield ? symbolA : symbolB}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Automated Analytical Verdict */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white border border-emerald-700/60 shadow-md space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                VERDICT D'ARBITRAGE BOURSECLAIR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Sur la période sélectionnée ({timeframe}), <strong>{stats.winnerSymbol === symbolA ? companyA.name : companyB.name} ({stats.winnerSymbol})</strong> a dominé ce face-à-face avec une progression de{' '}
              <strong className="text-amber-300">
                {stats.winnerSymbol === symbolA ? `+${stats.finalPctA.toFixed(2)}%` : `+${stats.finalPctB.toFixed(2)}%`}
              </strong>{' '}
              contre{' '}
              <strong className="text-slate-300">
                {stats.winnerSymbol === symbolA ? `${stats.finalPctB.toFixed(2)}%` : `${stats.finalPctA.toFixed(2)}%`}
              </strong>{' '}
              pour son rival, soit une surperformance nette d'alpha de{' '}
              <strong className="text-emerald-400">+{Math.abs(stats.finalSpread).toFixed(2)} points</strong>.
              {stats.correlation < 0.5
                ? ' Grâce à leur corrélation modérée, détenir simultanément ces deux titres permet d\'optimiser la diversification de votre portefeuille.'
                : ' Les deux titres évoluant dans le même sens, privilégiez celui qui offre le meilleur couple PER / rendement de dividende selon votre stratégie.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onNavigate && (
                <>
                  <button
                    onClick={() => onNavigate(`/company/${symbolA}`)}
                    className="text-xs font-extrabold text-emerald-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Fiche détaillée {symbolA}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate(`/company/${symbolB}`)}
                    className="text-xs font-extrabold text-amber-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Fiche détaillée {symbolB}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate(`/simulation`)}
                    className="text-xs font-extrabold text-white bg-emerald-800/80 hover:bg-emerald-700 px-3 py-1 rounded-xl flex items-center gap-1 cursor-pointer ml-auto"
                  >
                    <span>Simuler un investissement DCA</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
