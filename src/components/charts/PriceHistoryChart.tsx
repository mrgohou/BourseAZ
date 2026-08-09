import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { MarketPricePoint } from '../../types';
import { formatFCFA, formatDateShort } from '../../lib/formatters';

interface PriceHistoryChartProps {
  data: MarketPricePoint[];
  companySymbol: string;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y';

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, companySymbol }) => {
  const [range, setRange] = useState<TimeRange>('1Y');

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
      <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold text-slate-500">Historique des cours indisponible</p>
        <p className="text-xs text-slate-400 mt-1">Aucune donnée de prix enregistrée pour {companySymbol}</p>
      </div>
    );
  }

  const minPrice = Math.min(...filteredData.map(d => d.close));
  const maxPrice = Math.max(...filteredData.map(d => d.close));
  const firstPrice = filteredData[0]?.close || 1;
  const lastPrice = filteredData[filteredData.length - 1]?.close || 1;
  const priceDiff = lastPrice - firstPrice;
  const isPositive = priceDiff >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      {/* Chart Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Évolution du cours ({companySymbol})</h3>
          <div className="text-xs text-slate-500 mt-0.5">
            Dernier cours : <span className="font-extrabold text-slate-900">{formatFCFA(lastPrice)}</span>
            <span className={`ml-2 font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {priceDiff >= 0 ? '+' : ''}{formatFCFA(priceDiff)} ({((priceDiff / firstPrice) * 100).toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Range Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold self-start sm:self-auto">
          {(['1M', '3M', '6M', '1Y', '3Y'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                range === r ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="priceGradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={[Math.floor(minPrice * 0.98), Math.ceil(maxPrice * 1.02)]}
              tickFormatter={val => `${val}`}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              orientation="right"
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as MarketPricePoint;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                      <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-300">
                        {formatDateShort(pt.date)}
                      </div>
                      <div className="space-y-0.5">
                        <div>Clôture : <span className="font-extrabold text-white">{formatFCFA(pt.close)}</span></div>
                        <div className="text-[10px] text-slate-400">Plus haut: {formatFCFA(pt.high)} | Plus bas: {formatFCFA(pt.low)}</div>
                        <div className="text-[10px] text-slate-400">Volume: {pt.volume.toLocaleString()} titres</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? '#059669' : '#e11d48'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={isPositive ? 'url(#priceGradientGreen)' : 'url(#priceGradientRed)'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
