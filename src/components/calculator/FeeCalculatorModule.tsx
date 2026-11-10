import React, { useState } from 'react';
import { Calculator, AlertCircle, Info, CheckCircle2, ArrowRight, FileSpreadsheet, Percent, Coins } from 'lucide-react';
import { formatFCFA, formatPercent } from '../../lib/formatters';

export const FeeCalculatorModule: React.FC = () => {
  const [operationType, setOperationType] = useState<'BUY' | 'SELL'>('BUY');
  const [investmentAmount, setInvestmentAmount] = useState<number>(500000); // 500,000 FCFA
  const [sgiCommissionRate, setSgiCommissionRate] = useState<number>(1.0); // 1.0%
  const [minFee, setMinFee] = useState<number>(2000); // 2,000 FCFA minimum fee
  const [includeVAT, setIncludeVAT] = useState<boolean>(true); // TVA 18% on commissions
  const brvmFeeRate = 0.25; // 0.25% BRVM & DC/BR fee

  // Calculations
  const rawSgiFee = (investmentAmount * sgiCommissionRate) / 100;
  const actualSgiFee = Math.max(rawSgiFee, minFee);
  const brvmFee = (investmentAmount * brvmFeeRate) / 100;
  const vatFee = includeVAT ? (actualSgiFee + brvmFee) * 0.18 : 0;

  const totalFeesFCFA = actualSgiFee + brvmFee + vatFee;
  const totalFeesPercent = investmentAmount > 0 ? (totalFeesFCFA / investmentAmount) * 100 : 0;

  const netInvestedAmount = operationType === 'BUY' 
    ? investmentAmount + totalFeesFCFA 
    : investmentAmount - totalFeesFCFA;

  // Breakeven price increase needed (for BUY operation to break even after round-trip fees)
  const roundTripFeesPercent = totalFeesPercent * 2; // BUY + SELL estimated fees
  const breakevenGainRequiredFCFA = totalFeesFCFA * 2;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header Banner */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold mb-2">
          <Calculator className="w-3.5 h-3.5" />
          Outil Financier Indispensable
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Calculateur de Frais de Courtage SGI & Point d'Équilibre
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Calculez le coût exact de vos ordres de Bourse sur la BRVM (Commission SGI, Redevance BRVM, TVA 18%) et déterminez la hausse minimale requise pour être rentable.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-6 bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <h3 className="font-bold text-slate-900 dark:text-white text-base border-b border-slate-200/80 dark:border-slate-700/80 pb-3 flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Paramètres de l'Ordre de Bourse
          </h3>

          {/* Operation Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Type d'opération
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-xl text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setOperationType('BUY')}
                className={`py-2.5 rounded-lg transition-all cursor-pointer ${
                  operationType === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Achat d'actions
              </button>
              <button
                type="button"
                onClick={() => setOperationType('SELL')}
                className={`py-2.5 rounded-lg transition-all cursor-pointer ${
                  operationType === 'SELL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Vente d'actions
              </button>
            </div>
          </div>

          {/* Montant investi */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Montant brut de la transaction (FCFA)
            </label>
            <div className="relative">
              <input
                type="number"
                min={10000}
                step={10000}
                value={investmentAmount}
                onChange={e => setInvestmentAmount(Number(e.target.value))}
                className="w-full p-3 pl-4 pr-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400">FCFA</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[100000, 250000, 500000, 1000000, 2500000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestmentAmount(amt)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {amt >= 1000000 ? `${amt / 1000000} M` : `${amt / 1000} k`} FCFA
                </button>
              ))}
            </div>
          </div>

          {/* Taux SGI */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Taux de commission SGI (%)
              </label>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{sgiCommissionRate}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={sgiCommissionRate}
              onChange={e => setSgiCommissionRate(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Moyenne observée en zone UEMOA : entre 0,80% et 1,20% selon la SGI.
            </p>
          </div>

          {/* Fee Minimum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Minimum fixe SGI
              </label>
              <input
                type="number"
                value={minFee}
                onChange={e => setMinFee(Number(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                TVA sur commissions
              </label>
              <button
                type="button"
                onClick={() => setIncludeVAT(!includeVAT)}
                className={`w-full p-2.5 rounded-xl border text-xs font-extrabold transition-colors ${
                  includeVAT
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                }`}
              >
                {includeVAT ? 'Oui (18% TVA)' : 'Sans TVA'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Hero Cost Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-6 border border-indigo-900/50">
            <div className="flex justify-between items-center text-xs font-extrabold uppercase tracking-wider text-indigo-300">
              <span>Frais Totaux Calculés</span>
              <span>{operationType === 'BUY' ? 'Ordre d’Achat' : 'Ordre de Vente'}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {formatFCFA(totalFeesFCFA)}
              </span>
              <span className="text-sm font-black bg-white/20 px-3 py-1 rounded-xl text-indigo-200">
                {formatPercent(totalFeesPercent)} du montant
              </span>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Montant Brut de la transaction :</span>
                <span className="font-extrabold text-white">{formatFCFA(investmentAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{operationType === 'BUY' ? 'Débit total net du compte :' : 'Crédit net reçu après frais :'}</span>
                <span className="font-extrabold text-emerald-400">{formatFCFA(netInvestedAmount)}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Detail Table */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 block border-b pb-2">
              Décomposition des Commissions :
            </span>

            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">Commission SGI ({sgiCommissionRate}%) :</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatFCFA(actualSgiFee)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">Redevance BRVM & DC/BR (0,25%) :</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatFCFA(brvmFee)}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-600 dark:text-slate-400">TVA (18% sur services) :</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatFCFA(vatFee)}</span>
            </div>
          </div>

          {/* Breakeven Point Banner */}
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Seuil de Rentabilité (Point d'Équilibre - Aller/Retour)</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              Pour couvrir l’ensemble des frais d’achat ET de revente ultérieurs ({formatFCFA(breakevenGainRequiredFCFA)} au total), le cours de vos actions devra progresser d'au moins <strong className="text-amber-900 dark:text-amber-200 font-black">{formatPercent(roundTripFeesPercent)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
