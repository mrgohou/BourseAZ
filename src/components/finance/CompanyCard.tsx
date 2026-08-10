import React from 'react';
import { Company } from '../../types';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { FreshnessBadge } from '../ui/FreshnessBadge';
import { TrendingUp, TrendingDown, Eye, BarChart2 } from 'lucide-react';

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
      className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-200/90 dark:border-emerald-900/60 shadow-xs p-5 sm:p-6 hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-slate-800 dark:to-slate-800/80 border border-emerald-300/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-900 dark:text-emerald-200 font-extrabold text-xs tracking-wider group-hover:from-emerald-600 group-hover:to-emerald-700 group-hover:text-white transition-all shrink-0 shadow-2xs">
              {company.symbol.substring(0, 4)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base line-clamp-1">
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
          <div className="mb-3 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-800 dark:text-amber-300">
            Donnée en attente de validation
          </div>
        )}

        {/* Price & Change Section */}
        <div className="my-3 p-3.5 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Valeur Actuelle</span>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {company.currentPrice > 0 ? formatFCFA(company.currentPrice) : 'Donnée indisponible'}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold border ${
                isPositive 
                  ? 'bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' 
                  : 'bg-rose-100/90 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {formatPercent(company.dayChangePercent)}
            </div>
          </div>

          {company.ipoPrice && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
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

        {/* Key Ratios Rectangles */}
        <div className="grid grid-cols-4 gap-1.5 my-3">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-center shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">PER</span>
            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
              {company.per !== undefined ? `${company.per}x` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-center shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">ROE</span>
            <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
              {company.roe !== undefined ? `${company.roe}%` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-center shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">PBR</span>
            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
              {company.pbr !== undefined ? `${company.pbr}x` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-center shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Rend.</span>
            <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
              {company.dividendYield !== undefined ? formatPercent(company.dividendYield, false) : '0%'}
            </span>
          </div>
        </div>

        {/* Source & Last Updated Metadata Footer */}
        <div className="mt-3 pt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
          <span className="truncate max-w-[150px]">Source: {company.source || 'BRVM'}</span>
          <span>Maj: {new Date(company.lastUpdated).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onSelect(company.symbol)}
          className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          Détails
        </button>

        {onCompare && (
          <button
            onClick={() => onCompare(company.symbol)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Comparer
          </button>
        )}
      </div>
    </div>
  );
};
