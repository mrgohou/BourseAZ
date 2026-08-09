import React, { useState, useEffect } from 'react';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES } from '../../data/demo-data';
import { ComparisonChart } from '../../components/charts/ComparisonChart';
import { DividendYieldComparer } from '../../components/finance/DividendYieldComparer';
import { Button } from '../../components/ui/Button';
import { SkeletonChart, SkeletonTable } from '../../components/ui/Skeleton';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { calculatePER, calculateROE, calculatePBR } from '../../lib/calculations';
import { BarChart2, Plus, X, Trophy, AlertTriangle, ArrowRight, RefreshCw, Coins, Layers } from 'lucide-react';

interface ComparisonPageProps {
  initialSymbol?: string;
  onNavigate: (path: string) => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ initialSymbol = 'SNTS', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DIVIDENDS'>('OVERVIEW');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([
    initialSymbol,
    initialSymbol === 'SLBC' ? 'SNTS' : 'SLBC',
  ]);
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 450);
  };

  const addCompany = (symbol: string) => {
    if (selectedSymbols.length < 3 && !selectedSymbols.includes(symbol)) {
      setLoading(true);
      setSelectedSymbols([...selectedSymbols, symbol]);
      setTimeout(() => setLoading(false), 300);
    }
  };

  const removeCompany = (symbol: string) => {
    if (selectedSymbols.length > 1) {
      setLoading(true);
      setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
      setTimeout(() => setLoading(false), 250);
    }
  };

  const companiesToCompare = selectedSymbols.map(sym => {
    const company = DEMO_COMPANIES.find(c => c.symbol === sym) || DEMO_COMPANIES[0];
    const prices = DEMO_HISTORICAL_PRICES[sym] || [];
    return {
      company,
      prices,
    };
  });

  // Calculate winner stock based on 1-year performance
  let winner = companiesToCompare[0];
  let maxChange = -999;

  companiesToCompare.forEach(item => {
    const prices = item.prices;
    if (prices.length > 1) {
      const first = prices[0].close;
      const last = prices[prices.length - 1].close;
      const change = ((last - first) / first) * 100;
      if (change > maxChange) {
        maxChange = change;
        winner = item;
      }
    }
  });

  const chartDataCompanies = companiesToCompare.map(item => ({
    symbol: item.company.symbol,
    name: item.company.name,
    prices: item.prices,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Comparateur d’Entreprises BRVM</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mettez en concurrence les actions de la BRVM pour comparer leur performance, valorisation et historique de dividendes.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="shrink-0 text-xs font-bold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Calcul...' : 'Rafraîchir la comparaison'}
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Comparateur Global & Ratios
        </button>

        <button
          onClick={() => setActiveTab('DIVIDENDS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'DIVIDENDS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Coins className="w-4 h-4" />
          Rendements & Dividendes Historiques
        </button>
      </div>

      {activeTab === 'DIVIDENDS' ? (
        <DividendYieldComparer onNavigate={onNavigate} />
      ) : (
        <>
          {/* Stock Selection Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
          Actions sélectionnées ({selectedSymbols.length} / 3)
        </label>

        <div className="flex flex-wrap items-center gap-3">
          {selectedSymbols.map(sym => {
            const comp = DEMO_COMPANIES.find(c => c.symbol === sym);
            return (
              <div
                key={sym}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-xl text-xs font-extrabold"
              >
                <span>{comp?.name} ({sym})</span>
                {selectedSymbols.length > 1 && (
                  <button
                    onClick={() => removeCompany(sym)}
                    className="p-0.5 text-blue-700 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {selectedSymbols.length < 3 && (
            <div className="relative">
              <select
                onChange={e => {
                  if (e.target.value) {
                    addCompany(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none border border-slate-200 cursor-pointer"
              >
                <option value="">+ Ajouter une action...</option>
                {DEMO_COMPANIES.filter(c => !selectedSymbols.includes(c.symbol)).map(c => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Winner Spotlight Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-amber-300 uppercase tracking-widest mb-1">
              Quelle action a le mieux progressé sur 1 an ?
            </div>
            <h2 className="text-2xl font-black">{winner.company.name} ({winner.company.symbol})</h2>
            <p className="text-xs text-slate-300 mt-1">
              Performance historique : <strong className="text-emerald-400 font-black">+{maxChange.toFixed(2)} %</strong> sur la période analysée.
            </p>
          </div>
        </div>

        <Button size="md" variant="secondary" onClick={() => onNavigate(`/company/${winner.company.symbol}`)}>
          Voir l'analyse détaillée <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Comparison Chart or Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonChart />
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <SkeletonTable rows={5} />
          </div>
        </div>
      ) : (
        <>
          {/* Comparison Chart */}
          <ComparisonChart companies={chartDataCompanies} />
        </>
      )}

      {/* Detailed Ratios Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Tableau de Comparaison des Ratios Financiers</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                <th className="p-4">Critère Financier</th>
                {companiesToCompare.map(item => (
                  <th key={item.company.symbol} className="p-4 text-slate-900 font-extrabold">
                    {item.company.name} ({item.company.symbol})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Cours Actuel</td>
                {companiesToCompare.map(item => (
                  <td key={item.company.symbol} className="p-4 font-extrabold text-slate-900">
                    {formatFCFA(item.company.currentPrice)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Coût Intrinsèque (Prix d'Entrée / IPO)</td>
                {companiesToCompare.map(item => (
                  <td key={item.company.symbol} className="p-4 font-bold text-indigo-900">
                    {item.company.ipoPrice ? `${formatFCFA(item.company.ipoPrice)} ${item.company.ipoDate ? `(${item.company.ipoDate})` : ''}` : '1 000 FCFA'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Plus-value depuis l'Entrée</td>
                {companiesToCompare.map(item => {
                  const ipo = item.company.ipoPrice || 1000;
                  const diff = item.company.currentPrice - ipo;
                  const pct = (diff / ipo) * 100;
                  return (
                    <td key={item.company.symbol} className="p-4 font-extrabold">
                      <span className={`px-2 py-1 rounded-md text-xs ${pct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {pct >= 0 ? '+' : ''}{pct.toFixed(0)} %
                      </span>
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">BPA (Bénéfice Par Action)</td>
                {companiesToCompare.map(item => (
                  <td key={item.company.symbol} className="p-4 font-bold">
                    {item.company.eps !== undefined ? `${item.company.eps} FCFA` : 'N/A'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">PER (Price Earning Ratio)</td>
                {companiesToCompare.map(item => {
                  const perCalc = calculatePER(item.company.currentPrice, item.company.eps);
                  return (
                    <td key={item.company.symbol} className="p-4">
                      {perCalc.status === 'VALID' ? (
                        <span className="font-extrabold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-2 py-1 rounded-md">
                          {perCalc.per}x
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded-md text-[11px] font-bold">
                          Non disp. ({perCalc.status})
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">ROE (Rentabilité Capitaux Propres)</td>
                {companiesToCompare.map(item => {
                  const roeCalc = calculateROE(item.company.roe);
                  return (
                    <td key={item.company.symbol} className="p-4">
                      {roeCalc.roe !== null ? (
                        <span className={`font-extrabold px-2 py-1 rounded-md ${
                          roeCalc.roe >= 18 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          roeCalc.roe >= 12 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          {roeCalc.roe}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">PBR (Price-to-Book Ratio)</td>
                {companiesToCompare.map(item => {
                  const pbrCalc = calculatePBR(item.company.currentPrice, item.company.bookValuePerShare, item.company.pbr);
                  return (
                    <td key={item.company.symbol} className="p-4">
                      {pbrCalc.pbr !== null ? (
                        <span className={`font-extrabold px-2 py-1 rounded-md ${
                          pbrCalc.pbr < 1.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          pbrCalc.pbr <= 2.0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {pbrCalc.pbr}x
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Dernier Dividende</td>
                {companiesToCompare.map(item => (
                  <td key={item.company.symbol} className="p-4 font-bold text-slate-900">
                    {item.company.lastDividend ? formatFCFA(item.company.lastDividend) : '0 FCFA'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Rendement du Dividende</td>
                {companiesToCompare.map(item => (
                  <td key={item.company.symbol} className="p-4 font-extrabold text-emerald-700">
                    {item.company.dividendYield ? formatPercent(item.company.dividendYield, false) : '0 %'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-bold text-slate-700 bg-slate-50/50">Phase de Cycle de Vie</td>
                {companiesToCompare.map(item => (
                  <td key={item.company.symbol} className="p-4 font-bold uppercase text-[11px]">
                    {item.company.lifecycle}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
