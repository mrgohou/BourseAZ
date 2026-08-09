import React from 'react';
import { Company } from '../../types';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { FreshnessBadge } from '../ui/FreshnessBadge';
import { TrendingUp, TrendingDown, ArrowRight, Calculator, BarChart2 } from 'lucide-react';

interface CompanyCardProps {
  company: Company;
  onSelect: (symbol: string) => void;
  onSimulate?: (symbol: string) => void;
  onCompare?: (symbol: string) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onSelect,
  onSimulate,
  onCompare,
}) => {
  const isPositive = company.dayChangePercent >= 0;

  return (
    <div
      onClick={() => onSelect(company.symbol)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-slate-200 font-extrabold text-xs tracking-wider group-hover:from-indigo-50 group-hover:to-blue-50 dark:group-hover:from-indigo-950 dark:group-hover:to-blue-950 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-all shrink-0 shadow-2xs">
              {company.symbol.substring(0, 4)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base line-clamp-1">
                {company.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-bold text-slate-700 dark:text-slate-300">{company.symbol}</span>
                <span>•</span>
                <span>{company.sector}</span>
              </div>
            </div>
          </div>
          <FreshnessBadge freshness={company.freshness} />
        </div>

        {/* Pending Review Banner if applicable */}
        {company.status === 'PENDING_REVIEW' && (
          <div className="mb-3 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300">
            Donnée en attente de validation
          </div>
        )}

        {/* Price & Change Section */}
        <div className="my-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Valeur Actuelle</span>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {company.currentPrice > 0 ? formatFCFA(company.currentPrice) : 'Donnée indisponible'}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                isPositive ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100/80 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {formatPercent(company.dayChangePercent)}
            </div>
          </div>

          {company.ipoPrice && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Coût Intrinsèque (Entrée Bourse{company.ipoDate ? ` ${company.ipoDate}` : ''}):
              </span>
              <div className="text-right">
                <span className="font-bold text-slate-700 dark:text-slate-200 mr-1.5">
                  {formatFCFA(company.ipoPrice)}
                </span>
                {company.currentPrice > 0 && (
                  <span className={`font-extrabold ${company.currentPrice >= company.ipoPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ({company.currentPrice >= company.ipoPrice ? '+' : ''}
                    {(((company.currentPrice - company.ipoPrice) / company.ipoPrice) * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ratios row */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold tracking-wider">PER</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              {company.per !== undefined ? `${company.per}x` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold tracking-wider">ROE</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
              {company.roe !== undefined ? `${company.roe}%` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold tracking-wider">PBR</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              {company.pbr !== undefined ? `${company.pbr}x` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Rend.</span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              {company.dividendYield !== undefined ? formatPercent(company.dividendYield, false) : '0%'}
            </span>
          </div>
        </div>

        {/* Source & Last Updated Metadata Footer */}
        <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between border-t border-slate-100/80 dark:border-slate-800/80">
          <span className="truncate max-w-[150px]">Source: {company.source || 'BRVM'}</span>
          <span>Maj: {new Date(company.lastUpdated).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
        {onSimulate && (
          <button
            onClick={() => onSimulate(company.symbol)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            Simuler
          </button>
        )}

        {onCompare && (
          <button
            onClick={() => onCompare(company.symbol)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Comparer
          </button>
        )}

        <button
          onClick={() => onSelect(company.symbol)}
          className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer"
        >
          Analyse <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
