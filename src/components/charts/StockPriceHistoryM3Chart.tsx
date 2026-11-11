import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
  Bar,
  ComposedChart,
} from 'recharts';
import { MarketPricePoint } from '../../types';
import { formatFCFA, formatDateShort } from '../../lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
  Eye,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';

export interface StockPriceHistoryM3ChartProps {
  data: MarketPricePoint[];
  companySymbol: string;
  companyName?: string;
  ipoPrice?: number;
  ipoDate?: string;
  className?: string;
}

export type TimeRange = '1S' | '1M' | '3M' | '6M' | '1A' | '3A' | 'MAX';

export const StockPriceHistoryM3Chart: React.FC<StockPriceHistoryM3ChartProps> = ({
  data,
  companySymbol,
  companyName,
  ipoPrice,
  ipoDate,
  className = '',
}) => {
  // M3 Interaction States
  const [range, setRange] = useState<TimeRange>('1A');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showHighLowBounds, setShowHighLowBounds] = useState<boolean>(false);
  const [showIPOReference, setShowIPOReference] = useState<boolean>(Boolean(ipoPrice && ipoPrice > 0));
  const [showVolume, setShowVolume] = useState<boolean>(false);

  // Filter points based on selected time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const pointsCountMap: Record<TimeRange, number> = {
      '1S': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1A': 365,
      '3A': 365 * 3,
      'MAX': data.length,
    };

    const count = pointsCountMap[range];
    const sliced = data.slice(-count);

    // Compute 20-day Simple Moving Average (SMA20) for overlay
    const windowSize = 20;
    return sliced.map((point, index, array) => {
      if (index < windowSize - 1) {
        return { ...point, sma20: undefined };
      }
      const windowSlice = array.slice(index - windowSize + 1, index + 1);
      const sum = windowSlice.reduce((acc, p) => acc + p.close, 0);
      const sma20 = Math.round(sum / windowSize);
      return { ...point, sma20 };
    });
  }, [data, range]);

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className={`p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2 ${className}`}>
        <Activity className="w-8 h-8 text-slate-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Historique des cours indisponible
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aucune cotation officielle enregistrée pour la valeur {companySymbol}.
        </p>
      </div>
    );
  }

  // Key metrics calculation for the period
  const prices = filteredData.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const firstPrice = filteredData[0]?.close || 1;
  const lastPrice = filteredData[filteredData.length - 1]?.close || 1;
  const priceDiff = lastPrice - firstPrice;
  const percentChange = firstPrice > 0 ? (priceDiff / firstPrice) * 100 : 0;
  const isPositive = priceDiff >= 0;

  // Total volume in the period
  const totalVolumeTraded = filteredData.reduce((acc, d) => acc + (d.volume || 0), 0);

  // M3 Custom Floating Elevated Tooltip
  const CustomM3Tooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MarketPricePoint & { sma20?: number };
      const pointDiff = point.close - firstPrice;
      const pointPct = firstPrice > 0 ? (pointDiff / firstPrice) * 100 : 0;

      return (
        <div className="bg-slate-950/95 dark:bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs space-y-2 min-w-[210px] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] text-slate-400 font-medium">
              {new Date(point.date).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              BRVM Officiel
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Cours de Clôture
            </span>
            <span className="text-lg font-black text-white font-mono tracking-tight">
              {formatFCFA(point.close)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Var. vs début :</span>
            <span className={`font-extrabold ${pointPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pointPct >= 0 ? '+' : ''}{pointPct.toFixed(2)}%
            </span>
          </div>

          {point.high && point.low && (
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span className="block text-slate-500">Plus Haut:</span>
                <span className="font-bold text-slate-200">{formatFCFA(point.high)}</span>
              </div>
              <div>
                <span className="block text-slate-500">Plus Bas:</span>
                <span className="font-bold text-slate-200">{formatFCFA(point.low)}</span>
              </div>
            </div>
          )}

          {point.sma20 && (
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80 text-amber-400">
              <span>Moyenne Mobile 20j :</span>
              <span className="font-bold font-mono">{formatFCFA(point.sma20)}</span>
            </div>
          )}

          {point.volume > 0 && (
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80 text-slate-300">
              <span>Volume Séance :</span>
              <span className="font-bold">{point.volume.toLocaleString('fr-FR')} titres</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6 ${className}`}
    >
      {/* 1. M3 Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 text-xs font-black uppercase tracking-wider border border-emerald-300/80 dark:border-emerald-700/80 shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cotation Officielle BRVM • Recharts M3</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Séance synchronisée
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            Évolution Historique du Cours • {companySymbol}
          </h3>

          {companyName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {companyName} • Marché d'Actions Régional UEMOA
            </p>
          )}
        </div>

        {/* 2. M3 Segmented Button Group (Horizon Temporel) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
            {(['1S', '1M', '3M', '6M', '1A', '3A', 'MAX'] as TimeRange[]).map((r) => {
              const isActive = range === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {r === '1A' ? '1 An' : r === '1S' ? '7J' : r}
                </button>
              );
            })}
          </div>

          {/* Mode Surface / Ligne toggle */}
          <button
            type="button"
            onClick={() => setChartType((t) => (t === 'area' ? 'line' : 'area'))}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer flex items-center gap-1.5"
            title="Basculer entre vue Surface ombrée et vue Ligne pure"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{chartType === 'area' ? 'Vue Ligne' : 'Vue Surface'}</span>
          </button>
        </div>
      </div>

      {/* 3. M3 Tonal Metric KPI Strip (4 Surface Containers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Dernier Cours */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Dernier Cours
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono">
            {formatFCFA(lastPrice)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Dernière clôture officielle
          </span>
        </div>

        {/* KPI 2: Variation sur la période */}
        <div
          className={`p-3.5 rounded-2xl border space-y-1 ${
            isPositive
              ? 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-300/80 dark:border-rose-800/80 text-rose-950 dark:text-rose-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
            Variation ({range})
          </span>
          <div className="text-lg sm:text-xl font-black flex items-center gap-1 font-mono">
            {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" /> : <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>
              {priceDiff >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] font-bold block truncate">
            {priceDiff >= 0 ? '+' : ''}{formatFCFA(priceDiff)}
          </span>
        </div>

        {/* KPI 3: Plus Haut */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Plus Haut ({range})
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatFCFA(maxPrice)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Sommet atteint sur l'horizon
          </span>
        </div>

        {/* KPI 4: Plus Bas */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Plus Bas ({range})
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatFCFA(minPrice)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Plancher sur l'horizon
          </span>
        </div>
      </div>

      {/* 4. M3 Filter Chips (Assist & Overlay Toggles) */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-[11px] font-bold">Indicateurs M3 :</span>

          {/* SMA 20 Chip */}
          <button
            type="button"
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              showSMA20
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showSMA20 ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span>Moyenne Mobile 20j (SMA)</span>
          </button>

          {/* High / Low Bounds Chip */}
          <button
            type="button"
            onClick={() => setShowHighLowBounds(!showHighLowBounds)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              showHighLowBounds
                ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showHighLowBounds ? 'bg-indigo-500' : 'bg-slate-400'}`} />
            <span>Niveaux Max / Min</span>
          </button>

          {/* IPO Reference Chip (if available) */}
          {ipoPrice && ipoPrice > 0 && (
            <button
              type="button"
              onClick={() => setShowIPOReference(!showIPOReference)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showIPOReference
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="Afficher la ligne de référence du prix d'introduction en bourse"
            >
              <span className={`w-2 h-2 rounded-full ${showIPOReference ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>Prix d'Entrée IPO ({formatFCFA(ipoPrice)})</span>
            </button>
          )}

          {/* Volume bars toggle */}
          {totalVolumeTraded > 0 && (
            <button
              type="button"
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                showVolume
                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Volume d'échanges</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          <span>{filteredData.length} séances analysées</span>
        </div>
      </div>

      {/* 5. Recharts Interactive Chart Area */}
      <div className="h-72 sm:h-84 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="m3PriceGradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                <stop offset="90%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="m3PriceGradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e11d48" stopOpacity={0.35} />
                <stop offset="90%" stopColor="#e11d48" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />

            <XAxis
              dataKey="date"
              tickFormatter={(dateStr) => formatDateShort(dateStr)}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              minTickGap={35}
            />

            <YAxis
              yAxisId="price"
              domain={['dataMin - 50', 'dataMax + 50']}
              tickFormatter={(val) => `${Math.round(val).toLocaleString('fr-FR')}`}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={65}
            />

            {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="left"
                domain={[0, 'dataMax * 3']}
                hide
              />
            )}

            <RechartsTooltip content={<CustomM3Tooltip />} />

            {/* Reference Line: Starting Baseline of Selected Period */}
            <ReferenceLine
              yAxisId="price"
              y={firstPrice}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              strokeWidth={1.5}
            />

            {/* Reference Line: Peak Max (if toggled) */}
            {showHighLowBounds && (
              <ReferenceLine
                yAxisId="price"
                y={maxPrice}
                stroke="#6366f1"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Max: ${formatFCFA(maxPrice)}`,
                  fill: '#6366f1',
                  fontSize: 10,
                  position: 'insideTopRight',
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Reference Line: Plancher Min (if toggled) */}
            {showHighLowBounds && (
              <ReferenceLine
                yAxisId="price"
                y={minPrice}
                stroke="#6366f1"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Min: ${formatFCFA(minPrice)}`,
                  fill: '#6366f1',
                  fontSize: 10,
                  position: 'insideBottomRight',
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Reference Line: IPO Price (if available & toggled) */}
            {showIPOReference && ipoPrice && ipoPrice > 0 && (
              <ReferenceLine
                yAxisId="price"
                y={ipoPrice}
                stroke="#10b981"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `IPO: ${formatFCFA(ipoPrice)}`,
                  fill: '#059669',
                  fontSize: 10,
                  position: 'insideTopLeft',
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Volume Bars (if toggled) */}
            {showVolume && (
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#38bdf8"
                opacity={0.3}
                radius={[4, 4, 0, 0]}
              />
            )}

            {/* Main Price Area or Line */}
            {chartType === 'area' ? (
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#059669' : '#e11d48'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={isPositive ? 'url(#m3PriceGradientGreen)' : 'url(#m3PriceGradientRed)'}
                activeDot={{
                  r: 6,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  fill: isPositive ? '#059669' : '#e11d48',
                }}
                name="Cours Clôture"
              />
            ) : (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#059669' : '#e11d48'}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  fill: isPositive ? '#059669' : '#e11d48',
                }}
                name="Cours Clôture"
              />
            )}

            {/* SMA 20 Overlay (if toggled) */}
            {showSMA20 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Moyenne Mobile 20j"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 6. M3 Information & Guidance Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            Données officielles de négociation BRVM. Les cours sont ajustés des opérations sur titres (OST).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Période active : <strong>{range === '1A' ? '12 Derniers Mois' : range}</strong></span>
          <span>•</span>
          <span className="font-mono">{formatFCFA(firstPrice)} → {formatFCFA(lastPrice)}</span>
        </div>
      </div>
    </div>
  );
};
