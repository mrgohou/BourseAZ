import React, { useState, useEffect } from 'react';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES } from '../../data/demo-data';
import { DividendMode, SimulationResult, SimulationOperation } from '../../types';
import { runQuickSimulation } from '../../lib/calculations';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { exportSimulationToCSV, exportSimulationToPDF } from '../../lib/export';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { InvestmentPlanModule } from '../../components/finance/InvestmentPlanModule';
import { CompoundInterestCalculator } from '../../components/finance/CompoundInterestCalculator';
import { CreateAlertModal } from '../../components/alerts/CreateAlertModal';
import { Calculator, Download, Bookmark, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Plus, Trash2, ArrowRight, Target, Sparkles, Bell } from 'lucide-react';

interface SimulationPageProps {
  initialSymbol?: string;
  onNavigate: (path: string) => void;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({ initialSymbol = 'SNTS', onNavigate }) => {
  const { saveSimulation, savedSimulations } = useAuth();
  const [activeTab, setActiveTab] = useState<'plan' | 'compound' | 'quick' | 'advanced'>('plan');

  // Quick Simulation state
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [initialAmount, setInitialAmount] = useState<number>(250000); // Default 250,000 FCFA
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('1Y');
  const [dividendMode, setDividendMode] = useState<DividendMode>('REINVEST');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Advanced Simulation state
  const [advancedOperations, setAdvancedOperations] = useState<Omit<SimulationOperation, 'id'>[]>([
    { type: 'BUY', date: '2025-01-15', quantity: 10, price: 15500, fees: 1000, notes: 'Achat initial' },
    { type: 'BUY', date: '2025-06-20', quantity: 5, price: 16000, fees: 500, notes: 'Achat complémentaire' },
  ]);

  const selectedCompany = DEMO_COMPANIES.find(c => c.symbol === selectedSymbol) || DEMO_COMPANIES[0];

  // Run Quick Simulation automatically or on change
  const handleRunQuickSimulation = () => {
    setErrorMsg(null);
    if (!initialAmount || initialAmount < 5000) {
      setErrorMsg('Veuillez saisir un montant valide d’au moins 5 000 FCFA.');
      setSimulationResult(null);
      return;
    }

    const priceHistory = DEMO_HISTORICAL_PRICES[selectedSymbol];
    if (!priceHistory || priceHistory.length === 0) {
      setErrorMsg(`Historique des cours indisponible pour ${selectedSymbol}.`);
      setSimulationResult(null);
      return;
    }

    const pointsCountMap = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 365 * 3 };
    const count = pointsCountMap[period];
    const slicedHistory = priceHistory.slice(-count);

    if (slicedHistory.length < 2) {
      setErrorMsg('Données historiques insuffisantes pour cette période.');
      setSimulationResult(null);
      return;
    }

    const firstPoint = slicedHistory[0];
    const lastPoint = slicedHistory[slicedHistory.length - 1];

    // Estimate dividends per share during period
    let divPerShare = 0;
    if (selectedCompany.lastDividend) {
      const yearMultiplier = period === '3Y' ? 3 : period === '1Y' ? 1 : period === '6M' ? 0.5 : 0;
      divPerShare = selectedCompany.lastDividend * yearMultiplier;
    }

    try {
      const result = runQuickSimulation({
        symbol: selectedCompany.symbol,
        companyName: selectedCompany.name,
        initialAmount,
        initialPrice: firstPoint.close,
        finalPrice: lastPoint.close,
        startDate: firstPoint.date,
        endDate: lastPoint.date,
        dividendMode,
        dividendsPerShareInPeriod: divPerShare,
      });
      setSimulationResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du calcul de la simulation.');
    }
  };

  useEffect(() => {
    handleRunQuickSimulation();
  }, [selectedSymbol, period, dividendMode]);

