import React from 'react';
import { DividendCalendar } from '../../components/dividends/DividendCalendar';
import { MarketSyncStatusBar } from '../../components/finance/MarketSyncStatusBar';
import { DailyMarketSessionBadge } from '../../components/finance/DailyMarketSessionBadge';
import { useMarketData } from '../../features/market/MarketContext';
import {
  CalendarDays,
  ShieldCheck,
  Building2,
  TrendingUp,
  FileCheck2,
  Info,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface DividendCalendarPageProps {
  onNavigate: (path: string) => void;
}

export const DividendCalendarPage: React.FC<DividendCalendarPageProps> = ({ onNavigate }) => {
  const { marketSession } = useMarketData();

  return (
    <div className="space-y-8 pb-16">
      {/* Live Market Sync Bar */}
      <MarketSyncStatusBar />

      {/* Daily Market Session Badge */}
      <DailyMarketSessionBadge />

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-800/40 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5" />
              Saison des Dividendes 2026 BRVM
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Calendrier Officiel des Dividendes
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Suivez en temps réel les dates d'Assemblées Générales, les dates de détachement du coupon (Ex-Date)
              et les dates effectives de mise en paiement des 36 sociétés cotées de l'UEMOA.
              Tous les montants nets intègrent automatiquement la retenue IRVM de 10%.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>36 sociétés consolidées</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pic de distribution : Mai – Juillet</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/60">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exports iCal & CSV inclus</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/simulation')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Simulateur Réinvestissement</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
            <button
              onClick={() => onNavigate('/sgi')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/70 font-medium text-sm transition-all"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Annuaire SGI Payeuses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Dividend Calendar Component */}
      <DividendCalendar onNavigate={onNavigate} />

      {/* Educational & Guide Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            La Règle du Détachement (Ex-Date)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Pour percevoir le dividende d'une société BRVM, vous devez détenir les actions <strong className="text-slate-800 dark:text-slate-200">au plus tard la veille de la date de détachement</strong> à la clôture du marché (J-1 ouvrable). À la date de détachement, le cours de l'action baisse mécaniquement de la valeur du dividende brut.
          </p>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Fiscalité UEMOA : Retenue IRVM 10%
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Dans l'espace UEMOA (Côte d'Ivoire, Sénégal, Bénin, Burkina Faso, Togo, Niger, Mali, Guinée-Bissau), les dividendes d'actions cotées sont assujettis à l'IRVM (taux préférentiel réduit de 10% contre 15% pour le non coté). La retenue est effectuée à la source par la SGI agent de paiement.
          </p>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Versement direct sur Compte SGI
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Le jour de la mise en paiement, les fonds nets sont directement crédités sur le compte espèces de votre SGI (ex: CGF Bourse, BOA Capital, Société Générale Capital Securities, Hudson & Cie, etc.). Vous pouvez alors les retirer ou les réinvestir automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
};
