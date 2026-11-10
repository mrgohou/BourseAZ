import React from 'react';
import { Company } from '../../types';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { FreshnessBadge } from '../ui/FreshnessBadge';
import { TrendingUp, TrendingDown, Eye, BarChart2, FileText } from 'lucide-react';

interface CompanyCardProps {
  company: Company;
  onSelect: (symbol: string) => void;
  onSimulate?: (symbol: string) => void;
  onCompare?: (symbol: string) => void;
  onViewReports?: (company: Company) => void;
  isDark?: boolean;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onSelect,
  onSimulate,
  onCompare,
  onViewReports,
  isDark = false,
}) => {
  const isPositive = company.dayChangePercent >= 0;

  return (
    <div
      onClick={() => onSelect(company.symbol)}
      className={`${
        isDark
          ? 'bg-slate-800/95 text-white border-slate-700/80 hover:border-emerald-500/80 shadow-md'
          : 'bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 shadow-xs'
      } rounded-3xl border hover:shadow-md p-5 sm:p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'} group-hover:text-emerald-400 transition-colors text-base line-clamp-1`}>
              {company.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="font-extrabold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-800/50">
                {company.symbol}
              </span>
              <span>•</span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}>{company.sector}</span>
            </div>
          </div>
          <FreshnessBadge freshness={company.freshness} />
        </div>

        {/* Pending Review Banner if applicable */}
        {company.status === 'PENDING_REVIEW' && (
          <div className="mb-3 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700 text-[11px] font-bold text-amber-300">
            Donnée en attente de validation
          </div>
        )}

        {/* Price & Change Section */}
        <div className={`my-3 p-4 ${isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60'} rounded-2xl border space-y-2`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Valeur Actuelle</span>
              <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'} tracking-tight`}>
                {company.currentPrice > 0 ? formatFCFA(company.currentPrice) : 'Donnée indisponible'}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border-0 ${
                isPositive 
                  ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-800/60' 
                  : 'bg-rose-950/90 text-rose-200 border border-rose-800/60'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {formatPercent(company.dayChangePercent)}
            </div>
          </div>

          {company.ipoPrice && (
            <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200/80 dark:border-slate-700/80'} flex items-center justify-between text-[11px]`}>
              <span className="text-slate-400 font-medium">
                Coût Intrinsèque (Entrée Bourse{company.ipoDate ? ` ${company.ipoDate}` : ''}):
              </span>
              <div className="text-right">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'} mr-1.5`}>
                  {formatFCFA(company.ipoPrice)}
                </span>
                {company.currentPrice > 0 && (
                  <span className={`font-extrabold ${company.currentPrice >= company.ipoPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
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
          <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-900/80' : 'bg-slate-100/60 dark:bg-slate-800/80'} text-center`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PER</span>
            <span className={`font-extrabold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
              {company.per !== undefined ? `${company.per}x` : 'N/A'}
            </span>
          </div>
          <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-900/80' : 'bg-slate-100/60 dark:bg-slate-800/80'} text-center`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ROE</span>
            <span className="font-extrabold text-xs text-emerald-400">
              {company.roe !== undefined ? `${company.roe}%` : 'N/A'}
            </span>
          </div>
          <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-900/80' : 'bg-slate-100/60 dark:bg-slate-800/80'} text-center`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PBR</span>
            <span className={`font-extrabold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
              {company.pbr !== undefined ? `${company.pbr}x` : 'N/A'}
            </span>
          </div>
          <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-900/80' : 'bg-slate-100/60 dark:bg-slate-800/80'} text-center`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rend.</span>
            <span className="font-extrabold text-xs text-emerald-400">
              {company.dividendYield !== undefined ? formatPercent(company.dividendYield, false) : '0%'}
            </span>
          </div>
        </div>

        {/* Source & Last Updated Metadata Footer */}
        <div className={`mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t ${isDark ? 'border-slate-800' : 'border-slate-200/80 dark:border-slate-800'}`}>
          <span className="truncate max-w-[150px]">Source: {company.source || 'BRVM'}</span>
          <span>Maj: {new Date(company.lastUpdated).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200/80 dark:border-slate-800'} flex flex-col gap-2`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(company.symbol)}
            className={`flex-1 px-4 py-2 rounded-full ${
              isDark
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
                : 'bg-emerald-100 dark:bg-emerald-950/90 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
            } text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
          >
            <Eye className="w-3.5 h-3.5" />
            Détails
          </button>

          {onCompare && (
            <button
              onClick={() => onCompare(company.symbol)}
              className={`flex-1 px-4 py-2 rounded-full ${
                isDark
                  ? 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              } text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Comparer
            </button>
          )}
        </div>

        {/* Official Reports Button */}
        <button
          onClick={() => {
            if (onViewReports) {
              onViewReports(company);
            } else {
              window.open('https://www.brvm.org/fr/rapports-societes-cotees', '_blank');
            }
          }}
          title={`Consulter les rapports d'activités officiels de ${company.symbol}`}
          className="w-full px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-orange-500 text-sky-800 dark:text-sky-200 hover:text-white dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs border border-sky-400/40 hover:border-orange-500"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Rapports d'activités</span>
        </button>
      </div>
    </div>
  );
};
