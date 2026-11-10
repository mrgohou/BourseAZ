import React, { useState, useMemo } from 'react';
import { BRVM_SGI_LIST, SGIInfo } from '../../data/sgi-data';
import { SgiTariffComparisonTable } from '../../components/sgi/SgiTariffComparisonTable';
import { useAuth } from '../../features/auth/AuthContext';
import {
  Landmark,
  Smartphone,
  Globe,
  CheckCircle2,
  Phone,
  Mail,
  ExternalLink,
  Filter,
  Search,
  ArrowLeft,
  Star,
  ShieldCheck,
  Zap,
  Table,
  Grid,
  Calculator,
  HelpCircle,
  Coins,
  ArrowRight,
  SlidersHorizontal,
  Check,
  X,
  Sparkles,
  Layers,
  Info,
  AlertCircle,
  Heart,
} from 'lucide-react';

interface SgiDirectoryPageProps {
  onNavigate: (path: string) => void;
}

export const SgiDirectoryPage: React.FC<SgiDirectoryPageProps> = ({ onNavigate }) => {
  const { favoriteSgis, toggleFavoriteSgi, isFavoriteSgi } = useAuth();

  // Default to cards view on arrival as requested
  const [activeView, setActiveView] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [filterMobileApp, setFilterMobileApp] = useState(false);
  const [filterMobileMoney, setFilterMobileMoney] = useState(false);
  const [filterOnlyFavorites, setFilterOnlyFavorites] = useState(false);

  // Comparison state (initially empty - no automatic selection)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [simulatedOrderAmount, setSimulatedOrderAmount] = useState<number>(250000);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  const countries = [
    { code: 'ALL', label: 'Tous les pays', flag: '🌍' },
    { code: 'CI', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'SN', label: 'Sénégal', flag: '🇸🇳' },
    { code: 'BJ', label: 'Bénin', flag: '🇧🇯' },
    { code: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'ML', label: 'Mali', flag: '🇲🇱' },
    { code: 'TG', label: 'Togo', flag: '🇹🇬' },
    { code: 'NE', label: 'Niger', flag: '🇳🇪' },
  ];

  const sgiCountByCountry = useMemo(() => {
    const counts: Record<string, number> = { ALL: BRVM_SGI_LIST.length };
    BRVM_SGI_LIST.forEach(s => {
      counts[s.countryCode] = (counts[s.countryCode] || 0) + 1;
    });
    return counts;
  }, []);

  const handleToggleCompare = (sgiId: string) => {
    if (selectedForCompare.includes(sgiId)) {
      setSelectedForCompare(prev => prev.filter(id => id !== sgiId));
      setLimitNotice(null);
    } else {
      if (selectedForCompare.length >= 3) {
        setLimitNotice('Maximum 3 SGI peuvent être sélectionnées pour la comparaison. Retirez-en une pour en choisir une autre.');
        setTimeout(() => setLimitNotice(null), 4000);
        return;
      }
      setSelectedForCompare(prev => [...prev, sgiId]);
      setLimitNotice(null);
    }
  };

  const handleClearCompare = () => {
    setSelectedForCompare([]);
    setLimitNotice(null);
  };

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
    const matchesFav = !filterOnlyFavorites || isFavoriteSgi(sgi.id);

    return matchesSearch && matchesCountry && matchesApp && matchesMoney && matchesFav;
  });

  const comparedSgiObjects = useMemo(() => {
    return selectedForCompare
      .map(id => BRVM_SGI_LIST.find(s => s.id === id))
      .filter((s): s is SGIInfo => s !== undefined);
  }, [selectedForCompare]);

  // Helper to extract estimated brokerage percent for sorting
  const getNumericBrokerage = (feeStr: string): number => {
    if (feeStr.includes('0,60%') || feeStr.includes('0.60%')) return 0.6;
    if (feeStr.includes('0,80%') || feeStr.includes('0.80%')) return 0.8;
    if (feeStr.includes('0,90%') || feeStr.includes('0.90%')) return 0.9;
    return 1.0;
  };

  // Helper to compute exact transaction fees for an SGI based on simulated amount
  const calculateFeesForSgi = (sgi: SGIInfo, amount: number) => {
    const rate = getNumericBrokerage(sgi.brokerageFeeEstimate) / 100;
    const sgiBrokerage = Math.max(1000, amount * rate);
    const brvmCommission = amount * 0.0020; // 0.20%
    const dcbrCommission = amount * 0.0010; // 0.10%
    const tva = (sgiBrokerage + brvmCommission + dcbrCommission) * 0.18; // 18% TVA
    const totalFees = sgiBrokerage + brvmCommission + dcbrCommission + tva;
    const percent = amount > 0 ? (totalFees / amount) * 100 : 0;
    return { sgiBrokerage, brvmCommission, dcbrCommission, tva, totalFees, percent };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation & Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/calculateur-frais')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulateur de Frais SGI</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Agrément CREPMF / AMF-UMOA
            </span>
          </div>
        </div>

        {/* Section 1: Hero Banner (Vert Foncé) */}
        <section className="relative rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 p-6 sm:p-10 text-white overflow-hidden shadow-2xl border-2 border-emerald-800">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              ANNUAIRE & COMPARATEUR OFFICIEL DES SGI (AMF-UMOA)
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
              Ouvrez votre compte Bourse auprès des courtiers agréés
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
              Pour acheter et vendre des actions sur la BRVM, vous devez obligatoirement ouvrir un compte-titres auprès d'une SGI. Consultez les fiches détaillées, sélectionnez jusqu'à 3 SGI pour les comparer côte à côte, ou parcourez le tableau récapitulatif des grilles tarifaires.
            </p>

            {/* Quick View Switcher in Hero */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="p-1.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex items-center gap-1.5 shadow-inner">
                <button
                  onClick={() => setActiveView('cards')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                    activeView === 'cards'
                      ? 'bg-amber-400 text-emerald-950 shadow-md scale-102'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Fiches Détaillées ({BRVM_SGI_LIST.length})</span>
                </button>

                <button
                  onClick={() => setActiveView('table')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                    activeView === 'table'
                      ? 'bg-amber-400 text-emerald-950 shadow-md scale-102'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Grille Tarifaire Complète</span>
                </button>
              </div>

              {selectedForCompare.length > 0 && (
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Comparer ({selectedForCompare.length}/3)</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('/guide-pas-a-pas')}
                className="px-4 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800/90 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide d'ouverture de compte</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </section>

        {/* Limit Warning Notice */}
        {limitNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-md animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{limitNotice}</span>
            </div>
            <button
              onClick={() => setLimitNotice(null)}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-300 text-xs font-extrabold cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View 1: Detailed Cards Grid (Default view) */}
        {activeView === 'cards' && (
          <section className="space-y-6">
            {/* Country and Secondary Filters Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              {/* Country Tabs Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">Filtrer par Pays (Zone UEMOA) :</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    {filteredSgis.length} SGI trouvée{filteredSgis.length > 1 ? 's' : ''} sur {BRVM_SGI_LIST.length}
                  </span>
                </div>

                {/* Country and Favorites Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {/* Favorites pill */}
                  <button
                    onClick={() => {
                      setFilterOnlyFavorites(!filterOnlyFavorites);
                    }}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                      filterOnlyFavorites
                        ? 'bg-rose-600 text-white shadow-md scale-[1.02] ring-2 ring-rose-500/30'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${filterOnlyFavorites ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
                    <span>Favoris</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        filterOnlyFavorites
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {favoriteSgis.length}
                    </span>
                  </button>

                  {countries.map(c => {
                    const isSelected = selectedCountry === c.code && !filterOnlyFavorites;
                    const count = sgiCountByCountry[c.code] || 0;
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          setSelectedCountry(c.code);
                          setFilterOnlyFavorites(false);
                        }}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md scale-[1.02] ring-2 ring-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <span className="text-sm">{c.flag}</span>
                        <span>{c.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search input and Feature Toggles */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                {/* Search input */}
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom (BOA, Bridge, Coris, CGF...), ville ou groupe..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Mobile / Money Toggles */}
                <div className="flex items-center gap-2 sm:col-span-2">
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

                  {(selectedCountry !== 'ALL' || searchTerm || filterMobileApp || filterMobileMoney || filterOnlyFavorites) && (
                    <button
                      onClick={() => {
                        setSelectedCountry('ALL');
                        setSearchTerm('');
                        setFilterMobileApp(false);
                        setFilterMobileMoney(false);
                        setFilterOnlyFavorites(false);
                      }}
                      className="px-3 py-2.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold cursor-pointer whitespace-nowrap hover:underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SGI Grid or Empty State */}
            {filteredSgis.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <Info className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 dark:text-white text-base">
                  {filterOnlyFavorites
                    ? 'Vous n\'avez pas encore ajouté de SGI à vos favoris'
                    : 'Aucune SGI ne correspond à vos filtres dans cette zone'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {filterOnlyFavorites
                    ? 'Cliquez sur l\'icône de cœur sur les cartes des SGI pour les enregistrer dans votre profil.'
                    : 'Essayez de réinitialiser la recherche ou de sélectionner « Tous les pays ».'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCountry('ALL');
                    setSearchTerm('');
                    setFilterMobileApp(false);
                    setFilterMobileMoney(false);
                    setFilterOnlyFavorites(false);
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Afficher toutes les SGI
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSgis.map((sgi) => {
                const isSelected = selectedForCompare.includes(sgi.id);
                const selectIndex = selectedForCompare.indexOf(sgi.id) + 1;
                const isFav = isFavoriteSgi(sgi.id);

                return (
                  <div
                    key={sgi.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group ${
                      isSelected
                        ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {sgi.name}
                            </h3>
                            {sgi.featured && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase">
                                Populaire
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>{sgi.headquarters} ({sgi.countryCode})</span>
                            {sgi.contactPhone && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                {sgi.contactPhone}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Favorite & Rating group */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteSgi(sgi.id);
                            }}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              isFav
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 border border-slate-200 dark:border-slate-700'
                            }`}
                            title={isFav ? "Retirer de mes favoris" : "Ajouter à mes favoris"}
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                isFav ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                            />
                          </button>

                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {sgi.rating}
                          </div>
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

                      {/* Additional Tariff Details */}
                      {(sgi.accountMaintenanceFeeEstimate || sgi.custodyFeeEstimate) && (
                        <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1 text-xs">
                          {sgi.accountMaintenanceFeeEstimate && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Tenue de compte :</span>
                              <span className="font-bold text-indigo-950 dark:text-indigo-300">{sgi.accountMaintenanceFeeEstimate}</span>
                            </div>
                          )}
                          {sgi.custodyFeeEstimate && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Droits de garde :</span>
                              <span className="font-bold text-indigo-950 dark:text-indigo-300">{sgi.custodyFeeEstimate}</span>
                            </div>
                          )}
                        </div>
                      )}

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

                    {/* Action Link Footer with COMPARER button */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {/* Compare toggle button on card */}
                      <button
                        onClick={() => handleToggleCompare(sgi.id)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>Sélectionnée ({selectIndex}/3)</span>
                          </>
                        ) : (
                          <>
                            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Comparer cette SGI (max 3)</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {sgi.websiteUrl && (
                          <a
                            href={sgi.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Site Officiel</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <a
                          href={sgi.richbourseUrl || "https://www.richbourse.com/common/apprendre/liste-sgi"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Fiche RichBourse"
                        >
                          <Globe className="w-3 h-3 text-blue-500" />
                          <span>Fiche</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>
        )}

        {/* View 2: Interactive Comparison Table Section */}
        {activeView === 'table' && (
          <section className="space-y-6">
            <SgiTariffComparisonTable
              onNavigate={onNavigate}
              selectedForCompare={selectedForCompare}
              onToggleCompare={handleToggleCompare}
              onClearCompare={handleClearCompare}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
            />
          </section>
        )}

        {/* Sticky Bottom Comparison Floating Bar (Active when 1 to 3 SGIs selected) */}
        {selectedForCompare.length > 0 && (
          <div className="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-indigo-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {comparedSgiObjects.map(s => (
                  <div
                    key={s.id}
                    className="inline-block h-8 w-8 rounded-full bg-emerald-600 border-2 border-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs"
                    title={s.name}
                  >
                    {s.countryCode}
                  </div>
                ))}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-extrabold text-white">
                  {selectedForCompare.length}/3 SGI sélectionnée{selectedForCompare.length > 1 ? 's' : ''} pour comparaison
                </div>
                <div className="text-slate-300 flex items-center gap-1.5 flex-wrap">
                  {comparedSgiObjects.map(s => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-300"
                    >
                      {s.shortName || s.name}
                      <button
                        onClick={() => handleToggleCompare(s.id)}
                        className="hover:text-rose-400 cursor-pointer"
                        title="Retirer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearCompare}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Vider
              </button>
              <button
                onClick={() => setIsCompareModalOpen(true)}
                disabled={selectedForCompare.length < 2}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>
                  {selectedForCompare.length < 2
                    ? 'Sélectionnez une 2e SGI'
                    : `Comparer les ${selectedForCompare.length} SGI`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Direct Side-by-Side Comparison Modal */}
        {isCompareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800/40 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Comparaison Face-à-Face ({comparedSgiObjects.length}/3 SGI)
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Comparateur Détaillé des SGI Sélectionnées
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Analysez les grilles tarifaires, les dépôts minimums et les canaux d'accès de vos SGI sélectionnées.
                  </p>
                </div>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Simulator Inside Modal */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Simuler un ordre d'achat/vente :</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="50000"
                    min="10000"
                    value={simulatedOrderAmount}
                    onChange={e => setSimulatedOrderAmount(Math.max(1000, Number(e.target.value)))}
                    className="w-36 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-black text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="font-extrabold text-slate-600 dark:text-slate-400">FCFA</span>
                </div>
              </div>

              {/* Modal Content Comparison Grid */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-950/50">
                <div className={`grid grid-cols-1 gap-4 ${
                  comparedSgiObjects.length === 1
                    ? 'sm:grid-cols-1 max-w-md mx-auto'
                    : comparedSgiObjects.length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {comparedSgiObjects.map(sgi => {
                    const feeCalc = calculateFeesForSgi(sgi, simulatedOrderAmount);
                    return (
                      <div
                        key={sgi.id}
                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block">
                                {sgi.country} ({sgi.countryCode})
                              </span>
                              <h4 className="text-base font-black text-slate-900 dark:text-white">
                                {sgi.name}
                              </h4>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {sgi.rating}
                            </span>
                          </div>

                          {/* Specs Stack */}
                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Dépôt Minimum :</span>
                              <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                                {sgi.minimumDepositEstimate}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Courtage SGI :</span>
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {sgi.brokerageFeeEstimate}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                Coût pour un ordre de {simulatedOrderAmount.toLocaleString('fr-FR')} F :
                              </span>
                              <span className="text-sm font-black text-indigo-950 dark:text-indigo-300">
                                {Math.round(feeCalc.totalFees).toLocaleString('fr-FR')} FCFA TTC
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Tenue de compte :</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {sgi.accountMaintenanceFeeEstimate || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Droits de garde :</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {sgi.custodyFeeEstimate || '0,20% à 0,50%'}
                                </span>
                              </div>
                            </div>

                            {/* Channels */}
                            <div className="pt-1 flex flex-wrap gap-1">
                              {sgi.hasMobileApp && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                  App Mobile
                                </span>
                              )}
                              {sgi.mobileMoneySupported && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                  Mobile Money
                                </span>
                              )}
                              {sgi.hasWebPortal && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                  Web Portal
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Top advantage */}
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                            <strong className="block text-slate-900 dark:text-white mb-0.5 font-extrabold">
                              Point fort :
                            </strong>
                            {sgi.advantages[0]}
                          </div>
                        </div>

                        {sgi.websiteUrl && (
                          <a
                            href={sgi.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <span>Visiter le Site Officiel</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <button
                  onClick={handleClearCompare}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  Vider la sélection
                </button>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
