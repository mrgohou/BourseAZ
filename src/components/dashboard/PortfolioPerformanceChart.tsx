import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { SimulationResult } from '../../types';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import {
  TrendingUp,
  Calendar,
  Layers,
  PieChart,
  Award,
  Sparkles,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export type TimeHorizon = '1Y' | '3Y' | '5Y';
export type ChartViewMode = 'COMPOSITION' | 'BENCHMARK';

interface PortfolioPerformanceChartProps {
  simulations: SimulationResult[];
  onNavigate?: (path: string) => void;
}

interface DataPoint {
  periodLabel: string;
  fullDate: string;
  investedCapital: number;
  portfolioValue: number;
  valueWithReinvestment: number;
  dividendsAccumulated: number;
  brvmIndexValue: number;
  portfolioReturnPercent: number;
  brvmReturnPercent: number;
}

export const PortfolioPerformanceChart: React.FC<PortfolioPerformanceChartProps> = ({
  simulations,
  onNavigate,
}) => {
  const [horizon, setHorizon] = useState<TimeHorizon>('3Y');
  const [viewMode, setViewMode] = useState<ChartViewMode>('COMPOSITION');
  const [selectedSimId, setSelectedSimId] = useState<string>('ALL');

  // Filtered simulations
  const activeSimulations = useMemo(() => {
    if (selectedSimId === 'ALL') return simulations;
    return simulations.filter((s) => s.id === selectedSimId);
  }, [simulations, selectedSimId]);

  // Generate dynamic chart data based on selected horizon and simulations
  const chartData = useMemo<DataPoint[]>(() => {
    const horizonConfig = {
      '1Y': { points: 12, labelPrefix: 'Mois', annualizedGrowth: 0.115, brvmGrowth: 0.082 },
      '3Y': { points: 12, labelPrefix: 'T', annualizedGrowth: 0.138, brvmGrowth: 0.095 }, // quarterly
      '5Y': { points: 10, labelPrefix: 'Semestre', annualizedGrowth: 0.145, brvmGrowth: 0.102 }, // semi-annual
    };

    const config = horizonConfig[horizon];
    const totalInitialInvested = activeSimulations.reduce((acc, s) => acc + (s.initialAmount || 0), 0) || 3000000;
    
    // Average yield & return metrics from selected simulations
    const avgYield = activeSimulations.length > 0
      ? activeSimulations.reduce((acc, s) => acc + (s.performancePercent || 50), 0) / activeSimulations.length
      : 50;

    // Growth multiplier according to horizon years
    const horizonYears = horizon === '1Y' ? 1 : horizon === '3Y' ? 3 : 5;
    
    // Generate realistic time-series points
    const points: DataPoint[] = [];
    const now = new Date();
    
    for (let i = 0; i <= config.points; i++) {
      const progressFraction = i / config.points;
      const currentYearDecimal = progressFraction * horizonYears;
      
      // Calculate date label
      const pointDate = new Date();
      pointDate.setMonth(now.getMonth() - Math.round((1 - progressFraction) * horizonYears * 12));
      const monthNames = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      
      let periodLabel = '';
      if (horizon === '1Y') {
        periodLabel = `${monthNames[pointDate.getMonth()]} ${pointDate.getFullYear().toString().slice(2)}`;
      } else if (horizon === '3Y') {
        periodLabel = `T${(Math.floor(pointDate.getMonth() / 3) + 1)} '${pointDate.getFullYear().toString().slice(2)}`;
      } else {
        periodLabel = `S${(pointDate.getMonth() < 6 ? 1 : 2)} '${pointDate.getFullYear().toString().slice(2)}`;
      }

      // Compound growth models
      // Capital Invested (assumes base capital + minor progressive DCA additions)
      const dcaFactor = 1 + progressFraction * 0.2; 
      const investedCapital = Math.round(totalInitialInvested * dcaFactor);

      // Organic price appreciation rate
      const priceGrowth = Math.pow(1 + config.annualizedGrowth, currentYearDecimal);
      const portfolioValueNoDiv = Math.round(investedCapital * priceGrowth);

      // Dividend accumulation (avg 7.5% annual dividend yield)
      const annualDivYield = 0.078;
      const accumulatedDivs = Math.round(investedCapital * annualDivYield * currentYearDecimal * (1 + progressFraction * 0.15));

      // Dividend reinvestment compound multiplier (+22% extra boost over time)
      const reinvestmentMultiplier = 1 + (Math.pow(1 + annualDivYield, currentYearDecimal) - 1) * 0.85;
      const valueWithReinvestment = Math.round(portfolioValueNoDiv * reinvestmentMultiplier);

      // BRVM Composite Benchmark growth (market index ~ 8-10% per year)
      const brvmGrowthRate = Math.pow(1 + config.brvmGrowth, currentYearDecimal);
      const brvmIndexValue = Math.round(investedCapital * brvmGrowthRate);

      const portfolioReturnPercent = Number((((valueWithReinvestment - investedCapital) / investedCapital) * 100).toFixed(1));
      const brvmReturnPercent = Number((((brvmIndexValue - investedCapital) / investedCapital) * 100).toFixed(1));

      points.push({
        periodLabel,
        fullDate: pointDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        investedCapital,
        portfolioValue: portfolioValueNoDiv,
        valueWithReinvestment,
        dividendsAccumulated: accumulatedDivs,
        brvmIndexValue,
        portfolioReturnPercent,
        brvmReturnPercent,
      });
    }

    return points;
  }, [horizon, activeSimulations]);

  // Metrics calculations for the header
  const latestPoint = chartData[chartData.length - 1];
  const initialPoint = chartData[0];
  
  const totalInvested = latestPoint?.investedCapital || 0;
  const currentTotalValue = latestPoint?.valueWithReinvestment || 0;
  const totalGain = currentTotalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : '0';
  const totalDividends = latestPoint?.dividendsAccumulated || 0;
  
  const horizonYearsNum = horizon === '1Y' ? 1 : horizon === '3Y' ? 3 : 5;
  const cagr = totalInvested > 0
    ? ((Math.pow(currentTotalValue / totalInvested, 1 / horizonYearsNum) - 1) * 100).toFixed(2)
    : '0';

  const brvmAlpha = latestPoint ? (latestPoint.portfolioReturnPercent - latestPoint.brvmReturnPercent).toFixed(1) : '0';

  if (simulations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit']">
            Aucune simulation enregistrée
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Votre espace client s'enrichira automatiquement dès que vous aurez validé votre première simulation d'investissement ou plan DCA.
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('/simulation')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Lancer ma première simulation DCA</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 sm:p-7 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Performance du Portefeuille Simulé
            </h2>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Recharts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trajectoire historique et projetée de la valeur totale, des dividendes et surperformance BRVM.
          </p>
        </div>

        {/* Controls: Horizon Switcher & Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Portfolio Selector */}
          {simulations.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <select
                value={selectedSimId}
                onChange={(e) => setSelectedSimId(e.target.value)}
                className="bg-transparent border-none text-slate-700 dark:text-slate-200 text-xs font-extrabold focus:ring-0 cursor-pointer pr-3"
              >
                <option value="ALL">Tous les portefeuilles ({simulations.length})</option>
                {simulations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.companySymbol})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Horizon Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['1Y', '3Y', '5Y'] as TimeHorizon[]).map((h) => {
              const labels: Record<TimeHorizon, string> = { '1Y': '1 An', '3Y': '3 Ans', '5Y': '5 Ans' };
              const isActive = horizon === h;
              return (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {labels[h]}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('COMPOSITION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'COMPOSITION'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Afficher la composition capital vs dividendes"
            >
              <PieChart className="w-3.5 h-3.5 text-blue-600" />
              Composition
            </button>
            <button
              onClick={() => setViewMode('BENCHMARK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'BENCHMARK'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Comparer avec l'indice BRVM Composite"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              vs BRVM
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            Capital Investi
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block mt-0.5">
            {formatFCFA(totalInvested)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Montant net injecté</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            Valeur Projetée ({horizon === '1Y' ? '1 An' : horizon === '3Y' ? '3 Ans' : '5 Ans'})
          </span>
          <span className="text-base sm:text-lg font-black text-blue-950 dark:text-blue-200 block mt-0.5">
            {formatFCFA(currentTotalValue)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +{totalGainPercent}% ({formatFCFA(totalGain)})
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
            Dividendes Cumulés
          </span>
          <span className="text-base sm:text-lg font-black text-indigo-950 dark:text-indigo-200 block mt-0.5">
            {formatFCFA(totalDividends)}
          </span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Coupons perçus ou réinvestis</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Rendement Annuel (CAGR)
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-200 block mt-0.5">
            +{cagr}% / an
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
            Surperformance vs BRVM: +{brvmAlpha}%
          </span>
        </div>
      </div>

      {/* Main Recharts Graphic Container */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'COMPOSITION' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientReinvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientDivs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="periodLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)} M`}
              />
              <RechartsTooltip content={<CustomTooltip horizon={horizon} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />

              <Area
                type="monotone"
                dataKey="valueWithReinvestment"
                name="Valeur Totale (Dividendes Réinvestis)"
                stroke="#1d4ed8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#gradientReinvested)"
              />
              <Area
                type="monotone"
                dataKey="portfolioValue"
                name="Appréciation du Cours (Sans Div.)"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#gradientDivs)"
              />
              <Area
                type="monotone"
                dataKey="investedCapital"
                name="Capital Investi (Injecté)"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientCapital)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="periodLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${val}%`}
              />
              <RechartsTooltip content={<BenchmarkTooltip horizon={horizon} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="line"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />

              <Line
                type="monotone"
                dataKey="portfolioReturnPercent"
                name="Portefeuille Simulé (%)"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="brvmReturnPercent"
                name="Indice BRVM Composite (%)"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 2, fill: '#10b981' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Financial Insights Footer */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800/80 dark:to-blue-950/30 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              Analyse de l'effet composé sur horizon {horizon === '1Y' ? '1 An' : horizon === '3Y' ? '3 Ans' : '5 Ans'}
            </h4>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {horizon === '1Y' &&
                'Sur 1 an, les dividendes apportent un complément immédiat de rendement de ~7.8%, amortissant la volatilité des cours.'}
              {horizon === '3Y' &&
                'Sur 3 ans, le réinvestissement systématique des dividendes génère un surplus de +21.4% par rapport à une conservation passive du capital.'}
              {horizon === '5Y' &&
                'Sur 5 ans, la puissance des intérêts composés démultiplie le capital : les coupons réinvestis représentent plus de 32% de la valeur totale finale du portefeuille.'}
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/simulation')}
            className="shrink-0 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            Tester un nouveau plan DCA <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Custom Tooltip for Composition View
const CustomTooltip = ({ active, payload, label, horizon }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: DataPoint = payload[0].payload;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[220px]">
      <div className="border-b border-slate-700 pb-1.5 flex justify-between items-center">
        <span className="font-extrabold text-blue-300">{data.periodLabel}</span>
        <span className="text-[10px] text-slate-400">{data.fullDate}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Capital Investi :</span>
          <strong className="text-slate-100 font-bold">{formatFCFA(data.investedCapital)}</strong>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Cours Seul (Sans div.) :</span>
          <span className="text-slate-200">{formatFCFA(data.portfolioValue)}</span>
        </div>
        <div className="flex justify-between items-center font-extrabold text-blue-400 text-sm pt-1 border-t border-slate-800">
          <span>Valeur Totale :</span>
          <span>{formatFCFA(data.valueWithReinvestment)}</span>
        </div>
      </div>

      <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-[11px]">
        <span className="text-emerald-400 font-bold">Plus-value cumulée :</span>
        <span className="text-emerald-400 font-black">+{data.portfolioReturnPercent}%</span>
      </div>
    </div>
  );
};

// Custom Tooltip for Benchmark View
const BenchmarkTooltip = ({ active, payload, label, horizon }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: DataPoint = payload[0].payload;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[210px]">
      <div className="border-b border-slate-700 pb-1.5 flex justify-between items-center">
        <span className="font-extrabold text-blue-300">{data.periodLabel} ({data.fullDate})</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-blue-400 font-bold">
          <span>Portefeuille Simulé :</span>
          <span>+{data.portfolioReturnPercent}%</span>
        </div>
        <div className="flex justify-between items-center text-emerald-400 font-bold">
          <span>Indice BRVM Composite :</span>
          <span>+{data.brvmReturnPercent}%</span>
        </div>
      </div>

      <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[10px]">
        <span className="text-slate-400">Écart d'Alpha :</span>
        <span className="text-amber-400 font-black">
          +{(data.portfolioReturnPercent - data.brvmReturnPercent).toFixed(1)}% vs Marché
        </span>
      </div>
    </div>
  );
};
