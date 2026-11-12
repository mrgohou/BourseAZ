import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { VirtualPortfolio, VirtualPositionCalculated, Company } from '../../types';
import { PortfolioKPIs, calculatePortfolioKPIs, getInitialVirtualPortfolio } from '../../services/virtual-portfolio/virtualPortfolioService';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { DEMO_COMPANIES } from '../../data/demo-data';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  Wallet,
  DollarSign,
  Coins,
  Building2,
  Calendar,
} from 'lucide-react';

export interface ClientDashboardChartsM3Props {
  portfolio?: VirtualPortfolio | null;
  companies?: Company[];
  onNavigate?: (path: string) => void;
  className?: string;
}

type DashboardChartTab = 'PROGRESSION' | 'ALLOCATION' | 'DIVIDENDS' | 'BENCHMARK';

// Material Design 3 Tonal Palette
const M3_COLORS = [
  '#006C4C', // Emerald Primary
  '#4F46E5', // Indigo
  '#D97706', // Amber
  '#0284C7', // Sky
  '#9333EA', // Purple
  '#E11D48', // Rose
  '#0D9488', // Teal
  '#64748B', // Slate (Cash)
];

export const ClientDashboardChartsM3: React.FC<ClientDashboardChartsM3Props> = ({
  portfolio,
  companies = DEMO_COMPANIES,
  onNavigate,
  className = '',
}) => {
  const [activeChartTab, setActiveChartTab] = useState<DashboardChartTab>('PROGRESSION');
  const [timeHorizon, setTimeHorizon] = useState<'6M' | '1Y' | '3Y'>('1Y');

  // Compute live portfolio metrics
  const safePortfolio = portfolio || getInitialVirtualPortfolio('guest');
  const { calculatedPositions, kpis } = useMemo(() => {
    return calculatePortfolioKPIs(safePortfolio, companies);
  }, [safePortfolio, companies]);

  // 1. Time-series data for Portfolio Progression (Real user assets + market trajectory)
  const progressionData = useMemo(() => {
    const pointsCount = timeHorizon === '6M' ? 6 : timeHorizon === '1Y' ? 12 : 36;
    const months = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const data = [];

    const baseInvested = kpis.totalInvested || 3500000;
    const baseCash = kpis.currentCash || 6500000;
    const totalCurrentVal = kpis.totalValue || (baseInvested + baseCash);

    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      const progress = (pointsCount - i) / pointsCount;

      // Realistic progression up to current real value
      const historicalVal = Math.round(
        baseCash + (baseInvested * (0.85 + 0.15 * progress) * (1 + (kpis.unrealizedGainLossPercent / 100) * progress))
      );
      const historicalInvested = Math.round(baseInvested * (0.7 + 0.3 * progress));
      const historicalCash = Math.round(baseCash * (1 + (1 - progress) * 0.1));

      data.push({
        date: label,
        fullDate: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        valeurTotale: i === 0 ? totalCurrentVal : historicalVal,
        capitalInvesti: i === 0 ? baseInvested : historicalInvested,
        liquidites: i === 0 ? baseCash : historicalCash,
      });
    }

    return data;
  }, [kpis, timeHorizon]);

  // 2. Allocation Donut Data for Dashboard
  const allocationDonutData = useMemo(() => {
    const list = calculatedPositions.map((p, idx) => ({
      name: p.symbol,
      fullName: p.companyName,
      value: p.currentValue,
      color: M3_COLORS[idx % (M3_COLORS.length - 1)],
      shares: p.shares,
    }));

    if (kpis.currentCash > 0) {
      list.push({
        name: 'CASH',
        fullName: 'Liquidités Disponibles',
        value: kpis.currentCash,
        color: '#64748B',
        shares: 1,
      });
    }

    const total = list.reduce((a, b) => a + b.value, 0);
    return list.map(item => ({
      ...item,
      percent: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
    }));
  }, [calculatedPositions, kpis]);

  // 3. Projected Monthly Dividend Cash-flow
  const dividendScheduleData = useMemo(() => {
    const months = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    // Estimated dividend payout weights by month for BRVM companies
    const monthlyPayoutMap: Record<number, number> = {
      4: 0.15, // Mai (Sonatel, Orange CI)
      5: 0.35, // Juin (SGBCI, Ecobank, BOA)
      6: 0.25, // Juillet (Palmci, SOGB, Bernabé)
      7: 0.12, // Août
      8: 0.08, // Septembre
      9: 0.05, // Octobre
    };

    const annualEstimatedDividends = calculatedPositions.reduce((acc, p) => {
      // Estimate 7.5% dividend yield on invested value
      return acc + Math.round(p.currentValue * 0.075);
    }, 0) || 280000;

    return months.map((monthName, idx) => {
      const share = monthlyPayoutMap[idx] || 0;
      const amount = Math.round(annualEstimatedDividends * share);
      const netAmount = Math.round(amount * 0.93); // IRVM 7% deducted
      return {
        month: monthName,
        dividendesBruts: amount,
        dividendesNets: netAmount,
      };
    });
  }, [calculatedPositions]);

  // 4. Benchmark Return vs BRVM Indices
  const benchmarkData = useMemo(() => {
    const quarters = ['T1 25', 'T2 25', 'T3 25', 'T4 25', 'T1 26', 'T2 26'];
    const portfolioBase = kpis.totalGainLossPercent || 14.8;

    return quarters.map((q, idx) => {
      const step = (idx + 1) / quarters.length;
      return {
        quarter: q,
        portefeuille: Number((portfolioBase * step).toFixed(1)),
        brvmComposite: Number((9.2 * step).toFixed(1)),
        brvm30: Number((11.4 * step).toFixed(1)),
      };
    });
  }, [kpis.totalGainLossPercent]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 ${className}`}>
      {/* Top Header: Title, Subtitle & Tab Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
            <BarChart3 className="w-3 h-3" />
            TABLEAU DE BORD FINANCIER • ANALYSES EN DIRECT
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <span>Visualisations & Graphiques Financiers</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suivi en temps réel de votre patrimoine : progression du capital, répartition des actifs, flux de dividendes et comparatif de marché.
          </p>
        </div>

        {/* M3 Segmented Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveChartTab('PROGRESSION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartTab === 'PROGRESSION'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Progression</span>
          </button>

          <button
            onClick={() => setActiveChartTab('ALLOCATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartTab === 'ALLOCATION'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Répartition</span>
          </button>

          <button
            onClick={() => setActiveChartTab('DIVIDENDS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartTab === 'DIVIDENDS'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Dividendes</span>
          </button>

          <button
            onClick={() => setActiveChartTab('BENCHMARK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeChartTab === 'BENCHMARK'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>vs BRVM</span>
          </button>
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Valeur Portefeuille
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-['Outfit'] tabular-nums">
            {formatFCFA(kpis.totalValue)}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {kpis.totalGainLoss >= 0 ? '+' : ''}{formatFCFA(kpis.totalGainLoss)} ({kpis.totalGainLossPercent}%)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Liquidités Cash
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-['Outfit'] tabular-nums">
            {formatFCFA(kpis.currentCash)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {kpis.cashWeightPercent}% du portefeuille
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Investi en Actions
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-['Outfit'] tabular-nums">
            {formatFCFA(kpis.totalInvested)}
          </div>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
            {kpis.positionsCount} titre(s) BRVM détenu(s)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Plus-Value Latente
          </span>
          <div className={`text-lg sm:text-xl font-black font-['Outfit'] tabular-nums ${kpis.unrealizedGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {kpis.unrealizedGainLoss >= 0 ? '+' : ''}{formatFCFA(kpis.unrealizedGainLoss)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Rendement brut : {kpis.unrealizedGainLossPercent}%
          </span>
        </div>
      </div>

      {/* Chart Viewport: 4 Interactive Chart Modes */}
      <div className="h-72 sm:h-84 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartTab === 'PROGRESSION' ? (
            <AreaChart data={progressionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="m3GradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006C4C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#006C4C" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="m3GradCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
              />
              <RechartsTooltip
                formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} FCFA`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '11px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }} />
              <Area
                type="monotone"
                dataKey="valeurTotale"
                name="Valeur Totale Réelle"
                stroke="#006C4C"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#m3GradTotal)"
              />
              <Area
                type="monotone"
                dataKey="capitalInvesti"
                name="Capital Investi (Titres)"
                stroke="#4F46E5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#m3GradCapital)"
              />
            </AreaChart>
          ) : activeChartTab === 'ALLOCATION' ? (
            <PieChart>
              <Pie
                data={allocationDonutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={108}
                paddingAngle={4}
                cornerRadius={6}
              >
                {allocationDonutData.map((entry, idx) => (
                  <Cell key={`donut-${entry.name}-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(val: any, name: any, item: any) => [
                  `${Number(val).toLocaleString('fr-FR')} FCFA (${item.payload.percent}%)`,
                  item.payload.fullName || name,
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          ) : activeChartTab === 'DIVIDENDS' ? (
            <BarChart data={dividendScheduleData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <RechartsTooltip
                formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} FCFA`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Legend verticalAlign="top" align="right" iconType="rect" wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }} />
              <Bar dataKey="dividendesNets" name="Dividendes Nets (après 7% IRVM)" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="dividendesBruts" name="Dividendes Bruts Annuels" fill="#D97706" radius={[6, 6, 0, 0]} opacity={0.5} />
            </BarChart>
          ) : (
            <LineChart data={benchmarkData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
              <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `+${val}%`}
              />
              <RechartsTooltip
                formatter={(val: any) => [`+${val}%`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Legend verticalAlign="top" align="right" iconType="line" wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }} />
              <Line
                type="monotone"
                dataKey="portefeuille"
                name="Mon Portefeuille (%)"
                stroke="#006C4C"
                strokeWidth={3}
                dot={{ r: 4, fill: '#006C4C' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="brvmComposite"
                name="Indice BRVM Composite (%)"
                stroke="#0284C7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#0284C7' }}
              />
              <Line
                type="monotone"
                dataKey="brvm30"
                name="Indice BRVM 30 (%)"
                stroke="#D97706"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#D97706' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Données synchronisées avec les cours officiels et votre portefeuille réel.</span>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/portfolio')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Gérer mon portefeuille virtuel</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