  const handleSaveSim = () => {
    if (simulationResult) {
      saveSimulation(simulationResult);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Simulateur d’Investissement Boursier</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Testez vos hypothèses d’investissement en FCFA sur la BRVM et observez la magie des dividendes réinvestis.
        </p>
      </div>

      {/* Simulator Mode Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 sm:gap-6">
        <button
          onClick={() => setActiveTab('plan')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'plan'
              ? 'border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4 text-emerald-600" />
          Plan d'Investissement Personnalisé
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
            Recommandé
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compound')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'compound'
              ? 'border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Calculateur d'Intérêts Composés
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full">
            Calculateur
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quick')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'quick'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Simulation Historique Rapide
        </button>

        <button
          onClick={() => setActiveTab('advanced')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'advanced'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Simulation Multi-Opérations
        </button>
      </div>

      {/* INVESTMENT PLAN MODULE VIEW */}
      {activeTab === 'plan' && (
        <InvestmentPlanModule initialSymbol={selectedSymbol} onNavigate={onNavigate} />
      )}

      {/* COMPOUND INTEREST CALCULATOR VIEW */}
      {activeTab === 'compound' && (
        <CompoundInterestCalculator onNavigate={onNavigate} />
      )}

      {/* QUICK SIMULATION VIEW */}
      {activeTab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form Column */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-700" />
              Paramètres de la Simulation
            </h3>

            {/* 1. Action Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                1. Choisir l'entreprise
              </label>
              <select
                value={selectedSymbol}
                onChange={e => setSelectedSymbol(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 cursor-pointer"
              >
                {DEMO_COMPANIES.map(comp => (
                  <option key={comp.symbol} value={comp.symbol}>
                    {comp.name} ({comp.symbol}) - {formatFCFA(comp.currentPrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Amount in FCFA */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                2. Montant à investir (FCFA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5000}
                  step={5000}
                  value={initialAmount}
                  onChange={e => setInitialAmount(Number(e.target.value))}
                  className="w-full p-3 pl-4 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400">FCFA</span>
              </div>
              <div className="flex gap-2 pt-1">
                {[100000, 250000, 500000, 1000000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialAmount(amt)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold text-slate-700"
                  >
                    {amt >= 1000000 ? `${amt / 1000000} M` : `${amt / 1000} k`} FCFA
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Period */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                3. Période historique
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-extrabold">
                {(['1M', '3M', '6M', '1Y', '3Y'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      period === p ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Dividend Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                4. Traitement des dividendes
              </label>
              <div className="space-y-2 text-xs">
                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${dividendMode === 'REINVEST' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="radio"
                    name="divMode"
                    checked={dividendMode === 'REINVEST'}
                    onChange={() => setDividendMode('REINVEST')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block text-slate-900">Réinvestir en nouvelles actions</span>
                    <span className="text-slate-500 text-[11px]">Les dividendes servent à acheter des titres supplémentaires.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${dividendMode === 'KEEP' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="radio"
                    name="divMode"
                    checked={dividendMode === 'KEEP'}
                    onChange={() => setDividendMode('KEEP')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block text-slate-900">Conserver en trésorerie cash</span>
                    <span className="text-slate-500 text-[11px]">Les dividendes sont encaissés en espèces.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${dividendMode === 'NONE' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="radio"
                    name="divMode"
                    checked={dividendMode === 'NONE'}
                    onChange={() => setDividendMode('NONE')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block text-slate-900">Ne pas inclure les dividendes</span>
                    <span className="text-slate-500 text-[11px]">Considérer uniquement la plus-value du cours.</span>
                  </div>
                </label>
              </div>
            </div>

            <Button className="w-full mt-4" size="lg" onClick={handleRunQuickSimulation}>
              Calculer le résultat
            </Button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            {errorMsg && (
              <Alert type="error" title="Erreur de simulation">
                {errorMsg}
              </Alert>
            )}

            {simulationResult && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6 animate-fade-in">
                {/* Result Top Hero Card */}
                <div
                  className={`p-6 rounded-2xl border text-white space-y-3 ${
                    simulationResult.netGainOrLoss >= 0
                      ? 'bg-gradient-to-br from-emerald-800 to-teal-900 border-emerald-700'
                      : 'bg-gradient-to-br from-rose-800 to-slate-900 border-rose-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-200">
                    <span>Résultat Final Estimé</span>
                    <span>{simulationResult.companySymbol}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                      {formatFCFA(simulationResult.finalValue)}
                    </span>
                    <span className="text-lg font-black bg-white/20 px-3 py-1 rounded-xl">
                      {formatPercent(simulationResult.performancePercent)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/20 text-xs font-semibold flex justify-between">
                    <span>Montant initial: {formatFCFA(simulationResult.initialAmount)}</span>
                    <span>Gain / Perte: {formatFCFA(simulationResult.netGainOrLoss)}</span>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Prix d'achat initial</span>
                    <span className="font-extrabold text-sm text-slate-900">{formatFCFA(simulationResult.initialPrice)}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Prix de clôture final</span>
                    <span className="font-extrabold text-sm text-slate-900">{formatFCFA(simulationResult.finalPrice)}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Actions Détenues</span>
                    <span className="font-extrabold text-sm text-slate-900">{simulationResult.sharesBought} titres</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Dividendes Reçus</span>
                    <span className="font-extrabold text-sm text-emerald-700">{formatFCFA(simulationResult.totalDividendsReceived)}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date de début</span>
                    <span className="font-extrabold text-xs text-slate-800">{simulationResult.startDate}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date de fin</span>
                    <span className="font-extrabold text-xs text-slate-800">{simulationResult.endDate}</span>
                  </div>
                </div>

                {/* Export & Save Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportSimulationToCSV(simulationResult)}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportSimulationToPDF(simulationResult)}
                    >
                      <FileText className="w-4 h-4 mr-1 text-rose-600" />
                      Export PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAlertModalOpen(true)}
                      className="text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 font-extrabold"
                    >
                      <Bell className="w-4 h-4 mr-1 text-amber-600" />
                      Créer Alerte E-mail / Push
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSaveSim}
                    className={savedSuccess ? 'bg-emerald-700 text-white' : ''}
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1 text-white" />
                        Sauvegardé
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-1" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>

                {/* Saved Simulation Toast Banner */}
                {savedSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-900 text-white shadow-xl flex items-center justify-between gap-4 border border-emerald-400/40 animate-scale-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm block">Simulation Enregistrée dans votre Compte !</span>
                        <p className="text-xs text-emerald-200">
                          Accédez aux données de votre simulation à tout moment depuis votre tableau de bord.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onNavigate('/account')}
                      className="bg-white text-emerald-950 hover:bg-emerald-100 font-extrabold text-xs shrink-0"
                    >
                      Voir mon Compte <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Hypotheses List */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">Hypothèses de calcul :</span>
                  <ul className="space-y-1 list-disc pl-5 text-slate-600">
                    {simulationResult.hypotheses.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCED SIMULATION VIEW */}
      {activeTab === 'advanced' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Timeline des Opérations Successives</h3>
              <p className="text-xs text-slate-500">
                Simulez des achats fractionnés à différentes dates et intégrez les frais de courtage.
              </p>
            </div>
          </div>

          {/* Operation Rows */}
          <div className="space-y-3">
            {advancedOperations.map((op, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-blue-700 uppercase bg-blue-100 px-2 py-1 rounded-md">
                  {op.type === 'BUY' ? 'Achat' : 'Vente'} #{index + 1}
                </span>

                <div>
                  <span className="text-slate-400 block text-[10px]">Date</span>
                  <span className="font-bold">{op.date}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Quantité</span>
                  <span className="font-bold">{op.quantity} titres</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Prix d'exécution</span>
                  <span className="font-bold">{formatFCFA(op.price)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Frais</span>
                  <span className="font-bold">{formatFCFA(op.fees)}</span>
                </div>

                <div className="font-extrabold text-slate-900">
                  Total: {formatFCFA(op.quantity * op.price + op.fees)}
                </div>
              </div>
            ))}
          </div>

          <Alert type="info" title="Fonctionnalité Portefeuille Multi-Opérations Avancé">
            Le mode avancé calcule la valeur nette globale du portefeuille en agrégeant vos différents points d'entrée sur l'action sélectionnée.
          </Alert>
        </div>
      )}

      {/* Create Alert Modal from Simulation */}
      <CreateAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        defaultSymbol={selectedSymbol}
        defaultTargetPrice={simulationResult?.finalPrice || selectedCompany.currentPrice}
        simulationNotes={`Alerte créée depuis la simulation ${selectedCompany.symbol} (${period})`}
      />
    </div>
  );
};
