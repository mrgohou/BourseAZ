import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DividendHistory, Company } from '../../types';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import {
  Coins,
  TrendingUp,
  Calculator,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface DividendProjectionModuleProps {
  company: Company;
  dividendHistory: DividendHistory[];
  onNavigate?: (path: string) => void;
}

export const DividendProjectionModule: React.FC<DividendProjectionModuleProps> = ({
  company,
  dividendHistory,
  onNavigate,
}) => {
  const [sharesCount, setSharesCount] = useState<number>(50);
  const [reinvestDividends, setReinvestDividends] = useState<boolean>(true);
  const [growthAssumption, setGrowthAssumption] = useState<number>(5); // 5% annual dividend growth
  const [projectionYears, setProjectionYears] = useState<number>(5); // 5 years

  // Calculate historic metrics
  const sortedHistory = useMemo(() => {
    return [...(dividendHistory || [])].sort((a, b) => a.exDate.localeCompare(b.exDate));
  }, [dividendHistory]);

  const latestDividend = company.lastDividend || (sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].amount : 1000);
  const currentStockPrice = company.currentPrice > 0 ? company.currentPrice : 10000;
  const currentTotalInvestment = sharesCount * currentStockPrice;

  // Average historic CAGR of dividends
  const historicCAGR = useMemo(() => {
    if (sortedHistory.length < 2) return 5;
    const first = sortedHistory[0].amount;
    const last = sortedHistory[sortedHistory.length - 1].amount;
    const years = sortedHistory.length - 1;
    if (first <= 0 || years <= 0) return 5;
    const cagr = (Math.pow(last / first, 1 / years) - 1) * 100;
    return Math.min(Math.max(Number(cagr.toFixed(1)), -5), 25);
  }, [sortedHistory]);

  // Generate 5-year projections based on parameters
  const projections = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = [];
    let accumulatedShares = sharesCount;
    let totalDividendsReceived = 0;

    for (let i = 1; i <= projectionYears; i++) {
      const year = currentYear + i;
      const estimatedDivPerShare = Math.round(latestDividend * Math.pow(1 + growthAssumption / 100, i));
      const annualDividend = Math.round(accumulatedShares * estimatedDivPerShare);
      totalDividendsReceived += annualDividend;

      if (reinvestDividends) {
        // Reinvest dividends into more shares (assuming stock price grows at 4% per year)
        const projectedPrice = currentStockPrice * Math.pow(1.04, i);
        const newShares = Math.floor(annualDividend / projectedPrice);
        accumulatedShares += newShares;
      }

      const projectedPortfolioValue = Math.round(accumulatedShares * (currentStockPrice * Math.pow(1.04, i)));

      data.push({
        year: `${year}`,
        dividendPerShare: estimatedDivPerShare,
        annualIncome: annualDividend,
        totalDividendsAccumulated: totalDividendsReceived,
        portfolioValue: projectedPortfolioValue,
        sharesCount: accumulatedShares,
      });
    }

    return data;
  }, [sharesCount, latestDividend, growthAssumption, projectionYears, reinvestDividends, currentStockPrice]);

  const totalDividendsProjected = projections.length > 0 ? projections[projections.length - 1].totalDividendsAccumulated : 0;
  const finalYearIncome = projections.length > 0 ? projections[projections.length - 1].annualIncome : 0;
  const yieldOnCost = currentTotalInvestment > 0 ? ((finalYearIncome / currentTotalInvestment) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2">
            <Coins className="w-3.5 h-3.5" />
            Module de Projection des Dividendes
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Simulez vos Rentes Futures • {company.symbol}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Projection calculée à partir du dividende versé ({formatFCFA(latestDividend)}/action) et de la croissance prévisionnelle.
          </p>
        </div>

        {historicCAGR !== undefined && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Croissance Historique</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                +{historicCAGR}% / an
              </span>
            </div>
            <button
              onClick={() => setGrowthAssumption(historicCAGR > 0 ? Math.round(historicCAGR) : 5)}
              className="text-[10px] font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 underline cursor-pointer"
            >
              Appliquer au modèle
            </button>
          </div>
        )}
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
        {/* Input 1: Number of shares */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Nombre d'actions détenues :</span>
            <strong className="text-emerald-600 dark:text-emerald-400">{sharesCount} actions</strong>
          </label>
          <input
            type="range"
            min="5"
            max="1000"
            step="5"
            value={sharesCount}
            onChange={e => setSharesCount(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>5 actions</span>
            <span>Capital: {formatFCFA(currentTotalInvestment)}</span>
            <span>1 000</span>
          </div>
        </div>

        {/* Input 2: Growth Assumption */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Croissance estimée dividende :</span>
            <strong className="text-emerald-600 dark:text-emerald-400">+{growthAssumption}% / an</strong>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={growthAssumption}
            onChange={e => setGrowthAssumption(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>0% (Stable)</span>
            <span>+10%</span>
            <span>+20%</span>
          </div>
        </div>

        {/* Input 3: Horizon */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Horizon de projection :
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[3, 5, 10].map(yr => (
              <button
                key={yr}
                onClick={() => setProjectionYears(yr)}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  projectionYears === yr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {yr} ans
              </button>
            ))}
          </div>
        </div>

        {/* Input 4: Reinvestment Option */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Mode dividendes :
          </label>
          <button
            onClick={() => setReinvestDividends(!reinvestDividends)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              reinvestDividends
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{reinvestDividends ? '🔄 Réinvestissement (DCA)' : '💵 Encaissement Cash'}</span>
          </button>
        </div>
      </div>

      {/* Projection Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Revenu Annuel Projeté (Année {projectionYears})
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatFCFA(finalYearIncome)} / an
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Rente annuelle nette d'impôt UEMOA (IRVM 7% à la source).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 space-y-1">
          <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
            Cumul Total des Dividendes ({projectionYears} ans)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatFCFA(totalDividendsProjected)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total des liquidités générées sur l'ensemble de la période.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 space-y-1">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Rendement sur Coût Initial (Yield on Cost)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {yieldOnCost} %
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Rendement du dividende futur rapporté à votre prix d'achat initial.
          </p>
        </div>
      </div>

      {/* Projection Recharts Bar & Line Chart */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Projection des versements de dividendes annuels (FCFA)</span>
          <span className="text-[11px] font-medium text-slate-400">Hypothèse : +{growthAssumption}%/an</span>
        </h4>
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={val => `${Math.round(val / 1000)}k`}
                tick={{ fontSize: 10, fill: '#64748b' }}
                orientation="right"
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                formatter={(val: any, name: any) => [
                  formatFCFA(val as number),
                  name === 'annualIncome' ? 'Dividende Annuel Total' : 'Dividende / Action',
                ]}
              />
              <Bar dataKey="annualIncome" fill="#059669" radius={[8, 8, 0, 0]} name="Dividende Annuel" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Footer to Simulator */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="font-extrabold text-sm block text-emerald-400">
            Envie de tester une stratégie d'achats programmés (DCA) ?
          </span>
          <p className="text-xs text-slate-300">
            Intégrez {company.symbol} à vos simulations mensuelles de 25 000 ou 50 000 FCFA dans le simulateur avancé.
          </p>
        </div>
        {onNavigate && (
          <Button
            size="sm"
            onClick={() => onNavigate(`/simulation?symbol=${company.symbol}`)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shrink-0"
          >
            Lancer la Simulation DCA <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
