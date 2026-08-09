import React, { useState, useMemo } from 'react';
import { DEMO_COMPANIES } from '../../data/demo-data';
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
  initialSymbol = 'SNTS',
  onNavigate,
}) => {
  const { saveSimulation } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [strategy, setStrategy] = useState<'DCA' | 'DRIP' | 'TARGET'>('DCA');
  const [monthlyContribution, setMonthlyContribution] = useState<number>(30000); // 30,000 FCFA/month
  const [horizonYears, setHorizonYears] = useState<number>(5); // 5 years
  const [annualGrowthRate, setAnnualGrowthRate] = useState<number>(6.0); // 6% annual share price growth
  const [targetGoalAmount, setTargetGoalAmount] = useState<number>(5000000); // 5M FCFA for target mode
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedCompany: Company = useMemo(() => {
    return DEMO_COMPANIES.find(c => c.symbol === selectedSymbol) || DEMO_COMPANIES[0];
  }, [selectedSymbol]);

  // Estimate annual dividend yield for chosen company
  const dividendYieldPercent = useMemo(() => {
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

    // Future Value of Annuity Formula: FV = PMT * (((1 + r)^n - 1) / r)
    // PMT = FV / (((1 + r)^n - 1) / r)
    const pmt = targetGoalAmount / (((Math.pow(1 + monthlyRate, totalMonths) - 1)) / monthlyRate);
    return Math.max(5000, Math.round(pmt));
  }, [strategy, targetGoalAmount, horizonYears, monthlyContribution, annualGrowthRate, dividendYieldPercent]);

  // Calculate year-by-year projections
  const projectionResults = useMemo(() => {
    const yearsData = [];
    const sharePrice = selectedCompany.currentPrice || 10000;
    const annualDivPerShare = selectedCompany.lastDividend || Math.round(sharePrice * (dividendYieldPercent / 100));

    let accumulatedShares = 0;
    let totalInvestedOutofPocket = 0;
    let cumulativeDividends = 0;
    let currentSharePrice = sharePrice;

    const monthlyReturnRate = Math.pow(1 + annualGrowthRate / 100, 1 / 12) - 1;
    const divYieldDecimal = dividendYieldPercent / 100;

    for (let yr = 1; yr <= horizonYears; yr++) {
      let yearlyOutofPocket = 0;
      let yearlyDividendsEarned = 0;

      for (let m = 1; m <= 12; m++) {
        // Monthly share price growth
        currentSharePrice *= (1 + monthlyReturnRate);

        // Buy shares with monthly contribution
        yearlyOutofPocket += effectiveMonthlyContribution;
        totalInvestedOutofPocket += effectiveMonthlyContribution;

        const newSharesFromContribution = effectiveMonthlyContribution / currentSharePrice;
        accumulatedShares += newSharesFromContribution;
      }

      // Annual Dividend payout (BRVM companies pay dividends once a year around May-July)
      const annualDivPayout = accumulatedShares * (annualDivPerShare * Math.pow(1 + annualGrowthRate / 100, yr - 1));
      yearlyDividendsEarned = annualDivPayout;
      cumulativeDividends += yearlyDividendsEarned;

      // If strategy is DRIP or DCA with reinvestment, reinvest all dividends to buy extra shares
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

    // Execution roadmap details
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
    if (!projectionResults.finalYear) return;
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
    const doc = new jsPDF();
    const final = projectionResults.finalYear;

    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138); // Deep blue
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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white shadow-xl border border-blue-800/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Plan d'Épargne & d'Investissement Programmé BRVM
            </div>
            <h2 className="text-xl sm:text-3xl font-black">
              Construire un Patrimoine Boursier sur {selectedCompany.name} ({selectedCompany.symbol})
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 max-w-2xl font-medium">
              Simulez la puissance de l'accumulation progressive (DCA) et de l'effet boule de neige des dividendes composés sur la BRVM.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right min-w-[180px]">
            <span className="text-[10px] uppercase font-bold text-blue-300 block">Cours Actuel & Rendement</span>
            <div className="text-xl font-black text-white mt-0.5">{formatFCFA(selectedCompany.currentPrice)}</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              Rendement Div. ~{dividendYieldPercent.toFixed(1)}% / an
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Simulation Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-700" />
            Configuration du Plan d'Investissement
          </h3>

          {/* 1. Select Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
              1. Choisir l'action ciblée
            </label>
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 cursor-pointer"
            >
              {DEMO_COMPANIES.map(comp => (
                <option key={comp.symbol} value={comp.symbol}>
                  {comp.name} ({comp.symbol}) - {formatFCFA(comp.currentPrice)} ({comp.dividendYield ? `${comp.dividendYield}% div` : 'Agrégé'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Strategy */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
              2. Stratégie d'Investissement
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStrategy('DCA')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold ${
                  strategy === 'DCA'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Repeat className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                Versements DCA
              </button>

              <button
                type="button"
                onClick={() => setStrategy('DRIP')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold ${
                  strategy === 'DRIP'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                Boule de Neige
              </button>

              <button
                type="button"
                onClick={() => setStrategy('TARGET')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-extrabold ${
                  strategy === 'TARGET'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Target className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                Objectif Cible
              </button>
            </div>
          </div>

          {/* 3. Monthly Amount or Target Amount */}
          {strategy !== 'TARGET' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <label className="uppercase tracking-wider text-slate-600">
                  3. Versement Mensuel
                </label>
                <span className="text-blue-700 font-black text-sm">{formatFCFA(monthlyContribution)} / mois</span>
              </div>
              <input
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={monthlyContribution}
                onChange={e => setMonthlyContribution(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex gap-2">
                {[15000, 30000, 50000, 100000, 200000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyContribution(amt)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold text-slate-700"
                  >
                    {amt / 1000}k FCFA
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                3. Objectif de Capital à Terme (FCFA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={500000}
                  value={targetGoalAmount}
                  onChange={e => setTargetGoalAmount(Number(e.target.value))}
                  className="w-full p-3 pl-4 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400">FCFA</span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium">
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
                    horizonYears === yrs ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
          {projectionResults.finalYear && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
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

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                    Rente Annuelle Passive
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-indigo-950">
                    {formatFCFA(projectionResults.finalYear.projectedAnnualPassiveIncome)} / an
                  </div>
                  <span className="text-[11px] text-indigo-700 font-bold">
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
          )}
        </div>
      </div>
    </div>
  );
};
