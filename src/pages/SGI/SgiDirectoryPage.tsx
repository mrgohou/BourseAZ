import React, { useState } from 'react';
import { BRVM_SGI_LIST, SGIInfo } from '../../data/sgi-data';
import { Landmark, Smartphone, Globe, CheckCircle2, Phone, Mail, ExternalLink, Filter, Search, ArrowLeft, Star, ShieldCheck, Zap } from 'lucide-react';

interface SgiDirectoryPageProps {
  onNavigate: (path: string) => void;
}

export const SgiDirectoryPage: React.FC<SgiDirectoryPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [filterMobileApp, setFilterMobileApp] = useState(false);
  const [filterMobileMoney, setFilterMobileMoney] = useState(false);

  const countries = [
    { code: 'ALL', label: 'Tous les pays' },
    { code: 'CI', label: 'Côte d\'Ivoire' },
    { code: 'SN', label: 'Sénégal' },
    { code: 'BF', label: 'Burkina Faso' },
    { code: 'BJ', label: 'Bénin' },
  ];

  const filteredSgis = BRVM_SGI_LIST.filter(sgi => {
    const matchesSearch =
      sgi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sgi.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sgi.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sgi.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry =
      selectedCountry === 'ALL' || sgi.countryCode === selectedCountry || sgi.country.includes('UEMOA') || sgi.country.includes('Régional');

    const matchesApp = !filterMobileApp || sgi.hasMobileApp;
    const matchesMoney = !filterMobileMoney || sgi.mobileMoneySupported;

    return matchesSearch && matchesCountry && matchesApp && matchesMoney;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sociétés Agrées par le CREPMF / BRVM
          </span>
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 p-8 sm:p-10 text-white overflow-hidden shadow-xl border border-emerald-800/50">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-widest">
              <Landmark className="w-3.5 h-3.5" />
              SGI (Sociétés de Gestion et d'Intermédiation)
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Ouvrez votre compte Bourse auprès des courtieurs agréés
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Pour acheter et vendre des actions sur la BRVM, vous devez ouvrir un compte-titres auprès d'une SGI. Comparez les frais, les applications mobiles et les dépôts minimums pour choisir votre intermédiaire idéal.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une SGI (nom, pays, ville)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Country Selector */}
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Mobile / Money Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMobileApp(!filterMobileApp)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  filterMobileApp
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                App Mobile
              </button>

              <button
                onClick={() => setFilterMobileMoney(!filterMobileMoney)}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  filterMobileMoney
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Mobile Money
              </button>
            </div>
          </div>
        </div>

        {/* SGI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSgis.map((sgi) => (
            <div
              key={sgi.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {sgi.name}
                      </h3>
                      {sgi.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase">
                          Populaire
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {sgi.headquarters}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {sgi.rating}
                  </div>
                </div>

                {/* Parent Group */}
                {sgi.parentGroup && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Groupe:</span> {sgi.parentGroup}
                  </div>
                )}

                {/* Key Rectangles Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dépôt Minimum</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">{sgi.minimumDepositEstimate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Frais de Courtage</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{sgi.brokerageFeeEstimate}</span>
                  </div>
                </div>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sgi.hasMobileApp && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                      <Smartphone className="w-3 h-3" /> App Mobile
                    </span>
                  )}
                  {sgi.hasWebPortal && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold">
                      <Globe className="w-3 h-3" /> Portail Web
                    </span>
                  )}
                  {sgi.mobileMoneySupported && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold">
                      <Zap className="w-3 h-3" /> Mobile Money
                    </span>
                  )}
                </div>

                {/* Advantages */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Avantages Clés</span>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {sgi.advantages.slice(0, 3).map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Link Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {sgi.websiteUrl && (
                  <a
                    href={sgi.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Ouvrir un compte</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
