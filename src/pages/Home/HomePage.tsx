import React, { useState } from 'react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { CompanyCard } from '../../components/finance/CompanyCard';
import { Button } from '../../components/ui/Button';
import { Search, Calculator, BookOpen, BarChart2, TrendingUp, ShieldCheck, Zap, HelpCircle, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularCompanies = DEMO_COMPANIES.slice(0, 4);

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
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-indigo-300 text-xs font-extrabold uppercase tracking-widest shadow-2xs">
            <Zap className="w-4 h-4 text-amber-400" />
            Nexus Guide Pédagogique BRVM
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Comprendre la Bourse simplement en FCFA
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            Découvrez les entreprises cotées à la BRVM, analysez leurs bénéfices (BPA) et valorisations (PER), et simulez vos investissements sans risque financier.
          </p>

          {/* Hero Search Input */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-300" />
                <input
                  type="text"
                  placeholder="Rechercher une entreprise (ex: Sonatel, Solibra)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl font-medium placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button type="submit" size="md" className="w-full sm:w-auto">
                  Rechercher
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => onNavigate('/simulation')}
                  className="w-full sm:w-auto"
                >
                  <Calculator className="w-4 h-4 mr-1.5" />
                  Simuler
                </Button>
              </div>
            </div>
          </form>

          {/* Popular Tag Quick Links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Cotes populaires :</span>
            {['SNTS', 'SLBC', 'ETIT', 'SGBC', 'TTLCI'].map(sym => (
              <button
                key={sym}
                onClick={() => onNavigate(`/company/${sym}`)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono font-bold transition-all cursor-pointer text-xs"
              >
                ${sym}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Stocks Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Entreprises Populaires (BRVM)</h2>
            <p className="text-xs sm:text-sm text-slate-500">Exemples de valeurs représentatives du marché ouest-africain</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('/search')}>
            Voir toutes les entreprises <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularCompanies.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={sym => onNavigate(`/company/${sym}`)}
              onSimulate={sym => onNavigate(`/simulation?symbol=${sym}`)}
              onCompare={sym => onNavigate(`/comparison?symbol=${sym}`)}
            />
          ))}
        </div>
      </section>

      {/* How it works grid */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-10 space-y-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Parcours Débutant
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Comment fonctionne Bourse Facile ?</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Une méthode simple et pas à pas pour appréhender l’investissement boursier sans crainte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div
            onClick={() => onNavigate('/search')}
            className="p-6 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm shadow-2xs">
              1
            </div>
            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">
              Découvrir & Rechercher
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Explorez les actions de la BRVM par secteur (Télécoms, Banque, Agroalimentaire) et consultez leur fiche complète.
            </p>
          </div>

          <div
            onClick={() => onNavigate('/learning')}
            className="p-6 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm shadow-2xs">
              2
            </div>
            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">
              Comprendre les Ratios
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Apprenez ce que signifient réellement le BPA (Bénéfice Par Action), le PER et les dividendes distribués.
            </p>
          </div>

          <div
            onClick={() => onNavigate('/simulation')}
            className="p-6 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-sm shadow-2xs">
              3
            </div>
            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">
              Simuler un Investissement
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Testez des montants en FCFA sur des périodes passées pour observer l’impact de la plus-value et des dividendes.
            </p>
          </div>

          <div
            onClick={() => onNavigate('/comparison')}
            className="p-6 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-sm shadow-2xs">
              4
            </div>
            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">
              Comparer les Entreprises
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Mettez côte à côte deux ou trois actions pour déterminer quelle entreprise a la meilleure trajectoire.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-2xl font-black tracking-tight">Sauvegardez vos simulations et analyses</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Créez un compte gratuit pour enregistrer vos scénarios d’investissement, vos actions favorites et exporter vos rapports en PDF.
          </p>
        </div>
        <Button size="lg" variant="primary" onClick={() => onNavigate('/auth')} className="bg-white text-slate-900 hover:bg-slate-100">
          Créer mon compte
        </Button>
      </section>
    </div>
  );
};
