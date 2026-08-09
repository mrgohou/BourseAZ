import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import {
  TrendingUp,
  Sparkles,
  Calculator,
  Calendar,
  DollarSign,
  Zap,
  Info,
  CheckCircle2,
  Download,
  Bookmark,
  Award,
  HelpCircle
} from 'lucide-react';

interface YearBreakdown {
  year: number;
  capitalInvested: number;
  interestEarned: number;
  totalValue: number;
  interestPercentage: number;
}

export const CompoundInterestCalculator: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { saveSimulation } = useAuth();

  // Inputs
  const [initialCapital, setInitialCapital] = useState<number>(500000); // 500,000 FCFA
  const [monthlyContribution, setMonthlyContribution] = useState<number>(50000); // 50,000 FCFA/mo
  const [annualRate, setAnnualRate] = useState<number>(8.5); // 8.5%
  const [durationYears, setDurationYears] = useState<number>(10); // 10 years
  const [compoundingFrequency, setCompoundingFrequency] = useState<number>(12); // 12 = monthly, 1 = yearly
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Presets for BRVM yields
  const handlePresetRate = (rate: number) => {
    setAnnualRate(rate);
  };

  // Calculation logic
  const { yearlyData, finalValue, totalInvested, totalInterest, multiplier, yearsToDouble } = useMemo(() => {
    const data: YearBreakdown[] = [];
    let currentBalance = initialCapital;
    let accumulatedContributions = initialCapital;

    const ratePerPeriod = annualRate / 100 / compoundingFrequency;
    const periodsPerYear = compoundingFrequency;
    const monthlyDeposit = monthlyContribution;

    for (let y = 1; y <= durationYears; y++) {
      for (let p = 1; p <= periodsPerYear; p++) {
        // Add monthly contribution scaled by compounding frequency
        const depositThisPeriod = monthlyDeposit * (12 / periodsPerYear);
        currentBalance += depositThisPeriod;
        accumulatedContributions += depositThisPeriod;

        // Apply interest
        currentBalance *= (1 + ratePerPeriod);
      }

      const interest = currentBalance - accumulatedContributions;
      const pct = currentBalance > 0 ? (interest / currentBalance) * 100 : 0;

      data.push({
        year: y,
        capitalInvested: Math.round(accumulatedContributions),
        interestEarned: Math.round(interest),
        totalValue: Math.round(currentBalance),
        interestPercentage: Math.round(pct * 10) / 10,
      });
    }

    const final = data.length > 0 ? data[data.length - 1].totalValue : initialCapital;
    const invested = data.length > 0 ? data[data.length - 1].capitalInvested : initialCapital;
    const interest = final - invested;
    const mult = invested > 0 ? final / invested : 1;
    const doubleYears = annualRate > 0 ? Math.round((72 / annualRate) * 10) / 10 : 0;

    return {
      yearlyData: data,
      finalValue: final,
      totalInvested: invested,
      totalInterest: interest,
      multiplier: mult,
      yearsToDouble: doubleYears,
    };
  }, [initialCapital, monthlyContribution, annualRate, durationYears, compoundingFrequency]);

  const handleSaveToAccount = () => {
    saveSimulation({
      id: `compound-${Date.now()}`,
      title: `Simulation Intérêts Composés (${durationYears} ans à ${annualRate}%)`,
      symbol: 'PORTFOLIO_COMPOUND',
      companyName: 'Stratégie Épargne & Intérêts Composés BRVM',
      initialAmount: initialCapital,
      finalAmount: finalValue,
      netProfit: totalInterest,
      roiPercent: Math.round(((finalValue - totalInvested) / totalInvested) * 100),
      periodDays: durationYears * 365,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + durationYears * 365 * 86400000).toISOString().split('T')[0],
      dividendMode: 'REINVEST',
      dividendsCollected: totalInterest,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Année', 'Capital Investi (FCFA)', 'Intérêts Cumulés (FCFA)', 'Valeur Totale (FCFA)', 'Part Intérêts (%)'];
    const rows = yearlyData.map(d => [
      `Année ${d.year}`,
      d.capitalInvested,
      d.interestEarned,
      d.totalValue,
      `${d.interestPercentage}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `simulation_interets_composes_${durationYears}ans.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner Intro */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/40">
            <TrendingUp className="w-3.5 h-3.5" />
            La Puissance du Capitalisme BRVM
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Calculateur d'Intérêts Composés
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Découvrez comment vos versements réguliers et le réinvestissement de vos plus-values & dividendes transforment une épargne modeste en un véritable patrimoine financier à long terme sur la BRVM.
          </p>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Paramètres d’Investissement
          </h3>

          {/* Capital Initial */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Capital Initial
              </label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                FCFA
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={25000}
                value={initialCapital}
                onChange={e => setInitialCapital(Math.max(0, Number(e.target.value)))}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Acompte ou versement initial au démarrage.
            </p>
          </div>

          {/* Versement Mensuel */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Versement Mensuel Régulier
              </label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                FCFA / mois
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={5000}
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Somme épargnée chaque mois depuis votre salaire ou revenu.
            </p>
          </div>

          {/* Taux Annuel Estimé & Presets */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Taux d’intérêt / Rendement Annuel (%)
              </label>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {annualRate} %
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={0.5}
              value={annualRate}
              onChange={e => setAnnualRate(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            
            {/* Presets buttons */}
            <div className="pt-1 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePresetRate(5)}
                className={`px-2.5 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  annualRate === 5
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                5% (Bons du Trésor)
              </button>
              <button
                type="button"
                onClick={() => handlePresetRate(8.5)}
                className={`px-2.5 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  annualRate === 8.5
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                8.5% (Moyenne BRVM)
              </button>
              <button
                type="button"
                onClick={() => handlePresetRate(12)}
                className={`px-2.5 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  annualRate === 12
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                12% (Croissance)
              </button>
            </div>
          </div>

          {/* Durée du placement */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Horizon de Placement (Années)
              </label>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {durationYears} {durationYears > 1 ? 'ans' : 'an'}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={durationYears}
              onChange={e => setDurationYears(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-bold px-0.5">
              <span>1 an</span>
              <span>10 ans</span>
              <span>20 ans</span>
              <span>30 ans</span>
            </div>
          </div>

          {/* Fréquence des intérêts */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Fréquence de Capitalisation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCompoundingFrequency(12)}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  compoundingFrequency === 12
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Mensuelle
              </button>
              <button
                type="button"
                onClick={() => setCompoundingFrequency(2)}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  compoundingFrequency === 2
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Semestrielle
              </button>
              <button
                type="button"
                onClick={() => setCompoundingFrequency(1)}
                className={`p-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  compoundingFrequency === 1
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Annuelle
              </button>
            </div>
          </div>
        </div>

        {/* Results & Visuals Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Final Value */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg space-y-2 border border-emerald-400/30 sm:col-span-3">
              <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider">
                <span>Valeur Totale Finale de l'Épargne</span>
                <span className="bg-emerald-500/30 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black border border-emerald-400/40">
                  {durationYears} ans
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {formatFCFA(finalValue)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-500/40 text-xs text-emerald-100 font-medium">
                <span>Multiplicateur : <strong className="text-white font-black">{multiplier.toFixed(2)}x</strong> le montant versé</span>
                <span>Rendement moyen : <strong className="text-white font-black">{annualRate}% / an</strong></span>
              </div>
            </div>

            {/* Total Invested */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                Capital Total Versé
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {formatFCFA(totalInvested)}
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block">
                (Mise initiale + versements)
              </span>
            </div>

            {/* Total Interest Earned */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 shadow-xs space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300 block">
                Intérêts Composés Gagnés
              </span>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                +{formatFCFA(totalInterest)}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                ({finalValue > 0 ? ((totalInterest / finalValue) * 100).toFixed(1) : 0}% du total)
              </span>
            </div>

            {/* Rule of 72 Card */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-amber-900 dark:text-amber-300 block">
                  Règle des 72
                </span>
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-lg font-black text-amber-900 dark:text-amber-200">
                {yearsToDouble} ans
              </div>
              <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold block">
                Temps estimé pour doubler votre capital
              </span>
            </div>
          </div>

          {/* Recharts Compound Growth Stack Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Trajectoire de Croissance du Portefeuille (FCFA)
              </h4>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-3 h-3 rounded-xs bg-slate-400"></span> Capital
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Intérêts
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="year" tickLine={false} tickFormatter={y => `An ${y}`} stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={val => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatFCFA(Number(value)),
                      name === 'capitalInvested' ? 'Capital Versé' : 'Intérêts Cumulés',
                    ]}
                    labelFormatter={label => `Année ${label}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '16px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="capitalInvested"
                    stackId="1"
                    stroke="#64748b"
                    fill="#94a3b8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="interestEarned"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Buttons: Save & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveToAccount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs"
              >
                <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                {saveSuccess ? 'Simulation Enregistrée !' : 'Enregistrer dans mon Compte'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="text-xs font-extrabold border-slate-300 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exporter CSV
              </Button>
            </div>

            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Visible sur votre tableau de bord
              </span>
            )}
          </div>

          {/* Educational Note: Rule of 72 & Compound Magic */}
          <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500" />
              Pourquoi les Intérêts Composés fonctionnent si bien à la BRVM ?
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              À la BRVM, de nombreuses grandes valeurs (comme <strong>Sonatel</strong>, <strong>Ecobank CI</strong> ou <strong>Solibra</strong>) procurent des rendements en dividendes élevés (entre 6% et 10% net). En <strong>réinvestissant automatiquement</strong> chaque dividende reçu dans de nouvelles actions, les dividendes de l'année suivante portent à leur tour sur un nombre d'actions plus grand : c'est l'effet boule de neige !
            </p>
          </div>
        </div>
      </div>

      {/* Year-by-Year Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Tableau d’Évolution Année par Année
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
            Horizon : {durationYears} ans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3">Année</th>
                <th className="py-3 px-3">Capital Versé (FCFA)</th>
                <th className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Intérêts Cumulés (FCFA)</th>
                <th className="py-3 px-3">Valeur Totale (FCFA)</th>
                <th className="py-3 px-3 text-right">Part des Intérêts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {yearlyData.map(row => (
                <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                    Année {row.year}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {formatFCFA(row.capitalInvested)}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{formatFCFA(row.interestEarned)}
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                    {formatFCFA(row.totalValue)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-600 dark:text-slate-400">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {row.interestPercentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
