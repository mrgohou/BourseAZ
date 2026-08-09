import React from 'react';
import { Modal } from '../ui/Modal';
import { Company } from '../../types';
import { calculatePER } from '../../lib/calculations';
import { formatFCFA } from '../../lib/formatters';
import { AlertCircle, Scale, CheckCircle2 } from 'lucide-react';

interface PERExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

export const PERExplanationModal: React.FC<PERExplanationModalProps> = ({ isOpen, onClose, company }) => {
  const perCalc = calculatePER(company.currentPrice, company.eps);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comprendre le PER de ${company.name} (${company.symbol})`}>
      <div className="space-y-6 text-slate-800">
        {/* Definition Box */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-900 font-bold mb-1">
            <Scale className="w-5 h-5 text-blue-700" />
            <span>Qu’est-ce que le PER (Price Earning Ratio) ?</span>
          </div>
          <p className="text-xs text-blue-950 leading-relaxed">
            Le PER indique combien de fois le bénéfice annuel d'une action vous payez pour acheter ce titre.
            C’est le multiple de valorisation référence à la BRVM.
          </p>
        </div>

        {/* Formula Display */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Formule Mathématique</div>
          <div className="text-lg font-black text-slate-900 font-mono">
            PER = Cours de l'action ÷ Bénéfice Par Action (BPA)
          </div>
        </div>

        {/* Current Company Calculation Details */}
        <div className="p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Application directe à {company.symbol}
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Cours actuel du marché :</span>
              <span className="font-extrabold text-sm">{formatFCFA(company.currentPrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">BPA (Bénéfice Par Action) :</span>
              <span className="font-extrabold text-sm">
                {company.eps !== undefined ? `${company.eps} FCFA` : 'Non disponible'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {perCalc.status === 'VALID' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                <div className="font-extrabold text-sm mb-1 flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  PER Calculé : {perCalc.per}
                </div>
                {perCalc.explanation}
              </div>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <div className="font-extrabold text-sm mb-1 flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="w-4 h-4" />
                  PER Non Disponible
                </div>
                {perCalc.explanation}
              </div>
            )}
          </div>
        </div>

        {/* BRVM Benchmarks & Golden Rules */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-900">Repères d'interprétation à la BRVM</h4>
          <ul className="space-y-1.5 list-disc pl-5 text-slate-600">
            <li><strong className="text-slate-800">PER &lt; 10 :</strong> Valorisation attractive ou modérée (très fréquent sur les valeurs bancaires et télécoms).</li>
            <li><strong className="text-slate-800">PER entre 10 et 18 :</strong> Niveau moyen standard du marché.</li>
            <li><strong className="text-slate-800">PER &gt; 20 :</strong> Valorisation élevée. L’action est chère ou les investisseurs anticipent une très forte croissance future.</li>
            <li><strong className="text-slate-800">Règle BourseClair :</strong> Si le BPA est négatif (perte) ou nul, le PER n’est pas défini. Nous affichons explicitement "PER non disponible".</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
