import React, { useState } from 'react';
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
} from 'recharts';
import { MarketPricePoint } from '../../types';
import { formatFCFA, formatDateShort } from '../../lib/formatters';
import { TrendingUp, TrendingDown, Calendar, Maximize2, Sparkles, Activity } from 'lucide-react';

interface PriceHistoryChartProps {
  data: MarketPricePoint[];
  companySymbol: string;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y';

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, companySymbol }) => {
  const [range, setRange] = useState<TimeRange>('1Y');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  // Filter points based on selected time range
  const filterData = (): MarketPricePoint[] => {
    if (!data || data.length === 0) return [];
    const pointsCountMap: Record<TimeRange, number> = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '3Y': 365 * 3,
    };
    const count = pointsCountMap[range];
    return data.slice(-count);
  };

  const filteredData = filterData();

  if (filteredData.length === 0) {
    return (
      <div className="h-64 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold text-slate-500">Historique des cours indisponible</p>
        <p className="text-xs text-slate-400 mt-1">Aucune donnée de prix enregistrée pour {companySymbol}</p>
      </div>
    );
  }

  const prices = filteredData.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const firstPrice = filteredData[0]?.close || 1;
  const lastPrice = filteredData[filteredData.length - 1]?.close || 1;
  const priceDiff = lastPrice - firstPrice;
  const percentChange = (priceDiff / firstPrice) * 100;
  const isPositive = priceDiff >= 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as MarketPricePoint;
      const pointDiff = point.close - firstPrice;
      const pointPct = (pointDiff / firstPrice) * 100;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            {new Date(point.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="text-base font-black text-white">
            {formatFCFA(point.close)}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={pointPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {pointPct >= 0 ? '+' : ''}{pointPct.toFixed(2)}%
            </span>
            <span className="text-slate-400">vs début de période</span>
          </div>
          {point.high && point.low && (
            <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between gap-3">
              <span>Haut: {formatFCFA(point.high)}</span>
              <span>Bas: {formatFCFA(point.low)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
      {/* Chart Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" />
            Graphique Interactif des 12 Derniers Mois (BRVM)
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Évolution du cours • {companySymbol}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Dernier cours : <strong className="text-slate-900 dark:text-white font-extrabold text-sm">{formatFCFA(lastPrice)}</strong></span>
            <span>•</span>
            <span className={`inline-flex items-center gap-1 font-extrabold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {priceDiff >= 0 ? '+' : ''}{formatFCFA(priceDiff)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Range & Style Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold shadow-inner">
            {(['1M', '3M', '6M', '1Y', '3Y'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  range === r
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === '1Y' ? '12 Mois' : r}
              </button>
            ))}
          </div>

          {/* Type Toggle */}
          <button
            onClick={() => setChartType(t => t === 'area' ? 'line' : 'area')}
            className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {chartType === 'area' ? 'Vue Ligne' : 'Vue Surface'}
          </button>
        </div>
      </div>

      {/* Mini Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Plus Bas ({range})</span>
          <span className="font-black text-slate-800 dark:text-slate-200">{formatFCFA(minPrice)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Plus Haut ({range})</span>
          <span className="font-black text-slate-800 dark:text-slate-200">{formatFCFA(maxPrice)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Cours de Début</span>
          <span className="font-black text-slate-800 dark:text-slate-200">{formatFCFA(firstPrice)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Tendance</span>
          <span className={`font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositive ? '📈 Haussière' : '📉 Baissière'}
          </span>
        </div>
      </div>

      {/* Recharts Interactive Chart */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradientGreenInteractive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="priceGradientRedInteractive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={dateStr => formatDateShort(dateStr)}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={val => `${Math.round(val)}`}
              tick={{ fontSize: 10, fill: '#64748b' }}
              orientation="right"
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <ReferenceLine y={firstPrice} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.6} />
            {chartType === 'area' ? (
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#059669' : '#e11d48'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={isPositive ? 'url(#priceGradientGreenInteractive)' : 'url(#priceGradientRedInteractive)'}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: isPositive ? '#059669' : '#e11d48' }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#059669' : '#e11d48'}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: isPositive ? '#059669' : '#e11d48' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Survolez ou cliquez sur les points pour afficher le détail du cours journalier BRVM.</span>
        <span>Période : {range === '1Y' ? '12 Derniers Mois' : range}</span>
      </div>
    </div>
  );
};
