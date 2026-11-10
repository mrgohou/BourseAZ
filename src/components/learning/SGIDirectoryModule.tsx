import React, { useState, useMemo } from 'react';
import { BRVM_SGI_LIST, SGIInfo } from '../../data/sgi-data';
import { Button } from '../ui/Button';
import { SgiTariffComparisonTable } from '../sgi/SgiTariffComparisonTable';
import {
  Building2,
  ShieldCheck,
  Smartphone,
  Globe,
  Wallet,
  Search,
  CheckCircle2,
  ExternalLink,
  Star,
  Info,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Coins,
  Calculator,
  Percent,
  TrendingUp,
  Phone,
  Table,
  Grid
} from 'lucide-react';

interface SGIDirectoryModuleProps {
  onNavigate?: (path: string) => void;
}

export const SGIDirectoryModule: React.FC<SGIDirectoryModuleProps> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [filterMobileOnly, setFilterMobileOnly] = useState(false);
  const [filterMobileMoney, setFilterMobileMoney] = useState(false);
  const [filterDepositLevel, setFilterDepositLevel] = useState<'ALL' | 'LOW' | 'MEDIUM'>('ALL');
  
  // Quick Fee Calculator State
  const [calcOrderAmount, setCalcOrderAmount] = useState<number>(250000);
  const [selectedSgiForCalc, setSelectedSgiForCalc] = useState<string>('sgi-bridge');

  const filteredSGIs = useMemo(() => {
    return BRVM_SGI_LIST.filter(sgi => {
      // Search term
      const matchesSearch =
        sgi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sgi.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sgi.headquarters.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sgi.parentGroup && sgi.parentGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sgi.advantages.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Country filter
      if (selectedCountry !== 'ALL') {
        if (selectedCountry === 'CI' && !sgi.countryCode.includes('CI') && !sgi.country.includes('Côte d\'Ivoire')) return false;
        if (selectedCountry === 'SN' && !sgi.countryCode.includes('SN') && !sgi.country.includes('Sénégal')) return false;
        if (selectedCountry === 'BF' && !sgi.countryCode.includes('BF') && !sgi.country.includes('Burkina Faso')) return false;
        if (selectedCountry === 'BJ_TG' && !['BJ', 'TG'].includes(sgi.countryCode)) return false;
      }

      // Feature filters
      if (filterMobileOnly && !sgi.hasMobileApp) return false;
      if (filterMobileMoney && !sgi.mobileMoneySupported) return false;

      // Deposit level filter
      if (filterDepositLevel === 'LOW') {
        const depositNum = parseInt(sgi.minimumDepositEstimate.replace(/[^0-9]/g, ''), 10) || 0;
        if (depositNum > 50000 && !sgi.minimumDepositEstimate.toLowerCase().includes('non exigé')) return false;
      } else if (filterDepositLevel === 'MEDIUM') {
        const depositNum = parseInt(sgi.minimumDepositEstimate.replace(/[^0-9]/g, ''), 10) || 0;
        if (depositNum > 250000 && !sgi.minimumDepositEstimate.toLowerCase().includes('non exigé')) return false;
      }

      return true;
    });
  }, [searchTerm, selectedCountry, filterMobileOnly, filterMobileMoney, filterDepositLevel]);

  // Fee calculation logic
  const selectedSgiData = useMemo(() => {
    return BRVM_SGI_LIST.find(s => s.id === selectedSgiForCalc) || BRVM_SGI_LIST[0];
  }, [selectedSgiForCalc]);

  const calculatedFees = useMemo(() => {
    const amount = Number(calcOrderAmount) || 0;
    
    // Brokerage (typically 0.8% - 1.0%)
    let rate = 0.01;
    if (selectedSgiData.id === 'sgi-bridge') rate = 0.009;
    if (selectedSgiData.id === 'sgi-hudson') rate = 0.006;
    if (selectedSgiData.id === 'sgi-edc') rate = 0.008;

    const sgiBrokerage = Math.max(1000, amount * rate);
    const brvmCommission = amount * 0.0020; // 0.20%
    const dcbrCommission = amount * 0.0010; // 0.10%
    const tvaPrestations = (sgiBrokerage + brvmCommission + dcbrCommission) * 0.18; // TVA 18% sur prestations
    const totalTransactionFees = sgiBrokerage + brvmCommission + dcbrCommission + tvaPrestations;
    const effectiveFeePercent = amount > 0 ? (totalTransactionFees / amount) * 100 : 0;

    return {
      sgiBrokerage,
      brvmCommission,
      dcbrCommission,
      tvaPrestations,
      totalTransactionFees,
      effectiveFeePercent,
    };
  }, [calcOrderAmount, selectedSgiData]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white border border-emerald-900/50 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Agrément Officiel AMF-UMOA & CREPMF
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Annuaire & Comparateur des SGI de la Zone UEMOA
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Pour investir à la BRVM, vous devez obligatoirement ouvrir un compte-titres auprès d'une Société de Gestion et d'Intermédiation (SGI). Comparez leurs dépôts minimums, leurs grilles tarifaires et leurs applications mobiles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center shrink-0 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">SGI Référencées & Actualisées</span>
            <div className="text-2xl font-black text-white">{BRVM_SGI_LIST.length} Courtiers Officiels</div>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" /> Données Homologuées UEMOA
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Tableau Comparatif & Tarifs</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Vue Fiches Détaillées</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Main Comparison Table when active */}
      {viewMode === 'table' ? (
        <SgiTariffComparisonTable onNavigate={onNavigate} />
      ) : (
        <>
          {/* 4 Key Decision Criteria Guide */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                4 Critères Essentiels pour Bien Choisir sa SGI
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  1
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Application Mobile & Web</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Privilégiez une SGI avec application (ex: BOA Bourse, Coris Bourse, CGF Direct) pour passer vos ordres 24/7 depuis votre smartphone sans vous déplacer en agence.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  2
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dépôts Mobile Money & Virement</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Alimentez instantanément votre compte-titres par Wave, Orange Money ou MTN chez des SGI comme Coris, Bridge Securities, BOA, CGF ou Africa Bourse.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                  3
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dépôt Minimum Requis</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Les seuils varient : 50 000 FCFA (Coris Bourse, ABCO, CGF), 250 000 FCFA (Bridge Securities, Impaxis), 500 000 FCFA (BOA Capital) ou 1 000 000 FCFA (EDC Ecobank).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black">
                  4
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Frais & Droits de Garde</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Vérifiez la tenue de compte (souvent gratuite chez CGF, ABCO ou 2 500 FCFA/an) et les droits de garde annuels (0,20% à 0,50% max de conservation).
                </p>
              </div>
            </div>
          </div>

          {/* Interactive SGI Fee Breakdown Calculator */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-indigo-800/50 shadow-lg space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Simulateur de Frais Réels par Ordre de Bourse
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">
                    Calculez le coût total exact (Courtage SGI + Commissions BRVM & DC/BR + TVA 18%)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              {/* SGI Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-200">Sélectionnez votre SGI :</label>
                <select
                  value={selectedSgiForCalc}
                  onChange={(e) => setSelectedSgiForCalc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-indigo-700/60 text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {BRVM_SGI_LIST.map(sgi => (
                    <option key={sgi.id} value={sgi.id}>
                      {sgi.name} ({sgi.countryCode}) - Dépôt min: {sgi.minimumDepositEstimate}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-200">Montant de l'ordre d'achat (FCFA) :</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10000"
                    step="25000"
                    value={calcOrderAmount}
                    onChange={(e) => setCalcOrderAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-indigo-700/60 text-emerald-400 font-extrabold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-indigo-300 font-bold">FCFA</span>
                </div>
              </div>

              {/* Result Card */}
              <div className="p-4 rounded-2xl bg-indigo-900/40 border border-indigo-700/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-200">Total Frais de transaction :</span>
                  <span className="text-base font-black text-emerald-400">
                    {Math.round(calculatedFees.totalTransactionFees).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-indigo-300 border-t border-indigo-800/50 pt-1.5">
                  <span>Impact sur l'ordre :</span>
                  <span className="font-bold text-amber-300">
                    ~{calculatedFees.effectiveFeePercent.toFixed(2)}% TTC
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-2xl border border-indigo-900/60">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Courtage SGI :</span>
                <span className="font-extrabold text-slate-200">{Math.round(calculatedFees.sgiBrokerage).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Commission BRVM (0,20%) :</span>
                <span className="font-extrabold text-slate-200">{Math.round(calculatedFees.brvmCommission).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Commission DC/BR (0,10%) :</span>
                <span className="font-extrabold text-slate-200">{Math.round(calculatedFees.dcbrCommission).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">TVA (18% sur prestations) :</span>
                <span className="font-extrabold text-slate-200">{Math.round(calculatedFees.tvaPrestations).toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar Controls */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Rechercher une SGI par nom, groupe (Bridge, BOA, Coris, NSIA, CGF...) ou ville..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Country Selector Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs font-extrabold">
                <span className="text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Pays:
                </span>
                <button
                  onClick={() => setSelectedCountry('ALL')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCountry === 'ALL'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedCountry('CI')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCountry === 'CI'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🇨🇮 Côte d'Ivoire
                </button>
                <button
                  onClick={() => setSelectedCountry('SN')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCountry === 'SN'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🇸🇳 Sénégal
                </button>
                <button
                  onClick={() => setSelectedCountry('BF')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCountry === 'BF'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🇧🇫 Burkina Faso
                </button>
                <button
                  onClick={() => setSelectedCountry('BJ_TG')}
                  className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCountry === 'BJ_TG'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  🇧🇯 🇹🇬 Bénin / Togo
                </button>
              </div>
            </div>

            {/* Feature Checkbox Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-extrabold">
              <span className="text-slate-400 flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres rapides:
              </span>

              <button
                onClick={() => setFilterMobileOnly(!filterMobileOnly)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterMobileOnly
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-400'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                App Mobile Disponible
              </button>

              <button
                onClick={() => setFilterMobileMoney(!filterMobileMoney)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  filterMobileMoney
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                Dépôt Mobile Money (Wave / OM)
              </button>

              {/* Deposit level filter */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-slate-400 text-[11px]">Dépôt minimum:</span>
                <select
                  value={filterDepositLevel}
                  onChange={e => setFilterDepositLevel(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold outline-none"
                >
                  <option value="ALL">Tous les montants</option>
                  <option value="LOW">Très accessible (&le; 50 000 FCFA)</option>
                  <option value="MEDIUM">Moyen (&le; 250 000 FCFA)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSGIs.length > 0 ? (
              filteredSGIs.map(sgi => (
                <div
                  key={sgi.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {sgi.name}
                          </h3>
                          {sgi.featured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black uppercase">
                              Populaire
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>{sgi.headquarters}</span>
                          {sgi.contactPhone && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                              <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              {sgi.contactPhone}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {sgi.rating}
                      </div>
                    </div>

                    {/* Parent Group Badge */}
                    {sgi.parentGroup && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Groupe:</span> {sgi.parentGroup}
                      </div>
                    )}

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 space-y-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                          Dépôt Minimum
                        </span>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {sgi.minimumDepositEstimate}
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                          Frais de Courtage SGI
                        </span>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {sgi.brokerageFeeEstimate}
                        </div>
                      </div>
                    </div>

                    {/* Digital Capabilities */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Canaux Numériques & Recharge :
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {sgi.hasMobileApp ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
                            <Smartphone className="w-3.5 h-3.5" /> App Mobile
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            <Smartphone className="w-3.5 h-3.5" /> Portail Web
                          </span>
                        )}

                        {sgi.mobileMoneySupported && (
                          <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-bold bg-blue-100/70 dark:bg-blue-950/60 px-2 py-1 rounded-lg">
                            <Wallet className="w-3.5 h-3.5" /> Mobile Money
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Tariff Details */}
                    {(sgi.accountMaintenanceFeeEstimate || sgi.custodyFeeEstimate) && (
                      <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5 text-xs">
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

                    {/* Advantages List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Points Forts & Spécificités :
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {sgi.advantages.map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Target Audience */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <strong className="text-slate-900 dark:text-white block mb-0.5">Profil Recommandé :</strong>
                      {sgi.targetAudience}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 font-medium">
                      Portail : <strong className="text-slate-700 dark:text-slate-300">{sgi.onlinePlatformName}</strong>
                    </div>

                    {sgi.websiteUrl && (
                      <a
                        href={sgi.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:underline"
                      >
                        Site Officiel SGI
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Info className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 dark:text-white text-base">Aucune SGI ne correspond à vos filtres actuels</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Essayez de réinitialiser la recherche ou de sélectionner un autre critère de dépôt.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCountry('ALL');
                    setFilterMobileOnly(false);
                    setFilterMobileMoney(false);
                    setFilterDepositLevel('ALL');
                  }}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom Educational Callout */}
      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 space-y-3">
        <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300 text-sm">
          <HelpCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          Comment ouvrir un compte-titres auprès d'une SGI en 3 étapes ?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-1">
            <span className="font-extrabold text-amber-900 dark:text-amber-300 block">1. Pièces justificatives :</span>
            <p className="text-amber-950/90 dark:text-slate-300 leading-relaxed">
              Préparez votre CNI / Passeport valide, un justificatif de domicile (facture CIE/SODECI ou Senelec) et 2 photos d'identité.
            </p>
          </div>

          <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-1">
            <span className="font-extrabold text-amber-900 dark:text-amber-300 block">2. Inscription en ligne :</span>
            <p className="text-amber-950/90 dark:text-slate-300 leading-relaxed">
              Téléchargez l'application de la SGI choisie (ex: BOA Bourse, Coris Bourse, CGF Bourse) et remplissez le formulaire KYC numérisé.
            </p>
          </div>

          <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-1">
            <span className="font-extrabold text-amber-900 dark:text-amber-300 block">3. Premier dépôt & passage d'ordre :</span>
            <p className="text-amber-950/90 dark:text-slate-300 leading-relaxed">
              Alimentez votre compte par Mobile Money ou virement, puis passez votre premier ordre d'achat sur des actions comme Sonatel, SGBCI ou Orange.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
