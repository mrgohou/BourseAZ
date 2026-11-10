import React, { useState, useMemo, useEffect } from 'react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { useMarketData } from '../../features/market/MarketContext';
import { Company } from '../../types';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Target,
  TrendingUp,
  Calendar,
  Coins,
  Sparkles,
  CheckCircle2,
  Bookmark,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  PieChart,
  Repeat
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface InvestmentPlanModuleProps {
  initialSymbol?: string;
  onNavigate?: (path: string) => void;
}

export const InvestmentPlanModule: React.FC<InvestmentPlanModuleProps> = ({
  initialSymbol,
  onNavigate,
}) => {
  const { saveSimulation } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>(initialSymbol);

  useEffect(() => {
    setSelectedSymbol(initialSymbol);
  }, [initialSymbol]);

  const [strategy, setStrategy] = useState<'DCA' | 'DRIP' | 'TARGET'>('DCA');
  const [monthlyContribution, setMonthlyContribution] = useState<number>(30000); // 30,000 FCFA/month
  const [horizonYears, setHorizonYears] = useState<number>(5); // 5 years
  const [annualGrowthRate, setAnnualGrowthRate] = useState<number>(6.0); // 6% annual share price growth
  const [targetGoalAmount, setTargetGoalAmount] = useState<number>(5000000); // 5M FCFA for target mode
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { companies } = useMarketData();

  const selectedCompany: Company | undefined = useMemo(() => {
    if (!selectedSymbol) return undefined;
    return (companies && companies.length > 0 ? companies : DEMO_COMPANIES).find(c => c.symbol === selectedSymbol);
  }, [selectedSymbol, companies]);

  // Estimate annual dividend yield for chosen company
  const dividendYieldPercent = useMemo(() => {
    if (!selectedCompany) return 6.5;
    if (selectedCompany.dividendYield) return selectedCompany.dividendYield;
    if (selectedCompany.lastDividend && selectedCompany.currentPrice > 0) {
      return (selectedCompany.lastDividend / selectedCompany.currentPrice) * 100;
    }
    return 6.5; // fallback average BRVM dividend yield
  }, [selectedCompany]);

  // Adjust effective contribution if in TARGET mode
  const effectiveMonthlyContribution = useMemo(() => {
    if (strategy !== 'TARGET') return monthlyContribution;

    // Estimate monthly payment needed to reach targetGoalAmount in horizonYears
    const totalMonths = horizonYears * 12;
    const annualReturn = (annualGrowthRate + dividendYieldPercent) / 100;
    const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;

    if (monthlyRate === 0) return Math.round(targetGoalAmount / totalMonths);

    const pmt = targetGoalAmount / (((Math.pow(1 + monthlyRate, totalMonths) - 1)) / monthlyRate);
    return Math.max(5000, Math.round(pmt));
  }, [strategy, targetGoalAmount, horizonYears, monthlyContribution, annualGrowthRate, dividendYieldPercent]);

  // Calculate year-by-year projections
  const projectionResults = useMemo(() => {
    if (!selectedCompany) return null;

    const yearsData = [];
    const sharePrice = selectedCompany.currentPrice || 10000;
    const annualDivPerShare = selectedCompany.lastDividend || Math.round(sharePrice * (dividendYieldPercent / 100));

    let accumulatedShares = 0;
    let totalInvestedOutofPocket = 0;
    let cumulativeDividends = 0;
    let currentSharePrice = sharePrice;

    const monthlyReturnRate = Math.pow(1 + annualGrowthRate / 100, 1 / 12) - 1;

    for (let yr = 1; yr <= horizonYears; yr++) {
      let yearlyOutofPocket = 0;
      let yearlyDividendsEarned = 0;

      for (let m = 1; m <= 12; m++) {
        currentSharePrice *= (1 + monthlyReturnRate);
        yearlyOutofPocket += effectiveMonthlyContribution;
        totalInvestedOutofPocket += effectiveMonthlyContribution;

        const newSharesFromContribution = effectiveMonthlyContribution / currentSharePrice;
        accumulatedShares += newSharesFromContribution;
      }

      const annualDivPayout = accumulatedShares * (annualDivPerShare * Math.pow(1 + annualGrowthRate / 100, yr - 1));
      yearlyDividendsEarned = annualDivPayout;
      cumulativeDividends += yearlyDividendsEarned;

      if (strategy === 'DRIP' || strategy === 'DCA') {
        const bonusSharesFromDivs = yearlyDividendsEarned / currentSharePrice;
        accumulatedShares += bonusSharesFromDivs;
      }

      const portfolioValue = Math.round(accumulatedShares * currentSharePrice);
      const projectedAnnualPassiveIncome = Math.round(accumulatedShares * (annualDivPerShare * Math.pow(1 + annualGrowthRate / 100, yr)));

      yearsData.push({
        yearLabel: `Année ${yr}`,
        yearNumber: yr,
        totalInvested: Math.round(totalInvestedOutofPocket),
        portfolioValue: portfolioValue,
        cumulativeDividends: Math.round(cumulativeDividends),
        netGain: portfolioValue - totalInvestedOutofPocket,
        accumulatedShares: Math.round(accumulatedShares),
        projectedAnnualPassiveIncome,
        sharePriceAtYearEnd: Math.round(currentSharePrice),
      });
    }

    const finalYear = yearsData[yearsData.length - 1];
    const sharesToBuyMonthly = Math.max(1, Math.round(effectiveMonthlyContribution / sharePrice));
    const monthlyCostEstimate = sharesToBuyMonthly * sharePrice;

    return {
      yearsData,
      finalYear,
      totalInvestedOutofPocket,
      sharesToBuyMonthly,
      monthlyCostEstimate,
      initialSharePrice: sharePrice,
      dividendYieldPercent,
    };
  }, [
    selectedCompany,
    effectiveMonthlyContribution,
    horizonYears,
    annualGrowthRate,
    dividendYieldPercent,
    strategy
  ]);

  const handleSavePlan = () => {
    if (!selectedCompany || !projectionResults || !projectionResults.finalYear) return;
    const resultToSave = {
      id: `plan-${Date.now()}`,
      symbol: selectedCompany.symbol,
      companySymbol: selectedCompany.symbol,
      companyName: selectedCompany.name,
      initialAmount: projectionResults.totalInvestedOutofPocket,
      initialPrice: selectedCompany.currentPrice,
      finalPrice: projectionResults.finalYear.sharePriceAtYearEnd,
      finalValue: projectionResults.finalYear.portfolioValue,
      netGainOrLoss: projectionResults.finalYear.netGain,
      performancePercent: ((projectionResults.finalYear.portfolioValue - projectionResults.totalInvestedOutofPocket) / projectionResults.totalInvestedOutofPocket) * 100,
      sharesBought: projectionResults.finalYear.accumulatedShares,
      totalDividendsReceived: projectionResults.finalYear.cumulativeDividends,
      startDate: new Date().toISOString().split('T')[0],
      endDate: `${new Date().getFullYear() + horizonYears}-01-01`,
      dividendMode: 'REINVEST' as const,
      hypotheses: [
        `Plan d'investissement programmation mensuel : ${formatFCFA(effectiveMonthlyContribution)} / mois sur ${horizonYears} an(s).`,
        `Rendement annuel des dividendes estimé : ${dividendYieldPercent.toFixed(1)}%.`,
        `Hypothèse de revalorisation annuelle du cours : ${annualGrowthRate}%.`,
        `Génération d'une rente annuelle passive estimée à terme : ${formatFCFA(projectionResults.finalYear.projectedAnnualPassiveIncome)} / an.`,
      ],
      createdAt: new Date().toISOString(),
    };

    saveSimulation(resultToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportPDF = () => {
    if (!selectedCompany || !projectionResults || !projectionResults.finalYear) return;
    const doc = new jsPDF();
    const final = projectionResults.finalYear;

    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text(`Plan d'Investissement BourseClair - ${selectedCompany.name}`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
    doc.text(`Action ciblée : ${selectedCompany.name} (${selectedCompany.symbol})`, 14, 35);
    doc.text(`Cours actuel : ${formatFCFA(selectedCompany.currentPrice)} FCFA`, 14, 42);

    doc.line(14, 48, 196, 48);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Objectifs & Projections Financières", 14, 58);

    doc.setFontSize(11);
    doc.text(`- Horizon d'investissement : ${horizonYears} ans`, 14, 68);
    doc.text(`- Effort d'épargne mensuel : ${formatFCFA(effectiveMonthlyContribution)} / mois`, 14, 76);
    doc.text(`- Capital total versé de votre poche : ${formatFCFA(projectionResults.totalInvestedOutofPocket)}`, 14, 84);
    doc.text(`- Valeur projetée du portefeuille à terme : ${formatFCFA(final.portfolioValue)}`, 14, 92);
    doc.text(`- Cumul des dividendes perçus : ${formatFCFA(final.cumulativeDividends)}`, 14, 100);
    doc.text(`- Nombre total d'actions accumulées : ${final.accumulatedShares} actions`, 14, 108);
    doc.text(`- Rente annuelle passive estimée à terme : ${formatFCFA(final.projectedAnnualPassiveIncome)} / an`, 14, 116);

    doc.line(14, 124, 196, 124);

    doc.setFontSize(14);
    doc.text("Plan d'Exécution Mensuelle Recommandé", 14, 134);

    doc.setFontSize(11);
    doc.text(`1. Ordre d'achat récurrent : Acheter environ ${projectionResults.sharesToBuyMonthly} action(s) ${selectedCompany.symbol} chaque mois.`, 14, 144);
    doc.text(`2. Réinvestissement des dividendes : Réinvestir systématiquement vos dividendes annuels`, 14, 152);
    doc.text(`   lors de la distribution de Mai/Juin pour accélérer l'effet cumulatif.`, 14, 158);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Note : Ce document est une simulation pédagogique BourseClair basée sur des hypothèses de marché.", 14, 280);

    doc.save(`Plan_Investissement_${selectedCompany.symbol}_BourseClair.pdf`);
  };

  const handleExportCSV = () => {
    if (!selectedCompany || !projectionResults) return;
    let csv = "Annee,Capital_Investi_FCFA,Valeur_Portefeuille_FCFA,Dividendes_Cumules_FCFA,Plus_Value_FCFA,Nombre_Actions,Rente_Annuelle_FCFA\n";
    projectionResults.yearsData.forEach(row => {
      csv += `${row.yearNumber},${row.totalInvested},${row.portfolioValue},${row.cumulativeDividends},${row.netGain},${row.accumulatedShares},${row.projectedAnnualPassiveIncome}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Plan_Investissement_${selectedCompany.symbol}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Hero */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white shadow-xl border border-emerald-900/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Plan d'Épargne & d'Investissement Programmé BRVM
            </div>
            <h2 className="text-xl sm:text-3xl font-black">
              {selectedCompany
                ? `Construire un Patrimoine Boursier sur ${selectedCompany.name} (${selectedCompany.symbol})`
                : "Construire un Patrimoine Boursier sur la BRVM"}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl font-medium">
              {selectedCompany
                ? "Simulez la puissance de l'accumulation progressive (DCA) et de l'effet boule de neige des dividendes composés sur la BRVM."
                : "Sélectionnez une entreprise ci-dessous pour simuler votre plan d'épargne et d'investissement sur la BRVM."}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right min-w-[180px]">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Cours Actuel & Rendement</span>
            <div className="text-xl font-black text-white mt-0.5">
              {selectedCompany ? formatFCFA(selectedCompany.currentPrice) : '-- FCFA'}
            </div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              {selectedCompany ? `Rendement Div. ~${dividendYieldPercent.toFixed(1)}% / an` : 'Sélectionner une action'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Simulation Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Configuration du Plan d'Investissement
          </h3>

          {/* 1. Select Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              1. Choisir l'action ciblée
            </label>
            <select
              value={selectedSymbol || ''}
              onChange={e => setSelectedSymbol(e.target.value || undefined)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">-- Choisir une entreprise à simuler --</option>
              {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).map(comp => (
                <option key={comp.symbol} value={comp.symbol}>
                  {comp.name} ({comp.symbol}) - {formatFCFA(comp.currentPrice)} ({comp.dividendYield ? `${comp.dividendYield}% div` : 'Agrégé'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Strategy */}
          <div className="space-y-2.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              2. Stratégie d'Investissement
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStrategy('DCA')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-extrabold flex flex-col items-center justify-center gap-1.5 ${
                  strategy === 'DCA'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 opacity-40 hover:opacity-75 grayscale'
                }`}
              >
                <Repeat className={`w-4 h-4 ${strategy === 'DCA' ? 'text-white' : 'text-slate-400'}`} />
                <span>Versements réguliers</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('DRIP')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-extrabold flex flex-col items-center justify-center gap-1.5 ${
                  strategy === 'DRIP'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 opacity-40 hover:opacity-75 grayscale'
                }`}
              >
                <Coins className={`w-4 h-4 ${strategy === 'DRIP' ? 'text-white' : 'text-slate-400'}`} />
                <span>Boule de neige</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('TARGET')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-extrabold flex flex-col items-center justify-center gap-1.5 ${
                  strategy === 'TARGET'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 opacity-40 hover:opacity-75 grayscale'
                }`}
              >
                <Target className={`w-4 h-4 ${strategy === 'TARGET' ? 'text-white' : 'text-slate-400'}`} />
                <span>Objectif Cible</span>
              </button>
            </div>

            {/* Strategy Description Box in Simple Terms */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5 transition-all">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {strategy === 'DCA' && 'Mode : Versements réguliers'}
                  {strategy === 'DRIP' && 'Mode : Boule de neige (Dividendes réinvestis)'}
                  {strategy === 'TARGET' && 'Mode : Objectif Cible'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                {strategy === 'DCA' && "💡 Vous investissez une somme fixe de votre choix chaque mois (ex: 30 000 FCFA). C'est la méthode la plus simple et sereine pour accumuler des actions progressivement sans vous soucier des variations quotidiennes de la bourse."}
                {strategy === 'DRIP' && "💡 En plus de vos versements mensuels, tous les dividendes en cash versés chaque année par l'entreprise sont automatiquement réinvestis pour acheter de nouvelles actions. Votre capital grossit ainsi de plus en plus vite."}
                {strategy === 'TARGET' && "💡 Vous fixez le montant total que vous souhaitez atteindre à terme (ex: 5 000 000 FCFA). Le simulateur calcule automatiquement l'effort d'épargne mensuel exact à mettre de côté pour y arriver."}
              </p>
            </div>
          </div>

          {/* 3. Monthly Amount or Target Amount */}
          {strategy !== 'TARGET' ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <label className="uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  3. Versement Mensuel
                </label>
                <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">{formatFCFA(monthlyContribution)} / mois</span>
              </div>

              {/* Saisie directe du montant par l'utilisateur */}
              <div className="relative">
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={monthlyContribution || ''}
                  onChange={e => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                  placeholder="Saisissez votre versement mensuel..."
                  className="w-full p-3 pl-4 pr-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400 dark:text-slate-500">FCFA / mois</span>
              </div>

              {/* Curseur et raccourcis rapide */}
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={monthlyContribution}
                onChange={e => setMonthlyContribution(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex flex-wrap gap-1.5">
                {[15000, 30000, 50000, 100000, 200000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyContribution(amt)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition cursor-pointer ${
                      monthlyContribution === amt
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000} M` : `${amt / 1000}k`} FCFA
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                3. Objectif de Capital à Terme (FCFA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={500000}
                  value={targetGoalAmount}
                  onChange={e => setTargetGoalAmount(Number(e.target.value))}
                  className="w-full p-3 pl-4 pr-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400">FCFA</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Effort mensuel calculé automatiquement : <strong>{formatFCFA(effectiveMonthlyContribution)} / mois</strong>
              </p>
            </div>
          )}

          {/* 4. Investment Horizon */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
              4. Horizon Temporel ({horizonYears} Ans)
            </label>
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-extrabold">
              {[1, 3, 5, 10, 15].map(yrs => (
                <button
                  key={yrs}
                  type="button"
                  onClick={() => setHorizonYears(yrs)}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    horizonYears === yrs ? 'bg-white text-emerald-700 dark:bg-slate-800 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {yrs} An{yrs > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Hypotheses Settings */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
            <span className="font-extrabold text-slate-800 block">Hypothèses de croissance :</span>
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600">Revalorisation annuelle du cours :</span>
                <span className="font-bold text-slate-900">{annualGrowthRate}% / an</span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.5}
                value={annualGrowthRate}
                onChange={e => setAnnualGrowthRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
            </div>

            <div className="flex justify-between font-medium pt-1 border-t border-slate-200">
              <span className="text-slate-600">Rendement estimé des dividendes :</span>
              <span className="font-bold text-emerald-700">+{dividendYieldPercent.toFixed(1)}% / an</span>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary & Charts */}
        <div className="lg:col-span-7 space-y-6">
          {projectionResults && projectionResults.finalYear ? (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
              {/* Target Results Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Capital Total Investi
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatFCFA(projectionResults.totalInvestedOutofPocket)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {formatFCFA(effectiveMonthlyContribution)} / mois sur {horizonYears} an(s)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-900 text-white space-y-1 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                    Valeur Portefeuille Projetée
                  </span>
                  <div className="text-xl sm:text-2xl font-black">
                    {formatFCFA(projectionResults.finalYear.portfolioValue)}
                  </div>
                  <span className="text-[11px] text-emerald-300 font-bold">
                    Gain net : +{formatFCFA(projectionResults.finalYear.netGain)} (+{(((projectionResults.finalYear.portfolioValue - projectionResults.totalInvestedOutofPocket) / projectionResults.totalInvestedOutofPocket) * 100).toFixed(0)}%)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    Rente Annuelle Passive
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
                    {formatFCFA(projectionResults.finalYear.projectedAnnualPassiveIncome)} / an
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                    Revenu passif issu des dividendes
                  </span>
                </div>
              </div>

              {/* Evolution Projection Chart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Courbe de Croissance du Capital vs Effet de Levier
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    Horizon {horizonYears} ans
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionResults.yearsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="yearLabel" tickLine={false} style={{ fontSize: '11px', fontWeight: 600 }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={val => `${(val / 1000000).toFixed(1)}M`}
                        style={{ fontSize: '11px', fontWeight: 600 }}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatFCFA(Number(value)), '']}
                        labelStyle={{ fontWeight: 'bold' }}
                        contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="portfolioValue"
                        name="Valeur Portefeuille (Cumul)"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPortfolio)"
                      />
                      <Area
                        type="monotone"
                        dataKey="totalInvested"
                        name="Capital Investi (Votre Poche)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorInvested)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Actionable Execution Roadmap */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-sm">Feuille de Route d'Exécution Mensuelle</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-amber-300 font-bold block">1. Acheter mensuellement :</span>
                    <p className="text-slate-300 leading-relaxed">
                      Passez un ordre d'achat d'environ <strong>{projectionResults.sharesToBuyMonthly} action(s)</strong> de {selectedCompany.symbol} vers le 5 de chaque mois (budget : ~{formatFCFA(projectionResults.monthlyCostEstimate)}).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                    <span className="text-emerald-300 font-bold block">2. Réinvestir en Mai / Juin :</span>
                    <p className="text-slate-300 leading-relaxed">
                      Lors du paiement annuel des dividendes BRVM, réinvestissez intégralement vos gains pour racheter des titres {selectedCompany.symbol} supplémentaires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export & Save Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
                    Exporter CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-1 text-rose-600" />
                    Télécharger le Plan PDF
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSavePlan}
                  className={savedSuccess ? 'bg-emerald-700 text-white' : ''}
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Plan Sauvegardé
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" />
                      Sauvegarder dans Mon Compte
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 text-center space-y-5 shadow-2xs">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Target className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Aucune action sélectionnée
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Veuillez choisir une entreprise dans la liste déroulante à gauche pour afficher la simulation de votre plan d'investissement, vos projections de capital et votre rente annuelle.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
