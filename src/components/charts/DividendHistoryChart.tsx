import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { DividendHistory } from '../../types';
import { formatFCFA } from '../../lib/formatters';

interface DividendHistoryChartProps {
  dividends: DividendHistory[];
}

export const DividendHistoryChart: React.FC<DividendHistoryChartProps> = ({ dividends }) => {
  if (!dividends || dividends.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
        Aucun historique de dividende enregistré
      </div>
    );
  }

  const data = [...dividends].reverse().map(d => ({
    year: d.exDate.substring(0, 4),
    amount: d.amount,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
        Historique des Dividendes par Action (FCFA)
      </h3>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={val => `${val} F`} tick={{ fontSize: 10 }} orientation="right" />
            <RechartsTooltip formatter={(val: any) => [formatFCFA(val as number), 'Dividende']} />
            <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
