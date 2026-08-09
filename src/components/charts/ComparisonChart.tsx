import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts';
import { MarketPricePoint } from '../../types';
import { formatDateShort } from '../../lib/formatters';

interface ComparisonChartProps {
  companies: { symbol: string; name: string; prices: MarketPricePoint[] }[];
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  // Normalize prices to 100% index at start date for fair comparison
  const colors = ['#1d4ed8', '#059669', '#d97706', '#9333ea'];

  // Take common dates
  const minPointsCount = Math.min(...companies.map(c => c.prices.length));
  if (minPointsCount === 0) return null;

  const chartData = [];
  for (let i = 0; i < minPointsCount; i += 5) { // sample every 5 days for smoother line
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Comparaison de Performance Relatives (%)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Évolution en % normalisé à 0% à la date de départ
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={val => `${val}%`} tick={{ fontSize: 10 }} orientation="right" />
            <RechartsTooltip
              formatter={(value: any, name: any) => [`${value} %`, name]}
              labelFormatter={label => `Date: ${formatDateShort(label as string)}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px', pt: '10px' }} />
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
