import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { CompanyCard } from '../../components/finance/CompanyCard';
import { Button } from '../../components/ui/Button';
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
  Users
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularCompanies = DEMO_COMPANIES.slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/search');
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-900/40">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            GUIDE PEDAGOGIQUE POUR INVESTIR A LA BOURSE
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white"
          >
            Comprendre la Bourse simplement
          </motion.h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            Bourse Facile est un outil de simulation et d’analyse pédagogique dédié à la compréhension de la Bourse Régionale des Valeurs Mobilières (BRVM). Les simulations et données financières sont fournies à titre indicatif et ne constituent en aucun cas un conseil en investissement ou une incitation à acheter ou vendre des titres.
          </p>

          {/* Hero Search Input */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une entreprise (ex: Sonatel, SGBCI, Solibra)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigate('/simulation')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-100/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Simulateur d’Investissement
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Testez vos stratégies en simulant vos achats d’actions BRVM et calculez les dividendes réinvestis.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('/comparison')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-100/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            Comparateur d’Entreprises
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Mettez en concurrence deux sociétés cotées pour comparer leurs ratios clés, leur PER et leurs dividendes.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('/learning')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-emerald-100/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            Guide Pédagogique
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Apprenez les fondamentaux de la bourse, du rôle des SGI aux explications simples sur le BPA et le rendement.
          </p>
        </div>
      </div>

      {/* Entreprises Populaires Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Entreprises Populaires (BRVM)</h2>
            <p className="text-xs sm:text-sm text-slate-500">Exemples de valeurs représentatives du marché ouest-africain</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('/search')}>
            Voir tout <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={(sym) => onNavigate(`/company/${sym}`)}
              onSimulate={(sym) => onNavigate(`/simulation?symbol=${sym}`)}
              onCompare={(sym) => onNavigate(`/comparison?symbol=${sym}`)}
            />
          ))}
        </div>
      </section>

      {/* SGI Directory Preview */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100/80 dark:border-slate-800 p-6 sm:p-10 space-y-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              Intermédiaires Agréés
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Annuaire des SGI Officielles & Courtiers BRVM
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Pour acheter ou vendre de vraies actions sur la BRVM, vous devez obligatoirement passer par une Société de Gestion et d’Intermédiation (SGI). Consultez l’annuaire complet avec les coordonnées des courtiers agréés.
            </p>
          </div>
          <Button size="lg" variant="secondary" onClick={() => onNavigate('/learning')} className="shrink-0">
            <Building2 className="w-5 h-5 mr-2" />
            Consulter l’Annuaire SGI
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Courtiers Agréés AMF-UMOA</h4>
              <p className="text-[11px] text-slate-500">Garantie de sécurité et régulation officielle.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Accompagnement Client</h4>
              <p className="text-[11px] text-slate-500">Conseils d’experts et ordres en ligne ou en agence.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ouverture de Compte Titres</h4>
              <p className="text-[11px] text-slate-500">Procédure simple avec pièce d'identité et justificatif.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
