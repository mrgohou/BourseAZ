import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { BRVM_SGI_LIST } from '../../data/sgi-data';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { useMarketData } from '../../features/market/MarketContext';
import { formatFCFA } from '../../lib/formatters';
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  Zap
} from 'lucide-react';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  defaultTargetPrice?: number;
  defaultCondition?: 'ABOVE' | 'BELOW';
  simulationNotes?: string;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  defaultSymbol = 'SNTS',
  defaultTargetPrice,
  defaultCondition = 'ABOVE',
  simulationNotes = '',
}) => {
  const { user, addPriceAlert, triggerSimulatedAlert } = useAuth();
  const { companies } = useMarketData();

  const [symbol, setSymbol] = useState(defaultSymbol);
  const selectedCompany = (companies && companies.length > 0 ? companies : DEMO_COMPANIES).find(c => c.symbol === symbol) || DEMO_COMPANIES[0];

  const currentPrice = selectedCompany.currentPrice;

  const [targetPrice, setTargetPrice] = useState<number>(() => {
    if (defaultTargetPrice && defaultTargetPrice > 0) return defaultTargetPrice;
    return Math.round(currentPrice * 1.1); // Default +10%
  });

  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>(defaultCondition);
  const [notificationType, setNotificationType] = useState<'EMAIL' | 'PUSH' | 'BOTH'>('BOTH');
  const [emailRecipient, setEmailRecipient] = useState(user?.email || 'investisseur@bourseclair.ci');
  const [phoneRecipient, setPhoneRecipient] = useState(user?.phone || '+225 07 00 00 00 00');
  const [notes, setNotes] = useState(simulationNotes || `Objectif de cours suivi pour ${selectedCompany.name}`);
  const [isSuccess, setIsSuccess] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Quick percent helpers
  const applyPercentDelta = (percent: number) => {
    const newPrice = Math.round(currentPrice * (1 + percent / 100));
    setTargetPrice(newPrice);
    if (percent > 0) {
      setCondition('ABOVE');
    } else {
      setCondition('BELOW');
    }
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    const company = (companies && companies.length > 0 ? companies : DEMO_COMPANIES).find(c => c.symbol === newSymbol);
    if (company) {
      setTargetPrice(Math.round(company.currentPrice * 1.1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetPrice || targetPrice <= 0) {
      alert('Veuillez spécifier un cours cible valide supérieur à 0 FCFA.');
      return;
    }

    const created = addPriceAlert({
      companySymbol: selectedCompany.symbol,
      companyName: selectedCompany.name,
      targetPrice,
      condition,
      notificationType,
      emailRecipient,
      phoneRecipient,
      notes,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  const priceDiffPercent = (((targetPrice - currentPrice) / currentPrice) * 100).toFixed(1);
  const isPositiveDiff = targetPrice >= currentPrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une Alerte de Cours BRVM" size="lg">
      {isSuccess ? (
        <div className="py-8 text-center space-y-4 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Alerte Programmée avec Succès !</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium">
            Vous recevrez une notification par{' '}
            {notificationType === 'BOTH'
              ? 'E-mail & Push App'
              : notificationType === 'EMAIL'
              ? 'E-mail'
              : 'Notification Push'}{' '}
            dès que le cours de <strong>{selectedCompany.name}</strong> atteindra <strong>{formatFCFA(targetPrice)}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header context info */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <span className="font-extrabold block text-indigo-900">
                Alerte Intelligente BourseClair (E-mail & Push)
              </span>
              <p className="leading-relaxed font-medium">
                Fixez votre seuil d'achat ou de prise de bénéfices directement à partir de vos simulations. Notre moteur surveille la cote BRVM et vous prévient instantanément.
              </p>
            </div>
          </div>

          {/* Action selection & current quote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Action BRVM à Surveiller
              </label>
              <select
                value={symbol}
                onChange={e => handleSymbolChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-900 outline-none focus:border-blue-600"
              >
                {(companies && companies.length > 0 ? companies : DEMO_COMPANIES).map(c => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} - {c.name} ({formatFCFA(c.currentPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Cours Actuel au Marché</span>
              <div className="text-lg font-black text-slate-900 flex items-center justify-between mt-0.5">
                <span>{formatFCFA(currentPrice)}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedCompany.dayChangePercent >= 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedCompany.dayChangePercent >= 0 ? '+' : ''}
                  {selectedCompany.dayChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Target Price Configuration */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Seuil Déclencheur (Prix Cible en FCFA)
              </label>

              <span className="text-xs font-extrabold text-indigo-700">
                Écart : {isPositiveDiff ? '+' : ''}{priceDiffPercent}% par rapport au cours
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="25"
                  min="1"
                  value={targetPrice}
                  onChange={e => setTargetPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-base font-black text-slate-900 outline-none focus:border-blue-600 shadow-xs"
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-extrabold text-slate-400">
                  FCFA
                </span>
              </div>

              {/* Condition Toggle Button */}
              <button
                type="button"
                onClick={() => setCondition(condition === 'ABOVE' ? 'BELOW' : 'ABOVE')}
                className={`px-4 py-3 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-rose-600 text-white border-rose-700 shadow-xs'
                }`}
              >
                {condition === 'ABOVE' ? (
                  <>
                    <TrendingUp className="w-4 h-4" /> Franchit vers le haut (&ge;)
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" /> Franchit vers le bas (&le;)
                  </>
                )}
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] font-bold">
              <span className="text-slate-400 mr-1">Raccourcis :</span>
              <button
                type="button"
                onClick={() => applyPercentDelta(-10)}
                className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
              >
                -10% Baisse
              </button>
              <button
                type="button"
                onClick={() => applyPercentDelta(-5)}
                className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
              >
                -5% Support
              </button>
              <button
                type="button"
                onClick={() => applyPercentDelta(5)}
                className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
              >
                +5% Hausse
              </button>
              <button
                type="button"
                onClick={() => applyPercentDelta(10)}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
              >
                +10% Objectif
              </button>
            </div>
          </div>

          {/* Notification Method Selection */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Canaux de Réception des Alertes
              </label>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                {notificationType === 'BOTH' ? 'E-mail + Push Web (Recommandé)' : notificationType === 'EMAIL' ? 'E-mail uniquement' : 'Push Navigateur uniquement'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choisissez comment vous souhaitez être averti lors du franchissement de cours. Vous pouvez combiner l'e-mail et le push pour ne rater aucune opportunité.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: E-mail */}
              <div
                onClick={() => {
                  if (notificationType === 'PUSH') setNotificationType('BOTH');
                  else if (notificationType === 'BOTH') setNotificationType('PUSH');
                  else setNotificationType('BOTH'); // if was EMAIL, keeping both is better than none
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  notificationType === 'EMAIL' || notificationType === 'BOTH'
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-400 dark:ring-blue-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notificationType === 'EMAIL' || notificationType === 'BOTH'}
                  onChange={() => {}} // handled by parent div
                  className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Notification par E-mail</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Rapport complet avec cours actuel, écart et contexte envoyé dans votre boîte de réception.
                  </p>
                </div>
              </div>

              {/* Option 2: Push Web */}
              <div
                onClick={() => {
                  if (notificationType === 'EMAIL') setNotificationType('BOTH');
                  else if (notificationType === 'BOTH') setNotificationType('EMAIL');
                  else setNotificationType('BOTH'); // if was PUSH, toggle to BOTH
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  notificationType === 'PUSH' || notificationType === 'BOTH'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-400 dark:ring-emerald-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notificationType === 'PUSH' || notificationType === 'BOTH'}
                  onChange={() => {}} // handled by parent div
                  className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Push Navigateur (Écran)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Bannière pop-up instantanée sur votre écran et sonnerie de carillon lors du franchissement.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Helper Badge */}
            {notificationType === 'BOTH' && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  <strong>Protection maximale activée :</strong> Vous recevrez l'alerte push instantanée ET un récapitulatif par e-mail avec les liens d'action vers votre SGI.
                </span>
              </div>
            )}
          </div>

          {/* Recipient Details & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse E-mail Destinataire
              </label>
              <input
                type="email"
                required
                value={emailRecipient}
                onChange={e => setEmailRecipient(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note / Contexte de la Simulation
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Seuil DCA mensuel, Objectif de plus-value..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onClose} size="sm">
              Annuler
            </Button>

            <Button type="submit" size="sm" className="px-6 font-extrabold bg-blue-700 hover:bg-blue-800">
              <Bell className="w-4 h-4 mr-1.5" />
              Activer l'Alerte de Cours
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
