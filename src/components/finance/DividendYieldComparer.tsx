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
import { DEMO_COMPANIES } from '../../data/demo-data';
import { useMarketData } from '../../features/market/MarketContext';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import {
  Percent,
  Coins,
  TrendingUp,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';

export type ComparisonMetric = 'YIELD' | 'PAYOUT' | 'AMOUNT';

export interface HistoricalDividendRecord {
  year: number;
  dividend: number; // FCFA
  eps: number; // FCFA
  price: number; // FCFA
  payoutRatio: number; // %
  yieldPercent: number; // %
}

export const DIVIDEND_HISTORIES: Record<string, HistoricalDividendRecord[]> = {
  SNTS: [
    { year: 2021, dividend: 1200, eps: 1450, price: 13500, payoutRatio: 82.8, yieldPercent: 8.89 },
    { year: 2022, dividend: 1380, eps: 1580, price: 14200, payoutRatio: 87.3, yieldPercent: 9.72 },
    { year: 2023, dividend: 1450, eps: 1710, price: 15500, payoutRatio: 84.8, yieldPercent: 9.35 },
    { year: 2024, dividend: 1575, eps: 1850, price: 16500, payoutRatio: 85.1, yieldPercent: 9.55 },
    { year: 2025, dividend: 1680, eps: 1980, price: 32000, payoutRatio: 84.8, yieldPercent: 5.25 },
  ],
  SGBC: [
    { year: 2021, dividend: 620, eps: 950, price: 10500, payoutRatio: 65.3, yieldPercent: 5.90 },
    { year: 2022, dividend: 750, eps: 1120, price: 12500, payoutRatio: 67.0, yieldPercent: 6.00 },
    { year: 2023, dividend: 820, eps: 1280, price: 14800, payoutRatio: 64.1, yieldPercent: 5.54 },
    { year: 2024, dividend: 1010, eps: 1420, price: 16500, payoutRatio: 71.1, yieldPercent: 6.12 },
    { year: 2025, dividend: 1350, eps: 1820, price: 39000, payoutRatio: 74.2, yieldPercent: 3.46 },
  ],
  TTLCI: [
    { year: 2021, dividend: 140, eps: 170, price: 1650, payoutRatio: 82.4, yieldPercent: 8.48 },
    { year: 2022, dividend: 160, eps: 195, price: 1850, payoutRatio: 82.1, yieldPercent: 8.65 },
    { year: 2023, dividend: 185, eps: 220, price: 2050, payoutRatio: 84.1, yieldPercent: 9.02 },
    { year: 2024, dividend: 210, eps: 240, price: 2150, payoutRatio: 87.5, yieldPercent: 9.77 },
    { year: 2025, dividend: 230, eps: 265, price: 2995, payoutRatio: 86.8, yieldPercent: 7.68 },
  ],
  SLBC: [
    { year: 2021, dividend: 3200, eps: 5100, price: 72000, payoutRatio: 62.7, yieldPercent: 4.44 },
    { year: 2022, dividend: 3500, eps: 5800, price: 78000, payoutRatio: 60.3, yieldPercent: 4.49 },
    { year: 2023, dividend: 3800, eps: 6200, price: 81000, payoutRatio: 61.3, yieldPercent: 4.69 },
    { year: 2024, dividend: 4050, eps: 6800, price: 37000, payoutRatio: 59.6, yieldPercent: 10.95 },
    { year: 2025, dividend: 4300, eps: 7200, price: 37005, payoutRatio: 59.7, yieldPercent: 11.62 },
  ],
  ONTBF: [
    { year: 2021, dividend: 210, eps: 260, price: 2100, payoutRatio: 80.8, yieldPercent: 10.00 },
    { year: 2022, dividend: 230, eps: 275, price: 2250, payoutRatio: 83.6, yieldPercent: 10.22 },
    { year: 2023, dividend: 245, eps: 285, price: 2350, payoutRatio: 86.0, yieldPercent: 10.43 },
    { year: 2024, dividend: 260, eps: 310, price: 2450, payoutRatio: 83.9, yieldPercent: 10.61 },
    { year: 2025, dividend: 280, eps: 330, price: 2910, payoutRatio: 84.8, yieldPercent: 9.62 },
  ],
  BOAC: [
    { year: 2021, dividend: 360, eps: 520, price: 4800, payoutRatio: 69.2, yieldPercent: 7.50 },
    { year: 2022, dividend: 420, eps: 610, price: 5600, payoutRatio: 68.9, yieldPercent: 7.50 },
    { year: 2023, dividend: 500, eps: 720, price: 6500, payoutRatio: 69.4, yieldPercent: 7.69 },
    { year: 2024, dividend: 620, eps: 850, price: 7200, payoutRatio: 72.9, yieldPercent: 8.61 },
    { year: 2025, dividend: 710, eps: 960, price: 11600, payoutRatio: 74.0, yieldPercent: 6.12 },
  ],
  CIEC: [
    { year: 2021, dividend: 110, eps: 150, price: 1750, payoutRatio: 73.3, yieldPercent: 6.29 },
    { year: 2022, dividend: 125, eps: 170, price: 1900, payoutRatio: 73.5, yieldPercent: 6.58 },
    { year: 2023, dividend: 135, eps: 180, price: 2100, payoutRatio: 75.0, yieldPercent: 6.43 },
    { year: 2024, dividend: 150, eps: 210, price: 2250, payoutRatio: 71.4, yieldPercent: 6.67 },
    { year: 2025, dividend: 165, eps: 230, price: 5150, payoutRatio: 71.7, yieldPercent: 3.20 },
  ],
  PALC: [
    { year: 2021, dividend: 350, eps: 480, price: 4500, payoutRatio: 72.9, yieldPercent: 7.78 },
    { year: 2022, dividend: 420, eps: 580, price: 5200, payoutRatio: 72.4, yieldPercent: 8.08 },
    { year: 2023, dividend: 500, eps: 720, price: 6500, payoutRatio: 69.4, yieldPercent: 7.69 },
    { year: 2024, dividend: 580, eps: 810, price: 6800, payoutRatio: 71.6, yieldPercent: 8.53 },
    { year: 2025, dividend: 640, eps: 890, price: 9100, payoutRatio: 71.9, yieldPercent: 7.03 },
  ],
};

const COMPANY_COLORS: Record<string, string> = {
  SNTS: '#1d4ed8', // Blue
  SGBC: '#4f46e5', // Indigo
  TTLCI: '#059669', // Emerald
  SLBC: '#d97706', // Amber
  ONTBF: '#0284c7', // Sky
  BOAC: '#7c3aed', // Purple
  CIEC: '#e11d48', // Rose
  PALC: '#16a34a', // Green
};

export interface DividendYieldComparerProps {
  onNavigate?: (path: string) => void;
  selectedSymbols?: string[];
  onSelectedSymbolsChange?: (symbols: string[]) => void;
}

const getDividendHistory = (sym: string): HistoricalDividendRecord[] => {
  if (DIVIDEND_HISTORIES[sym]) {
    return DIVIDEND_HISTORIES[sym];
  }
  const company = DEMO_COMPANIES.find((c) => c.symbol === sym);
  if (!company) return [];

  const div = company.lastDividend || Math.round((company.currentPrice * (company.dividendYield || 7.0)) / 100);
  const eps = company.eps || Math.round(div * 1.25);
  const price = company.currentPrice;
  const yieldPct = company.dividendYield || (price > 0 ? (div / price) * 100 : 7.0);
  const payout = eps > 0 ? (div / eps) * 100 : 75;

  return [
    { year: 2021, dividend: Math.round(div * 0.75), eps: Math.round(eps * 0.75), price: Math.round(price * 0.8), payoutRatio: Math.min(90, Math.round(payout * 0.95)), yieldPercent: Number((yieldPct * 0.9).toFixed(2)) },
    { year: 2022, dividend: Math.round(div * 0.82), eps: Math.round(eps * 0.82), price: Math.round(price * 0.85), payoutRatio: Math.min(90, Math.round(payout * 0.97)), yieldPercent: Number((yieldPct * 0.95).toFixed(2)) },
    { year: 2023, dividend: Math.round(div * 0.9), eps: Math.round(eps * 0.9), price: Math.round(price * 0.92), payoutRatio: Math.min(90, Math.round(payout)), yieldPercent: Number((yieldPct * 0.98).toFixed(2)) },
    { year: 2024, dividend: Math.round(div * 0.95), eps: Math.round(eps * 0.96), price: Math.round(price * 0.96), payoutRatio: Math.min(90, Math.round(payout * 1.01)), yieldPercent: Number((yieldPct * 0.99).toFixed(2)) },
    { year: 2025, dividend: div, eps: eps, price: price, payoutRatio: Math.min(95, Math.round(payout * 1.02)), yieldPercent: Number(yieldPct.toFixed(2)) },
  ];
};

export const DividendYieldComparer: React.FC<DividendYieldComparerProps> = ({
  onNavigate,
  selectedSymbols: propSelectedSymbols,
  onSelectedSymbolsChange,
}) => {
  const [internalSymbols, setInternalSymbols] = useState<string[]>([]);
  const selectedSymbols = propSelectedSymbols !== undefined ? propSelectedSymbols : internalSymbols;

  const setSelectedSymbols = (symbols: string[]) => {
    if (onSelectedSymbolsChange) {
      onSelectedSymbolsChange(symbols);
    }
    setInternalSymbols(symbols);
  };

  const { companies } = useMarketData();
  const [metric, setMetric] = useState<ComparisonMetric>('YIELD');
  const [investmentAmount, setInvestmentAmount] = useState<number>(1000000); // 1.000.000 FCFA

  // Add / Remove selection handlers
  const toggleSymbol = (sym: string) => {
    if (selectedSymbols.includes(sym)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
    } else {
      if (selectedSymbols.length < 5) {
        setSelectedSymbols([...selectedSymbols, sym]);
      }
    }
  };

  const applyPreset = (presetSymbols: string[]) => {
    setSelectedSymbols(presetSymbols);
  };

  // Prepare chart dataset (x-axis: 2021..2025)
  const years = [2021, 2022, 2023, 2024, 2025];

  const chartData = useMemo(() => {
    return years.map((yr) => {
      const point: any = { year: `${yr}` };
      selectedSymbols.forEach((sym) => {
        const history = getDividendHistory(sym);
        const record = history.find((r) => r.year === yr);
        if (record) {
          if (metric === 'YIELD') point[sym] = record.yieldPercent;
          else if (metric === 'PAYOUT') point[sym] = record.payoutRatio;
          else point[sym] = record.dividend;
        } else {
          point[sym] = 0;
        }
      });
      return point;
    });
  }, [selectedSymbols, metric]);

  // Selected companies details
  const selectedCompanies = useMemo(() => {
    return selectedSymbols.map((sym) => {
      const company = (companies && companies.length > 0 ? companies : DEMO_COMPANIES).find((c) => c.symbol === sym) || DEMO_COMPANIES[0];
      const history = getDividendHistory(sym);
      const latestRec = history[history.length - 1] || { yieldPercent: 0, payoutRatio: 0, dividend: 0 };
      const firstRec = history[0] || { dividend: 1 };
      
      // Calculate 5-year CAGR of dividend
      const cagr =
        history.length > 1 && firstRec.dividend > 0
          ? ((Math.pow(latestRec.dividend / firstRec.dividend, 1 / (history.length - 1)) - 1) * 100).toFixed(1)
          : '0.0';

      // Passive income on user's investment amount
      const sharesCount = Math.floor(investmentAmount / company.currentPrice);
      const annualIncome = sharesCount * latestRec.dividend;
      const effectiveYield = investmentAmount > 0 ? ((annualIncome / investmentAmount) * 100).toFixed(2) : '0';

      return {
        company,
        history,
        latestRec,
        cagr,
        sharesCount,
        annualIncome,
        effectiveYield,
      };
    });
  }, [selectedSymbols, investmentAmount]);

  return (
    <div className="space-y-8">
      {/* Tool Title & Subtitle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl">
                <Coins className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Comparateur Historique de Rendement de Dividendes
              </h2>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> BRVM 2021-2025
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Analysez la constance des coupons distribués, le taux de distribution (Payout Ratio) et la croissance du dividende par action.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sélections :
            </span>
            <button
              onClick={() => applyPreset(['SNTS', 'TTLCI', 'ONTBF'])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition cursor-pointer"
            >
              👑 Top Rendements (&gt;9%)
            </button>
            <button
              onClick={() => applyPreset(['SGBC', 'BOAC', 'SNTS'])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition cursor-pointer"
            >
              🏦 Banques & Télécoms
            </button>
            <button
              onClick={() => applyPreset(['SLBC', 'CIEC', 'PALC'])}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-xl transition cursor-pointer"
            >
              🌱 Industrie & Agro
            </button>
          </div>
        </div>

        {/* Stock Selection Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Actions sélectionnées ({selectedSymbols.length} / 5) :
            </label>
            {selectedSymbols.length > 0 && (
              <button
                onClick={() => setSelectedSymbols([])}
                className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
              >
                Réinitialiser la sélection
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedSymbols.map((sym) => {
              const comp = DEMO_COMPANIES.find((c) => c.symbol === sym);
              const color = COMPANY_COLORS[sym] || '#2563eb';

              return (
                <div
                  key={sym}
                  className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-2xs"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{comp?.name || sym} ({sym})</span>
                  <button
                    onClick={() => toggleSymbol(sym)}
                    className="p-0.5 text-emerald-700 dark:text-emerald-300 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer transition-colors"
                    title="Retirer de l'analyse"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Dropdown list for selecting additional actions */}
            {selectedSymbols.length < 5 && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      if (!selectedSymbols.includes(e.target.value)) {
                        setSelectedSymbols([...selectedSymbols, e.target.value]);
                      }
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl outline-none border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                >
                  <option value="">
                    {selectedSymbols.length === 0
                      ? '+ Sélectionner une action dans la liste déroulante...'
                      : '+ Ajouter une autre action (liste déroulante)...'}
                  </option>
                  {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).map((c) => (
                    <option
                      key={c.symbol}
                      value={c.symbol}
                      disabled={selectedSymbols.includes(c.symbol)}
                    >
                      {c.name} ({c.symbol}) - {formatFCFA(c.currentPrice)} ({c.dividendYield ? `${c.dividendYield}% rdt` : ''}) {selectedSymbols.includes(c.symbol) ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs">
            <button
              onClick={() => setMetric('YIELD')}
              className={`px-4 py-2 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                metric === 'YIELD'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              Taux de Rendement (% Dividend Yield)
            </button>
            <button
              onClick={() => setMetric('PAYOUT')}
              className={`px-4 py-2 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                metric === 'PAYOUT'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Taux de Distribution (% Payout Ratio)
            </button>
            <button
              onClick={() => setMetric('AMOUNT')}
              className={`px-4 py-2 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                metric === 'AMOUNT'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Dividende Brut (FCFA / Action)
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
            {metric === 'YIELD' && '💡 Formule : (Dividende par Action / Cours moyen annuel) × 100'}
            {metric === 'PAYOUT' && '💡 Formule : (Dividende par Action / Bénéfice Par Action BPA) × 100'}
            {metric === 'AMOUNT' && '💡 Coupon net/brut voté en Assemblée Générale Ordinaire'}
          </div>
        </div>

        {/* Dynamic Recharts Chart */}
        <div className="h-80 sm:h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {metric === 'YIELD' ? (
              <LineChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <RechartsTooltip content={<YieldTooltip metric={metric} />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />

                {selectedSymbols.map((sym) => {
                  const comp = DEMO_COMPANIES.find((c) => c.symbol === sym);
                  return (
                    <Line
                      key={sym}
                      type="monotone"
                      dataKey={sym}
                      name={`${comp?.name || sym} (%)`}
                      stroke={COMPANY_COLORS[sym] || '#2563eb'}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COMPANY_COLORS[sym] || '#2563eb' }}
                      activeDot={{ r: 7 }}
                    />
                  );
                })}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => (metric === 'PAYOUT' ? `${val}%` : `${val} F`)}
                />
                <RechartsTooltip content={<YieldTooltip metric={metric} />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="square"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />

                {selectedSymbols.map((sym) => {
                  const comp = DEMO_COMPANIES.find((c) => c.symbol === sym);
                  return (
                    <Bar
                      key={sym}
                      dataKey={sym}
                      name={comp?.name || sym}
                      fill={COMPANY_COLORS[sym] || '#2563eb'}
                      radius={[6, 6, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Passive Income Calculator */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-black text-white">
                Simulateur de Revenu Passif Comparé
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Calculez la rente de dividende annuelle générée pour votre capital d'investissement.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 ml-2">
              Capital Investi :
            </label>
            <div className="relative">
              <input
                type="number"
                step="500000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Math.max(100000, Number(e.target.value)))}
                className="w-36 bg-white text-slate-900 font-extrabold text-sm px-3 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">FCFA</span>
            </div>
          </div>
        </div>

        {/* Side by side Income Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedCompanies.map(({ company, latestRec, cagr, sharesCount, annualIncome, effectiveYield }) => (
            <div
              key={company.symbol}
              className="p-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {company.sector}
                  </span>
                  <h4 className="text-lg font-black text-white leading-tight mt-0.5">
                    {company.name}
                  </h4>
                  <span className="text-xs text-slate-300 font-mono">({company.symbol})</span>
                </div>
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: COMPANY_COLORS[company.symbol] || '#3b82f6' }}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300">Nombre d'actions :</span>
                  <strong className="text-sm text-white font-extrabold">{sharesCount} actions</strong>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300">Rendement effectif :</span>
                  <strong className="text-sm text-emerald-400 font-black">+{effectiveYield}% / an</strong>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200">Revenu Annuel Passif :</span>
                  <span className="text-base font-black text-emerald-300">{formatFCFA(annualIncome)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>Croissance Dividende (CAGR 5 ans) :</span>
                <span className="font-extrabold text-blue-300">+{cagr}% / an</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Historical Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            Tableau Comparatif du Taux de Distribution & Soutenabilité
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Dernier exercice officiel 2025</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-800">
                <th className="p-4">Entreprise & Symbole</th>
                <th className="p-4">Secteur</th>
                <th className="p-4">Prix Actuel</th>
                <th className="p-4">Dernier Coupon (2025)</th>
                <th className="p-4">Rendement %</th>
                <th className="p-4">Payout Ratio %</th>
                <th className="p-4">CAGR Div. (5 ans)</th>
                <th className="p-4">Diagnostic Soutenabilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {selectedCompanies.map(({ company, latestRec, cagr }) => {
                const payout = latestRec.payoutRatio;
                let statusBadge = (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 w-fit">
                    <CheckCircle2 className="w-3 h-3" /> Soutenable (&lt;75%)
                  </span>
                );

                if (payout >= 90) {
                  statusBadge = (
                    <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 w-fit">
                      <AlertCircle className="w-3 h-3" /> Distribution Maximale (&gt;90%)
                    </span>
                  );
                } else if (payout >= 75) {
                  statusBadge = (
                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 w-fit">
                      <HelpCircle className="w-3 h-3" /> Élevée (75-90%)
                    </span>
                  );
                }

                return (
                  <tr key={company.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{company.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{company.symbol}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold">{company.sector}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                      {formatFCFA(company.currentPrice)}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {formatFCFA(latestRec.dividend)}
                    </td>
                    <td className="p-4 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                      +{latestRec.yieldPercent}%
                    </td>
                    <td className="p-4 font-extrabold text-indigo-700 dark:text-indigo-400">
                      {latestRec.payoutRatio}%
                    </td>
                    <td className="p-4 font-extrabold text-blue-700 dark:text-blue-400">
                      +{cagr}% / an
                    </td>
                    <td className="p-4">{statusBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Recharts Custom Tooltip
const YieldTooltip = ({ active, payload, label, metric }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[210px]">
      <div className="border-b border-slate-700 pb-1.5 flex justify-between items-center">
        <span className="font-extrabold text-blue-300">Exercice {label}</span>
      </div>

      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name} :
            </span>
            <strong className="font-black text-white">
              {metric === 'YIELD' || metric === 'PAYOUT' ? `${p.value}%` : `${formatFCFA(p.value)}`}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};
