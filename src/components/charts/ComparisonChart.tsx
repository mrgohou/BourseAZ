import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { MarketPricePoint } from '../../types';
import { formatDateShort } from '../../lib/formatters';

interface ComparisonChartProps {
  companies: { symbol: string; name: string; prices: MarketPricePoint[] }[];
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  // Normalized colors: Emerald, Amber, Royal Blue, Purple
  const colors = ['#059669', '#d97706', '#2563eb', '#9333ea'];

  // Take common dates
  const minPointsCount = Math.min(...companies.map(c => c.prices.length));
  if (minPointsCount === 0) return null;

  const chartData = [];
  for (let i = 0; i < minPointsCount; i += 3) {
    const point: Record<string, any> = {
      date: companies[0].prices[i]?.date || '',
    };

    companies.forEach((comp) => {
      const initialPrice = comp.prices[0]?.close || 1;
      const currentPrice = comp.prices[i]?.close || initialPrice;
      const pctChange = ((currentPrice - initialPrice) / initialPrice) * 100;
      point[comp.symbol] = Number(pctChange.toFixed(2));
    });

    chartData.push(point);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Comparaison des Performances Relatives (%)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Évolution normalisée à 0% à la date de départ pour évaluer le gain en capital de chaque société cotée
          </p>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
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
            <RechartsTooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#334155',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
              }}
              formatter={(value: any, name: any) => [`${value} %`, name]}
              labelFormatter={label => `Date : ${formatDateShort(label as string)}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            {companies.map((comp, index) => (
              <Line
                key={comp.symbol}
                type="monotone"
                dataKey={comp.symbol}
                name={`${comp.symbol} (${comp.name})`}
                stroke={colors[index % colors.length]}
                strokeWidth={2.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

