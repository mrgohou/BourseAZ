import React, { useState, useMemo } from 'react';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { Button } from '../ui/Button';
import {
  Sparkles,
  TrendingUp,
  Calculator,
  Repeat,
  Zap,
  ArrowRight,
  PiggyBank,
  CheckCircle2,
  HelpCircle,
  Coins,
  ShieldCheck,
  Percent
} from 'lucide-react';

interface CompactCompoundCalculatorProps {
  defaultInitialCapital?: number;
  defaultMonthlyContribution?: number;
  defaultRate?: number;
  defaultYears?: number;
  onOpenFullCalculator?: () => void;
  className?: string;
}

export const CompactCompoundCalculator: React.FC<CompactCompoundCalculatorProps> = ({
  defaultInitialCapital = 250000,
  defaultMonthlyContribution = 50000,
  defaultRate = 8.5,
  defaultYears = 10,
  onOpenFullCalculator,
  className = '',
}) => {
  const [initialCapital, setInitialCapital] = useState<number>(defaultInitialCapital);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(defaultMonthlyContribution);
  const [annualRate, setAnnualRate] = useState<number>(defaultRate);
  const [years, setYears] = useState<number>(defaultYears);
  const [includeDividendsReinvest, setIncludeDividendsReinvest] = useState<boolean>(true);

  // Quick presets for BRVM investment styles
  const ratePresets = [
    { label: 'Prudent (Obligations)', rate: 6.0, desc: 'Emprunts d’État & Trésor public' },
    { label: 'Équilibré (Dividendes BRVM)', rate: 8.5, desc: 'Moyenne dividendes Sonatel, SGBC, Total' },
    { label: 'Dynamique (Croissance + Coupons)', rate: 12.0, desc: 'Portefeuille diversifié actions à fort potentiel' },
  ];

  // Calculation logic
  const {
    capitalInvested,
    finalWithCompounding,
    finalWithoutCompounding,
    compoundGainBonus,
    totalProfit,
    multiplier,
    yearsToDouble,
  } = useMemo(() => {
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;

    // 1. With compounding (monthly reinvestment)
    let balanceCompounded = initialCapital;
    for (let m = 1; m <= totalMonths; m++) {
      balanceCompounded += monthlyContribution;
      balanceCompounded *= (1 + monthlyRate);
    }

    // 2. Without compounding (simple interest / cash dividends kept in pocket)
    const totalDeposited = initialCapital + (monthlyContribution * totalMonths);
    
    // Average capital for simple return estimation
    const simpleAnnualInterest = totalDeposited * (annualRate / 100) * (years / 2);
    const balanceSimple = totalDeposited + simpleAnnualInterest;

    const finalVal = includeDividendsReinvest ? balanceCompounded : balanceSimple;
    const profit = Math.max(0, finalVal - totalDeposited);
    const bonus = Math.max(0, balanceCompounded - balanceSimple);
    const mult = totalDeposited > 0 ? finalVal / totalDeposited : 1;
    const doubleY = annualRate > 0 ? Math.round((72 / annualRate) * 10) / 10 : 0;

    return {
      capitalInvested: Math.round(totalDeposited),
      finalWithCompounding: Math.round(balanceCompounded),
      finalWithoutCompounding: Math.round(balanceSimple),
      compoundGainBonus: Math.round(bonus),
      totalProfit: Math.round(profit),
      multiplier: mult,
      yearsToDouble: doubleY,
    };
  }, [initialCapital, monthlyContribution, annualRate, years, includeDividendsReinvest]);

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md p-6 sm:p-8 space-y-6 transition-colors ${className}`}
    >
      {/* Header with Title and Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Effet Boule de Neige BRVM
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-['Outfit']">
            Petit Calculateur d'Intérêts Composés
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Projetez la croissance de votre épargne grâce au réinvestissement systématique des dividendes et plus-values d'actions.
          </p>
        </div>

        {onOpenFullCalculator && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenFullCalculator}
            className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 shrink-0 self-start sm:self-center"
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5" />
            Voir le simulateur complet
          </Button>
        )}
      </div>

      {/* Main Interactive Body: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sliders & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          {/* Capital initial */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                Capital de départ
              </label>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">
                {formatFCFA(initialCapital)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2000000}
              step={25000}
              value={initialCapital}
              onChange={e => setInitialCapital(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex gap-1.5 pt-0.5">
              {[0, 100000, 250000, 500000, 1000000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialCapital(amt)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    initialCapital === amt
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {amt === 0 ? '0' : amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Versement mensuel */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-indigo-600" />
                Épargne mensuelle
              </label>
              <span className="font-mono text-indigo-700 dark:text-indigo-400 font-black">
                {formatFCFA(monthlyContribution)} / mois
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={300000}
              step={5000}
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex gap-1.5 pt-0.5">
              {[15000, 25000, 50000, 100000, 150000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setMonthlyContribution(amt)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    monthlyContribution === amt
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Rendement annuel estimé (Dividendes + Plus-values) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                Rendement annuel estimé
              </label>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-black text-sm">
                {annualRate} % / an
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={16}
              step={0.5}
              value={annualRate}
              onChange={e => setAnnualRate(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              {ratePresets.map(preset => (
                <button
                  key={preset.rate}
                  type="button"
                  onClick={() => setAnnualRate(preset.rate)}
                  title={preset.desc}
                  className={`p-1.5 rounded-lg text-center text-[10px] font-extrabold border transition-all cursor-pointer leading-tight ${
                    annualRate === preset.rate
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="block font-black">{preset.rate}%</span>
                  <span className="text-[9px] opacity-80 truncate block">{preset.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Durée de l'investissement */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-extrabold">
              <label className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Durée de placement
              </label>
              <span className="font-mono text-slate-900 dark:text-white font-black text-sm">
                {years} {years > 1 ? 'ans' : 'an'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 5, 10, 15, 20].map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    years === y
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {y} ans
                </button>
              ))}
            </div>
          </div>

          {/* Option Réinvestissement des dividendes */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <label
              onClick={() => setIncludeDividendsReinvest(!includeDividendsReinvest)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat
                  className={`w-4 h-4 ${
                    includeDividendsReinvest ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Réinvestir tous les dividendes
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Effet multiplicateur des intérêts composés
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeDividendsReinvest}
                onChange={e => setIncludeDividendsReinvest(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Right Column: Visual Projection & Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Hero Card: Final Projected Value */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white shadow-xl border-2 border-emerald-800 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Capital Final Projeté à {years} ans
              </span>
              <span className="bg-emerald-800/80 border border-emerald-600 text-emerald-200 text-[11px] font-black px-3 py-1 rounded-full">
                Multiplicateur : {multiplier.toFixed(2)}x
              </span>
            </div>

            <div className="relative z-10">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-['Outfit']">
                {formatFCFA(finalWithCompounding)}
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 font-medium">
                Pour un total épargné de sa poche de <strong className="text-white font-bold">{formatFCFA(capitalInvested)}</strong>.
              </p>
            </div>

            {/* Sub-breakdown: Capital vs Gains */}
            <div className="relative z-10 pt-3 border-t border-emerald-800/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-300/80 block text-[11px]">Capital total versé</span>
                <span className="font-bold text-white text-sm font-mono">{formatFCFA(capitalInvested)}</span>
              </div>
              <div>
                <span className="text-emerald-300/80 block text-[11px]">Intérêts & dividendes gagnés</span>
                <span className="font-bold text-amber-300 text-sm font-mono">+{formatFCFA(totalProfit)}</span>
              </div>
            </div>
          </div>

          {/* Visual Progress Ratio Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Capital versé ({((capitalInvested / (finalWithCompounding || 1)) * 100).toFixed(0)}%)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Intérêts composés ({((totalProfit / (finalWithCompounding || 1)) * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="bg-slate-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (capitalInvested / (finalWithCompounding || 1)) * 100)}%` }}
              />
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.max(0, (totalProfit / (finalWithCompounding || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Side-by-side comparison: With vs Without Reinvesting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Box With Reinvestment */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Avec dividendes réinvestis</span>
              </div>
              <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono">
                {formatFCFA(finalWithCompounding)}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-tight">
                Les dividendes rachètent de nouvelles actions qui versent à leur tour des dividendes.
              </p>
            </div>

            {/* Box Without Reinvestment */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Sans réinvestissement (Cash)</span>
              </div>
              <div className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">
                {formatFCFA(finalWithoutCompounding)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Gains conservés en trésorerie sans effet boule de neige. Écart :{' '}
                <strong className="text-emerald-600 font-bold">+{formatFCFA(compoundGainBonus)}</strong>.
              </p>
            </div>
          </div>

          {/* Rule of 72 Pill */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-amber-900 dark:text-amber-200 font-bold">
                Règle des 72 : à {annualRate}% de rendement, votre capital double tous les{' '}
                <strong className="text-amber-950 dark:text-amber-100 font-black">{yearsToDouble} ans</strong>.
              </span>
            </div>
            <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md font-extrabold shrink-0">
              Formule 72 / R
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
