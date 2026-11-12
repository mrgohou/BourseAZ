import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Sector,
} from 'recharts';
import { VirtualPositionCalculated } from '../../types';
import { PortfolioKPIs } from '../../services/virtual-portfolio/virtualPortfolioService';
import { formatFCFA } from '../../lib/formatters';
import {
  PieChart as PieChartIcon,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface PortfolioInvestmentDonutChartM3Props {
  calculatedPositions: VirtualPositionCalculated[];
  kpis: PortfolioKPIs;
  currentCash: number;
  onSelectStock?: (symbol: string) => void;
  onBuyStock?: (symbol: string) => void;
  onSellStock?: (position: VirtualPositionCalculated) => void;
  className?: string;
}

// Material Design 3 Tonal Color Palette for Portfolio Assets
const M3_PALETTE = [
  '#006C4C', // M3 Primary Emerald
  '#4F46E5', // M3 Indigo
  '#D97706', // M3 Amber
  '#0284C7', // M3 Sky
  '#9333EA', // M3 Purple
  '#E11D48', // M3 Rose
  '#0D9488', // M3 Teal
  '#EA580C', // M3 Orange
  '#475569', // M3 Slate (Cash)
  '#16A34A', // M3 Green
  '#8B5CF6', // M3 Violet
  '#CA8A04', // M3 Yellow
];

type AllocationMetric = 'INVESTED' | 'CURRENT_VALUE';

interface DonutSliceData {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  value: number;
  percent: number;
  color: string;
  shares: number;
  averageBuyPrice: number;
  currentPrice: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  isCash?: boolean;
}

/**
 * Custom active slice renderer for M3 interactive focus effect
 */
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      {/* Outer halo */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 7}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.25}
        cornerRadius={6}
      />
      {/* Focused slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={6}
      />
    </g>
  );
};

export const PortfolioInvestmentDonutChartM3: React.FC<PortfolioInvestmentDonutChartM3Props> = ({
  calculatedPositions,
  kpis,
  currentCash,
  onSelectStock,
  onBuyStock,
  onSellStock,
  className = '',
}) => {
  // M3 Interaction States
  const [metric, setMetric] = useState<AllocationMetric>('INVESTED');
  const [includeCash, setIncludeCash] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute donut chart items
  const { chartData, totalBaselineValue } = useMemo(() => {
    const items: DonutSliceData[] = [];

    calculatedPositions.forEach((pos, idx) => {
      const val = metric === 'INVESTED' ? pos.totalInvested : pos.currentValue;
      items.push({
        id: pos.id,
        symbol: pos.symbol,
        name: pos.companyName,
        sector: pos.sector,
        value: val,
        percent: 0, // calculated below
        color: M3_PALETTE[idx % (M3_PALETTE.length - 1)],
        shares: pos.shares,
        averageBuyPrice: pos.averageBuyPrice,
        currentPrice: pos.currentPrice,
        unrealizedGainLoss: pos.unrealizedGainLoss,
        unrealizedGainLossPercent: pos.unrealizedGainLossPercent,
        isCash: false,
      });
    });

    if (includeCash && currentCash > 0) {
      items.push({
        id: 'cash-balance',
        symbol: 'CASH',
        name: 'Liquidités Disponibles',
        sector: 'Liquidités',
        value: currentCash,
        percent: 0,
        color: '#64748B', // M3 Slate Neutral for Cash
        shares: 1,
        averageBuyPrice: currentCash,
        currentPrice: currentCash,
        unrealizedGainLoss: 0,
        unrealizedGainLossPercent: 0,
        isCash: true,
      });
    }

    const sum = items.reduce((acc, curr) => acc + curr.value, 0);

    // Compute relative percentage
    items.forEach(item => {
      item.percent = sum > 0 ? Math.round((item.value / sum) * 1000) / 10 : 0;
    });

    // Sort descending by value
    items.sort((a, b) => b.value - a.value);

    return { chartData: items, totalBaselineValue: sum };
  }, [calculatedPositions, currentCash, metric, includeCash]);

  // Active slice info for donut center
  const hoveredItem = activeIndex !== null && chartData[activeIndex] ? chartData[activeIndex] : null;

  // Custom M3 Tooltip
  const CustomM3Tooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item: DonutSliceData = payload[0].payload;

    return (
      <div className="bg-slate-950/95 dark:bg-slate-950/95 text-white border border-slate-700/80 rounded-2xl shadow-2xl p-4 min-w-[240px] backdrop-blur-md space-y-2 pointer-events-none z-50">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-black text-sm text-white tracking-wide">
              {item.symbol}
            </span>
          </div>
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
            {item.percent}%
          </span>
        </div>

        <div className="text-xs text-slate-300 font-medium truncate max-w-[220px]">
          {item.name}
        </div>

        <div className="space-y-1.5 pt-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">
              {metric === 'INVESTED' ? 'Montant investi :' : 'Valeur actuelle :'}
            </span>
            <span className="font-mono font-black text-white">
              {formatFCFA(item.value)}
            </span>
          </div>

          {!item.isCash && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nombre d'actions :</span>
                <span className="font-mono text-slate-200">
                  {item.shares.toLocaleString('fr-FR')} titres
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cours à l'achat :</span>
                <span className="font-mono text-slate-200">
                  {formatFCFA(item.averageBuyPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cours actuel :</span>
                <span className="font-mono text-slate-200">
                  {formatFCFA(item.currentPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Plus-value :</span>
                <span
                  className={`font-mono font-bold ${
                    item.unrealizedGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {item.unrealizedGainLoss >= 0 ? '+' : ''}
                  {formatFCFA(item.unrealizedGainLoss)} ({item.unrealizedGainLossPercent}%)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (calculatedPositions.length === 0) {
    return (
      <section
        aria-label="Résumé du Portefeuille - Répartition"
        className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 text-center ${className}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <PieChartIcon className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-['Outfit']">
            Répartition des Investissements par Action
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Votre graphique en anneau apparaîtra dès que vous aurez ajouté votre première action dans votre portefeuille.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Résumé du Portefeuille - Répartition par Action"
      className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 ${className}`}
    >
      {/* Header: Title, Subtitle & M3 Segmented Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
            <PieChartIcon className="w-3 h-3" />
            RÉSUMÉ DU PORTEFEUILLE • ALLOCATION D'ACTIFS
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <span>Répartition des Investissements par Action</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Graphique en anneau interactif (Material Design 3) illustrant le poids respectif de chaque valeur dans votre capital.
          </p>
        </div>

        {/* M3 Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Metric Selector (Invested vs Current Market Value) */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setMetric('INVESTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metric === 'INVESTED'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Calcul basé sur le montant total déboursé à l'achat"
            >
              Montant Investi
            </button>
            <button
              onClick={() => setMetric('CURRENT_VALUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metric === 'CURRENT_VALUE'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Calcul basé sur la valeur actuelle au marché"
            >
              Valeur Actuelle
            </button>
          </div>

          {/* Cash Inclusion Toggle */}
          <button
            onClick={() => setIncludeCash(!includeCash)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              includeCash
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Afficher ou masquer la part des liquidités disponibles"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{includeCash ? 'Avec Cash' : 'Actions seules'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Donut Chart with Center Hole, Right M3 Breakdown List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Recharts Donut Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full h-64 sm:h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomM3Tooltip />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="symbol"
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={114}
                  paddingAngle={3}
                  cornerRadius={5}
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map(entry => (
                    <Cell
                      key={`donut-cell-${entry.id}`}
                      fill={entry.color}
                      stroke={entry.isCash ? '#94a3b8' : 'transparent'}
                      strokeWidth={1}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                      onClick={() => !entry.isCash && onSelectStock?.(entry.symbol)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* M3 Center Hole Content: Dynamic on hover, summary on idle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {hoveredItem ? (
                <div className="space-y-0.5 animate-fadeIn">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider text-white"
                    style={{ backgroundColor: hoveredItem.color }}
                  >
                    {hoveredItem.symbol}
                  </span>
                  <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white tabular-nums">
                    {formatFCFA(hoveredItem.value)}
                  </div>
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {hoveredItem.percent}% du total
                  </div>
                  <div className="text-[10px] text-slate-400 max-w-[120px] truncate">
                    {hoveredItem.name}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {metric === 'INVESTED' ? 'Total Investi' : 'Valeur Totale'}
                  </span>
                  <div className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white tabular-nums">
                    {formatFCFA(totalBaselineValue)}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                    {chartData.length} ligne{chartData.length > 1 ? 's' : ''}{includeCash ? ' (avec cash)' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">
            Survolez ou cliquez sur un segment de l'anneau pour inspecter la ligne.
          </p>
        </div>

        {/* Right Column: M3 Interactive Breakdown List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            <span>Actif & Dénomination</span>
            <span>Montant & Poids</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {chartData.map((item, idx) => {
              const isHovered = activeIndex === idx;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isHovered
                      ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500/70 shadow-xs scale-[1.01]'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                  }`}
                  onClick={() => !item.isCash && onSelectStock?.(item.symbol)}
                >
                  {/* Left: Swatch, Symbol and Company name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2 underline-offset-2">
                          {item.symbol}
                        </span>
                        {!item.isCash && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            · {item.shares.toLocaleString('fr-FR')} actions
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-[260px]">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount, Progress bar and Percentage */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {formatFCFA(item.value)}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, item.percent)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 w-10 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick M3 Insight Strip */}
          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Valeur dominante : <strong>{chartData[0]?.symbol}</strong> ({chartData[0]?.percent}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-400 text-[11px]">Liquidités :</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                {formatFCFA(currentCash)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
