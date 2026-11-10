import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { CompanyCard } from '../../components/finance/CompanyCard';
import { Button } from '../../components/ui/Button';
import { PacoMascot } from '../../components/common/PacoMascot';
import { startOnboardingTour } from '../../components/common/OnboardingTour';
import { MarketScannerModal } from '../../components/finance/MarketScannerModal';
import { BRVMIndicesWeeklyChart } from '../../components/charts/BRVMIndicesWeeklyChart';
import { BrvmLiveNewsFeed } from '../../components/news/BrvmLiveNewsFeed';
import { DailyMarketSessionBadge } from '../../components/finance/DailyMarketSessionBadge';
import { useMarketData } from '../../features/market/MarketContext';
import { marketScannerSyncEngine, BRVMTopPerformers, MarketScannerOverview } from '../../services/market-data/MarketScannerSyncEngine';
import {
  Search,
  BookOpen,
  Calculator,
  BarChart2,
  Building2,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Target,
  Coins,
  CheckCircle2,
  Sparkles,
  Calendar,
  CalendarDays,
  Clock,
  Flame,
  HelpCircle,
  Globe2,
  ChevronDown,
  FileCheck,
  Activity,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const { companies, companyMap, marketSession, marketMetrics, isRefreshing, refreshMarketData } = useMarketData();
  const [topPerformers, setTopPerformers] = useState<BRVMTopPerformers>(() => marketScannerSyncEngine.getTopPerformers());
  const [marketOverview, setMarketOverview] = useState<MarketScannerOverview>(() => marketScannerSyncEngine.getOverview());

  useEffect(() => {
    const unsubscribe = marketScannerSyncEngine.subscribe(() => {
      setTopPerformers(marketScannerSyncEngine.getTopPerformers());
      setMarketOverview(marketScannerSyncEngine.getOverview());
    });
    return () => unsubscribe();
  }, []);

  // Ligne 1 : Actions à plus fort rendement du dividende (avec cours actualisés du jour)
  const line1Companies = useMemo(() => {
    if (!companies || companies.length === 0) return [];
    return [...companies]
      .filter((c) => (c.dividendYield || 0) > 0)
      .sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0))
      .slice(0, 3);
  }, [companies]);

  // Ligne 2 : Actions avec la plus forte progression de la journée (Top Hausses du jour)
  const line2Companies = useMemo(() => {
    if (!companies || companies.length === 0) return [];
    return [...companies]
      .sort((a, b) => b.dayChangePercent - a.dayChangePercent)
      .slice(0, 3);
  }, [companies]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/search');
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Section 1: Hero Section (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div id="hero-container" className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left Column (1/3): Paco Mascot */}
          <div id="hero-mascot-column" className="md:col-span-1 flex flex-col justify-center items-center h-full min-h-[220px] sm:min-h-[280px]">
            <PacoMascot size="full" showBadge={true} className="w-full h-full drop-shadow-xl" />
          </div>

          {/* Right Column (2/3): Text Content */}
          <div id="hero-text-column" className="md:col-span-2 text-center md:text-left space-y-6 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                GUIDE PEDAGOGIQUE POUR INVESTIR A LA BOURSE
              </div>
              <button
                type="button"
                onClick={startOnboardingTour}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-900/80 hover:bg-emerald-800/90 border border-amber-400/50 text-amber-300 text-xs font-extrabold cursor-pointer transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Paco Conseiller IA</span>
              </button>
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']"
            >
              Comprendre la Bourse simplement
            </motion.h1>

            <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
              Bourse Facile est un outil de simulation et d’analyse pédagogique dédié à la compréhension de la Bourse Régionale des Valeurs Mobilières (BRVM). Les simulations et données financières sont fournies à titre indicatif et ne constituent en aucun cas un conseil en investissement ou une incitation à acheter ou vendre des titres.
            </p>

            {/* Quick Live Market Bar */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="text-emerald-200 font-bold">BRVM Composite :</span>
                <span className="font-black text-white">{marketOverview.compositeIndex.toFixed(2)} pts</span>
                <span className="text-emerald-300 font-extrabold bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-600/50">
                  +{marketOverview.compositeChange.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-200 font-bold">BRVM 30 :</span>
                <span className="font-black text-white">{marketOverview.brvm30Index.toFixed(2)} pts</span>
                <span className="text-emerald-300 font-extrabold bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-600/50">
                  +{marketOverview.brvm30Change.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Hero Search Input - M3 Pill Shape */}
            <form onSubmit={handleSearchSubmit} className="pt-1">
              <div className="relative flex items-center max-w-xl mx-auto md:mx-0">
                <Search className="w-5 h-5 absolute left-4 text-emerald-300" />
                <input
                  type="text"
                  placeholder="Rechercher une entreprise (ex: Sonatel, SGBCI, Solibra)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-36 py-3.5 rounded-full bg-emerald-900/70 backdrop-blur-md border border-emerald-600/60 text-white placeholder:text-emerald-300/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-inner transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                >
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Daily Live Market Session Bar */}
      <DailyMarketSessionBadge />

      {/* Section 2: Feature Cards Grid & Interactive Modules (Light Theme) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigate('/learning')}
          className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group space-y-3 hover:border-amber-500"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 border border-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors font-['Outfit']">
            Guide Pédagogique
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Apprenez les fondamentaux de la bourse, du rôle des SGI aux explications simples sur le BPA et le rendement.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('/comparison')}
          className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group space-y-3 hover:border-sky-500"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 border border-sky-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart2 className="w-6 h-6 text-sky-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors font-['Outfit']">
            Comparateur d’Entreprises
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Mettez en concurrence deux sociétés cotées pour comparer leurs ratios clés, leur PER et leurs dividendes.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('/simulation')}
          className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group space-y-3 hover:border-emerald-500"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calculator className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors font-['Outfit']">
            Simulateur d’Investissement
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Testez vos stratégies en simulant vos achats d’actions BRVM et calculez les dividendes réinvestis.
          </p>
        </div>
      </div>

      {/* Interactive Modules Section (Light Theme) */}
      <section className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Nouveaux Outils d'Accompagnement
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit']">
              Préparez votre Entrée en Bourse
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/simulation')}
            className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all duration-200 shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]"
          >
            <span>Accéder à tous les outils</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Module 1: Investor Profile */}
          <div
            onClick={() => onNavigate('/profil-investisseur')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-amber-500 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center font-bold">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between font-['Outfit']">
                <span>Profil d'Investisseur</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                Quiz dynamique en 5 questions pour découvrir votre tolérance au risque et votre allocation d'actifs idéale.
              </p>
            </div>
          </div>

          {/* Module 2: Fee Calculator */}
          <div
            onClick={() => onNavigate('/calculateur-frais')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-sky-500 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between font-['Outfit']">
                <span>Calculateur de Frais SGI</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-sky-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                Estimez le coût net de vos ordres de Bourse (Commissions SGI, BRVM, TVA) et votre point d'équilibre.
              </p>
            </div>
          </div>

          {/* Module 3: Step-by-Step Guide */}
          <div
            onClick={() => onNavigate('/guide-pas-a-pas')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between font-['Outfit']">
                <span>Guide Pas-à-Pas BRVM</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                Les 5 étapes pratiques pour ouvrir son compte titres, choisir sa SGI et passer son premier ordre.
              </p>
            </div>
          </div>

          {/* Module 4: Calendrier des Dividendes */}
          <div
            onClick={() => onNavigate('/calendrier-dividendes')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-600 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md ring-1 ring-emerald-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between font-['Outfit']">
                <span>Calendrier Dividendes</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                Dates clés, AG, ex-date et montants estimés/confirmés des 36 sociétés cotées avec exports iCal.
              </p>
            </div>
          </div>

          {/* Module 5: Annuaire Officiel SGI */}
          <div
            onClick={() => onNavigate('/sgi')}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-teal-500 transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 border border-teal-300 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-600 transition-colors flex items-center justify-between font-['Outfit']">
                <span>Annuaire Officiel SGI</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                Consultez les 30+ Sociétés de Gestion et d'Intermédiation agréées par l'AMF-UMOA pour investir en direct.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Dynamic BRVM Market Performance Section (Bleu Ciel) */}
      <section className="bg-sky-50 dark:bg-sky-950/40 text-slate-900 rounded-3xl p-6 sm:p-8 space-y-10 border-2 border-sky-200 dark:border-sky-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-200 dark:border-sky-800/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300 text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-sky-600" />
              Palmarès & Actions Performantes
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-sky-950 dark:text-sky-100 tracking-tight font-['Outfit']">
              Actions Performantes de la Journée et de la Semaine
            </h2>
            <p className="text-xs sm:text-sm text-sky-900/80 dark:text-sky-200 mt-1 font-normal">
              Données synchronisées avec la cote officielle BRVM et le flux temps-réel RichBourse.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100/80 border border-sky-300 text-sky-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
              </span>
              <span>Synchro 5 min & Analyse 15 min</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full font-black border border-sky-300">
                Watchdog Actif
              </span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScannerModalOpen(true)}
              className="shrink-0 font-bold bg-sky-600 hover:bg-sky-700 text-white border-transparent shadow-sm"
            >
              <Activity className="w-4 h-4 mr-1.5 text-white" />
              Ouvrir l'Audit Complet BRVM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/search')}
              className="shrink-0 font-bold bg-white hover:bg-sky-100 text-sky-900 border-sky-300 shadow-xs"
            >
              Toute la Cote <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Ligne 1 : Actions à Fort Rendement de Dividende (Performance de la Semaine) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-sky-100/90 dark:bg-sky-900/40 border border-sky-300/80 text-sky-950 dark:text-sky-100 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                <h3 className="text-base font-black text-sky-950 dark:text-sky-100 font-['Outfit']">
                  Top Rendements Dividendes de la Semaine
                </h3>
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-300 font-normal">
                Valeurs de référence à dividendes réguliers et résilience financière avérée.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-sky-800/80 border border-sky-300 text-sky-900 dark:text-sky-100 text-xs font-extrabold shrink-0 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Actualisé en Continu • Données Croisées</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {line1Companies.map((company) => {
              return (
                <div key={company.id} className="relative space-y-2">
                  <div className="flex items-center justify-between px-3 py-1 rounded-t-xl bg-sky-200/90 border border-sky-300 text-[11px] font-extrabold text-sky-950">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                      Rendement : {company.dividendYield.toFixed(2)}% / an
                    </span>
                    <span className="text-[10px] text-sky-800 font-medium">Régulier</span>
                  </div>
                  <CompanyCard
                    company={company}
                    isDark={false}
                    onSelect={(sym) => onNavigate(`/company/${sym}`)}
                    onSimulate={(sym) => onNavigate(`/simulation?symbol=${sym}`)}
                    onCompare={(sym) => onNavigate(`/comparison?symbol=${sym}`)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Ligne 2 : Actions avec une forte progression de la journée */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-sky-100/90 dark:bg-sky-900/40 border border-sky-300/80 text-sky-950 dark:text-sky-100 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-base font-black text-sky-950 dark:text-sky-100 font-['Outfit']">
                  Top Performances & Plus Fortes Hausses de la Journée
                </h3>
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-300 font-normal">
                Les plus fortes variations positives enregistrées en séance selon les cotations officielles.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-sky-800/80 border border-sky-300 text-sky-900 dark:text-sky-100 text-xs font-extrabold shrink-0 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Séance BRVM du Jour</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {line2Companies.map((company) => {
              return (
                <div key={company.id} className="relative space-y-2">
                  <div className="flex items-center justify-between px-3 py-1 rounded-t-xl bg-amber-100 border border-amber-300 text-[11px] font-extrabold text-amber-950">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      +{company.dayChangePercent.toFixed(2)}% du jour
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">Flux Enregistré</span>
                  </div>
                  <CompanyCard
                    company={company}
                    isDark={false}
                    onSelect={(sym) => onNavigate(`/company/${sym}`)}
                    onSimulate={(sym) => onNavigate(`/simulation?symbol=${sym}`)}
                    onCompare={(sym) => onNavigate(`/comparison?symbol=${sym}`)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: SGI Directory Preview (Vert Très Clair) */}
      <section className="bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 p-6 sm:p-10 space-y-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Intermédiaires Agréés
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-100 tracking-tight font-['Outfit']">
              Annuaire des SGI Officielles & Courtiers BRVM
            </h2>
            <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200 leading-relaxed font-normal">
              Pour acheter ou vendre de vraies actions sur la BRVM, vous devez obligatoirement passer par une Société de Gestion et d’Intermédiation (SGI). Consultez l’annuaire complet avec les coordonnées, dépôts minimums et barèmes actualisés.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/sgi')}
            className="shrink-0 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center gap-2 text-sm active:scale-[0.98]"
          >
            <Building2 className="w-5 h-5 text-white" />
            Consulter l’Annuaire SGI
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-200 dark:border-emerald-800/80">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/60 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">Courtiers Agréés AMF-UMOA</h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">Garantie de sécurité et régulation officielle.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/60 shadow-xs">
            <div className="p-2 rounded-lg bg-teal-100 text-teal-700 border border-teal-300 shrink-0">
              <Users className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">Accompagnement Client</h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">Conseils d’experts et ordres en ligne ou en agence.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/60 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300 shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">Dépôts & Frais Vérifiés</h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">Barèmes réels pour Bridge, BOA, Coris, CGF, etc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4.5: Actualités des Sociétés Cotées (Real-Time BRVM News Feed) */}
      <BrvmLiveNewsFeed onNavigate={onNavigate} />

      {/* Section 5: SEO & FAQ Section (Vert Foncé) */}
      <section className="bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-8 sm:p-12 lg:p-16 border-2 border-emerald-800 shadow-2xl min-h-[580px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Block (Title, Subtitle & UEMOA Context) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/40">
                <Globe2 className="w-3.5 h-3.5" />
                Guide & Flashcards BRVM (UEMOA)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight font-['Outfit']">
                Tout Savoir pour Réussir ses Investissements en Bourse à la BRVM
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
                Réponses simples et directes aux questions les plus fréquentes posées par les épargnants de Côte d'Ivoire, du Sénégal, du Burkina Faso, du Mali, du Bénin, du Togo, du Niger et de Guinée-Bissau.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/50 text-xs text-emerald-200 flex items-center gap-2.5">
                <span className="text-lg">💡</span>
                <span>Cliquez sur n'importe quelle flashcard pour faire pivoter la carte et afficher les explications.</span>
              </div>

              {/* Large Button: Se renseigner sur la BRVM */}
              <button
                onClick={() => onNavigate?.('guide')}
                className="w-full py-3.5 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm sm:text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer font-['Outfit']"
              >
                <span>Se renseigner sur la BRVM</span>
                <ArrowRight className="w-5 h-5 text-emerald-950" />
              </button>
            </div>

            {/* Regional Coverage Badges */}
            <div className="pt-4 border-t border-emerald-800/80 space-y-2.5">
              <div className="text-xs font-bold text-emerald-300">
                Marché Unique UEMOA couvert en FCFA (XOF) :
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇨🇮 Côte d'Ivoire</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇸🇳 Sénégal</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇧🇫 Burkina Faso</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇲🇱 Mali</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇧🇯 Bénin</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇹🇬 Togo</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇳🇪 Niger</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 text-emerald-100 border border-emerald-700/80">🇬🇼 Guinée-Bissau</span>
              </div>
            </div>
          </div>

          {/* Right Block (Flashcards Grid) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Flashcard 1 */}
            <div
              className="group [perspective:1000px] h-72 sm:h-80 cursor-pointer"
              onClick={(e) => {
                const el = e.currentTarget.querySelector('.flashcard-inner');
                el?.classList.toggle('[transform:rotateY(180deg)]');
              }}
            >
              <div className="flashcard-inner relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-2xl shadow-md">
                {/* Recto (Question) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] p-6 rounded-2xl bg-emerald-900/90 border border-emerald-700/80 flex flex-col justify-between hover:border-emerald-400 transition-colors shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-400/40">
                      Question 1
                    </span>
                    <HelpCircle className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center px-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-medium font-['Outfit'] font-[500] text-white leading-snug tracking-tight">
                      Comment acheter ses premières actions à la BRVM ?
                    </h2>
                  </div>
                  <div className="flex items-center justify-center text-xs font-bold text-emerald-300 pt-3 border-t border-emerald-700/60">
                    <span>💡 Voir la réponse</span>
                  </div>
                </div>

                {/* Verso (Answer) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 border border-emerald-500/50 flex flex-col justify-between shadow-xl">
                  <div className="space-y-3 overflow-y-auto">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                      Réponse Pédagogique :
                    </span>
                    <h3 className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal font-['Outfit'] font-[400]">
                      Pour investir à la BRVM, ouvrez un <strong className="font-semibold text-emerald-300">compte-titres</strong> auprès d’une Société de Gestion et d’Intermédiation (<strong className="font-semibold text-emerald-300">SGI</strong>) agréée par l’AMF-UMOA. Déposez vos fonds (virement, chèque, Mobile Money) puis passez vos ordres d’achat en toute sécurité.
                    </h3>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-between pt-2 border-t border-emerald-800/80">
                    <span>Compte-titres & SGI</span>
                    <span>🔄 Recliquez</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard 2 */}
            <div
              className="group [perspective:1000px] h-72 sm:h-80 cursor-pointer"
              onClick={(e) => {
                const el = e.currentTarget.querySelector('.flashcard-inner');
                el?.classList.toggle('[transform:rotateY(180deg)]');
              }}
            >
              <div className="flashcard-inner relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-2xl shadow-md">
                {/* Recto (Question) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] p-6 rounded-2xl bg-emerald-900/90 border border-emerald-700/80 flex flex-col justify-between hover:border-amber-400 transition-colors shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-400/40">
                      Question 2
                    </span>
                    <HelpCircle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center px-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-medium font-['Outfit'] font-[500] text-white leading-snug tracking-tight">
                      Combien faut-il pour commencer à investir ?
                    </h2>
                  </div>
                  <div className="flex items-center justify-center text-xs font-bold text-amber-300 pt-3 border-t border-emerald-700/60">
                    <span>💡 Voir la réponse</span>
                  </div>
                </div>

                {/* Verso (Answer) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 border border-amber-500/50 flex flex-col justify-between shadow-xl">
                  <div className="space-y-3 overflow-y-auto">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      Réponse Pédagogique :
                    </span>
                    <h3 className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal font-['Outfit'] font-[400]">
                      Il n’y a <strong className="font-semibold text-amber-300">aucun minimum légal</strong> fixé par la BRVM. Certaines actions coûtent moins de 2 000 FCFA l'unité. Avec une épargne programmée de <strong className="font-semibold text-amber-300">25 000 ou 50 000 FCFA par mois</strong>, vous bâtissez un portefeuille diversifié à fort potentiel.
                    </h3>
                  </div>
                  <div className="text-[11px] text-amber-300 font-bold flex items-center justify-between pt-2 border-t border-emerald-800/80">
                    <span>Dès 5 000 FCFA</span>
                    <span>🔄 Recliquez</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard 3 */}
            <div
              className="group [perspective:1000px] h-72 sm:h-80 cursor-pointer"
              onClick={(e) => {
                const el = e.currentTarget.querySelector('.flashcard-inner');
                el?.classList.toggle('[transform:rotateY(180deg)]');
              }}
            >
              <div className="flashcard-inner relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-2xl shadow-md">
                {/* Recto (Question) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] p-6 rounded-2xl bg-emerald-900/90 border border-emerald-700/80 flex flex-col justify-between hover:border-sky-400 transition-colors shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-sky-500/30 text-sky-200 text-[10px] font-black uppercase tracking-wider border border-sky-400/40">
                      Question 3
                    </span>
                    <HelpCircle className="w-5 h-5 text-sky-300" />
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center px-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-medium font-['Outfit'] font-[500] text-white leading-snug tracking-tight">
                      Quelles sont les entreprises les plus rentables à la BRVM ?
                    </h2>
                  </div>
                  <div className="flex items-center justify-center text-xs font-bold text-sky-300 pt-3 border-t border-emerald-700/60">
                    <span>💡 Voir la réponse</span>
                  </div>
                </div>

                {/* Verso (Answer) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 border border-sky-500/50 flex flex-col justify-between shadow-xl">
                  <div className="space-y-3 overflow-y-auto">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                      Réponse Pédagogique :
                    </span>
                    <h3 className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal font-['Outfit'] font-[400]">
                      Les actions phares de rendement comprennent <strong className="font-semibold text-sky-300">Sonatel (SNTS)</strong>, <strong className="font-semibold text-sky-300">Solibra (SLBC)</strong>, <strong className="font-semibold text-sky-300">SGBCI (SGBC)</strong>, <strong className="font-semibold text-sky-300">TotalEnergies CI (TTLCI)</strong> et <strong className="font-semibold text-sky-300">CIE (CIEC)</strong>, avec des rendements récurrents de 5% à 11%/an.
                    </h3>
                  </div>
                  <div className="text-[11px] text-sky-300 font-bold flex items-center justify-between pt-2 border-t border-emerald-800/80">
                    <span>Dividendes 5% à 11%</span>
                    <span>🔄 Recliquez</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard 4 */}
            <div
              className="group [perspective:1000px] h-72 sm:h-80 cursor-pointer"
              onClick={(e) => {
                const el = e.currentTarget.querySelector('.flashcard-inner');
                el?.classList.toggle('[transform:rotateY(180deg)]');
              }}
            >
              <div className="flashcard-inner relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform rounded-2xl shadow-md">
                {/* Recto (Question) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] p-6 rounded-2xl bg-emerald-900/90 border border-emerald-700/80 flex flex-col justify-between hover:border-emerald-400 transition-colors shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-400/40">
                      Question 4 • Sécurité & Légalité
                    </span>
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="flex-1 flex items-center justify-center text-center px-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-medium font-['Outfit'] font-[500] text-white leading-snug tracking-tight">
                      Est-ce que la BRVM est une arnaque ou est-ce que c'est légal et sécurisé ?
                    </h2>
                  </div>
                  <div className="flex items-center justify-center text-xs font-bold text-emerald-300 pt-3 border-t border-emerald-700/60">
                    <span>💡 Voir la réponse</span>
                  </div>
                </div>

                {/* Verso (Answer) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 border border-emerald-500/50 flex flex-col justify-between shadow-xl">
                  <div className="space-y-3 overflow-y-auto">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                      Réponse Simple & Pédagogique :
                    </span>
                    <h3 className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-normal font-['Outfit'] font-[400]">
                      <strong className="text-emerald-300 font-semibold">C'est 100% officiel, légal et sécurisé !</strong> Imagine un grand marché surveillé par la police des finances (l'AMF-UMOA) et les 8 gouvernements de notre région. Quand tu achètes une action, tu deviens réellement copropriétaire d’entreprises réelles et solides comme la Sonatel, Total ou Orange. Tes titres t'appartiennent pour toujours, inscrits à ton nom.
                    </h3>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-between pt-2 border-t border-emerald-800/80">
                    <span>Régulé AMF-UMOA • 8 États</span>
                    <span>🔄 Recliquez</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Market Scanner & Cross-Audit Modal */}
      <MarketScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
