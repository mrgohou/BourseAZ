import React from 'react';
import { Tooltip } from '../ui/Tooltip';

interface FinancialMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  tooltipText: string;
  badge?: string;
  variant?: 'default' | 'highlight' | 'warning' | 'negative';
  onClickHelp?: () => void;
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  label,
  value,
  subValue,
  tooltipText,
  badge,
  variant = 'default',
  onClickHelp,
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-100 text-slate-900',
    highlight: 'bg-indigo-50/50 border-indigo-200/80 text-indigo-900',
    warning: 'bg-amber-50/60 border-amber-200/80 text-amber-900',
    negative: 'bg-rose-50/60 border-rose-200/80 text-rose-900',
  };

  return (
    <div className={`p-6 rounded-2xl sm:rounded-3xl border ${variantStyles[variant]} shadow-sm relative transition-all`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
          <Tooltip content={tooltipText} />
        </div>
        {badge && (
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">{value}</span>
        {onClickHelp && (
          <button
            onClick={onClickHelp}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Explications
          </button>
        )}
      </div>

      {subValue && <div className="text-xs text-slate-500 mt-1.5 font-medium">{subValue}</div>}
    </div>
  );
};
