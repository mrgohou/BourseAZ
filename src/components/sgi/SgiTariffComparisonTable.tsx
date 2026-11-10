import React, { useState, useMemo } from 'react';
import { BRVM_SGI_LIST, SGIInfo } from '../../data/sgi-data';
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
  Coins,
  Calculator,
  ArrowUpDown,
  Filter,
  Check,
  X,
  Layers,
  Sparkles,
  Zap,
  Info,
  Phone,
  ArrowRight,
  TrendingUp,
  Percent,
  Copy,
  SlidersHorizontal
} from 'lucide-react';

interface SgiTariffComparisonTableProps {
  onNavigate?: (path: string) => void;
  onSelectSgi?: (sgiId: string) => void;
  selectedForCompare?: string[];
  onToggleCompare?: (sgiId: string) => void;
  onClearCompare?: () => void;
  onOpenCompareModal?: () => void;
}

export const SgiTariffComparisonTable: React.FC<SgiTariffComparisonTableProps> = ({
  onNavigate,
  onSelectSgi,
  selectedForCompare: propSelectedForCompare,
  onToggleCompare,
  onClearCompare,
  onOpenCompareModal,
}) => {
  // Filters state
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMobileApp, setFilterMobileApp] = useState<boolean>(false);
  const [filterMobileMoney, setFilterMobileMoney] = useState<boolean>(false);
  const [filterFreeAccount, setFilterFreeAccount] = useState<boolean>(false);
  const [maxDepositFilter, setMaxDepositFilter] = useState<'ALL' | '50K' | '250K' | '500K'>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'deposit' | 'rating' | 'brokerage'>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selected SGI for direct side-by-side comparison (max 3, initially empty)
  const [internalSelectedForCompare, setInternalSelectedForCompare] = useState<string[]>([]);
  const selectedForCompare = propSelectedForCompare !== undefined ? propSelectedForCompare : internalSelectedForCompare;
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Live order fee simulator amount
  const [simulatedOrderAmount, setSimulatedOrderAmount] = useState<number>(250000);
  const [showFeeSimCol, setShowFeeSimCol] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Countries metadata
  const countries = [
    { code: 'ALL', label: 'Tous les pays', flag: '🌍' },
    { code: 'CI', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'SN', label: 'Sénégal', flag: '🇸🇳' },
    { code: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'BJ', label: 'Bénin', flag: '🇧🇯' },
    { code: 'TG', label: 'Togo', flag: '🇹🇬' },
    { code: 'ML', label: 'Mali', flag: '🇲🇱' },
    { code: 'NE', label: 'Niger', flag: '🇳🇪' },
  ];

  // Helper to extract numerical deposit value for sorting & filtering
  const getNumericDeposit = (depositStr: string): number => {
    if (!depositStr || depositStr.toLowerCase().includes('non exigé') || depositStr.toLowerCase().includes('gratuit')) {
      return 0;
    }
    const clean = depositStr.replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 50000;
  };

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

  // Filtered and Sorted SGI list
  const processedSgis = useMemo(() => {
    const filtered = BRVM_SGI_LIST.filter(sgi => {
      // Country match
      if (selectedCountry !== 'ALL') {
        const matchesCode = sgi.countryCode === selectedCountry || sgi.countryCode.includes(selectedCountry);
        const matchesName = sgi.country.toLowerCase().includes(
          countries.find(c => c.code === selectedCountry)?.label.toLowerCase() || ''
        );
        const isRegional = sgi.country.includes('UEMOA') || sgi.country.includes('Régional');
        if (!matchesCode && !matchesName && !isRegional) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          sgi.name.toLowerCase().includes(q) ||
          sgi.shortName.toLowerCase().includes(q) ||
          sgi.headquarters.toLowerCase().includes(q) ||
          (sgi.parentGroup && sgi.parentGroup.toLowerCase().includes(q)) ||
          sgi.targetAudience.toLowerCase().includes(q) ||
          sgi.advantages.some(a => a.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Feature filters
      if (filterMobileApp && !sgi.hasMobileApp) return false;
      if (filterMobileMoney && !sgi.mobileMoneySupported) return false;
      if (filterFreeAccount) {
        const fee = (sgi.accountMaintenanceFeeEstimate || '').toLowerCase();
        const isFree = fee.includes('0 fcfa') || fee.includes('gratuit') || fee.includes('néant');
        if (!isFree) return false;
      }

      // Max Deposit filter
      const numDep = getNumericDeposit(sgi.minimumDepositEstimate);
      if (maxDepositFilter === '50K' && numDep > 50000) return false;
      if (maxDepositFilter === '250K' && numDep > 250000) return false;
      if (maxDepositFilter === '500K' && numDep > 500000) return false;

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'deposit') {
        comparison = getNumericDeposit(a.minimumDepositEstimate) - getNumericDeposit(b.minimumDepositEstimate);
      } else if (sortField === 'rating') {
        comparison = a.rating - b.rating;
      } else if (sortField === 'brokerage') {
        comparison = getNumericBrokerage(a.brokerageFeeEstimate) - getNumericBrokerage(b.brokerageFeeEstimate);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    selectedCountry,
    searchQuery,
    filterMobileApp,
    filterMobileMoney,
    filterFreeAccount,
    maxDepositFilter,
    sortField,
    sortDirection,
  ]);

  const toggleSort = (field: 'name' | 'deposit' | 'rating' | 'brokerage') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleCompare = (sgiId: string) => {
    if (onToggleCompare) {
      onToggleCompare(sgiId);
      return;
    }
    setInternalSelectedForCompare(prev => {
      if (prev.includes(sgiId)) {
        return prev.filter(id => id !== sgiId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), sgiId]; // keep last 3 max
      }
      return [...prev, sgiId];
    });
  };

  const handleClearCompare = () => {
    if (onClearCompare) {
      onClearCompare();
    } else {
      setInternalSelectedForCompare([]);
    }
  };

  const handleOpenModal = () => {
    if (onOpenCompareModal) {
      onOpenCompareModal();
    } else {
      setIsCompareModalOpen(true);
    }
  };

  const handleCopySummary = () => {
    const lines = processedSgis.map(
      s => `${s.name} (${s.countryCode}) | Dépôt: ${s.minimumDepositEstimate} | Courtage: ${s.brokerageFeeEstimate} | Garde: ${s.custodyFeeEstimate || 'N/A'}`
    );
    navigator.clipboard.writeText(lines.join('\n'));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const comparedSgiObjects = useMemo(() => {
    return selectedForCompare
      .map(id => BRVM_SGI_LIST.find(s => s.id === id))
      .filter((s): s is SGIInfo => s !== undefined);
  }, [selectedForCompare]);

  return (
    <div className="space-y-6">
      {/* Interactive Header & Intro */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white border border-indigo-800/40 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Comparateur & Grilles Tarifaires Homologuées
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Tableau Récapitulatif & Comparatif des SGI UEMOA
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 font-medium leading-relaxed">
              Filtrez par pays, comparez les dépôts minimums d'ouverture, les pourcentages de courtage, les frais de tenue de compte et les droits de garde annuels en toute transparence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenModal}
              disabled={selectedForCompare.length < 2}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Face-à-Face ({selectedForCompare.length}/3 SGI)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-800/60"
              title="Copier le résumé des tarifs filtrés"
            >
              {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copySuccess ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Mini-Widget */}
        <div className="pt-4 border-t border-indigo-800/40 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300">
            <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Simulateur d'ordre pour le tableau :</span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="50000"
              min="10000"
              value={simulatedOrderAmount}
              onChange={e => setSimulatedOrderAmount(Math.max(1000, Number(e.target.value)))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-indigo-700/60 text-emerald-400 font-black text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="absolute right-3 top-2 text-xs text-indigo-300 font-bold">FCFA d'ordre</span>
          </div>

          <div className="text-right text-xs text-indigo-300 font-semibold">
            TVA 18% + Commissions BRVM (0,20%) et DC/BR (0,10%) incluses.
          </div>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Country Filter Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Filtrer par Pays d'Implantation :
            </span>
            <span>{processedSgis.length} SGI répertoriée(s)</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-extrabold scrollbar-thin">
            {countries.map(c => {
              const isSelected = selectedCountry === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`px-3.5 py-2 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Secondary Filter Chips */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filtrer par nom (ex: Bridge, BOA, Coris, CGF, NSIA, Ecobank, Hudson)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Feature and Deposit Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setFilterMobileApp(!filterMobileApp)}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-colors ${
                filterMobileApp
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-800 dark:text-blue-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              App Mobile
            </button>

            <button
              onClick={() => setFilterMobileMoney(!filterMobileMoney)}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-colors ${
                filterMobileMoney
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Mobile Money
            </button>

            <button
              onClick={() => setFilterFreeAccount(!filterFreeAccount)}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-colors ${
                filterFreeAccount
                  ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 text-purple-800 dark:text-purple-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-purple-600" />
              Tenue Gratuite (0F)
            </button>

            {/* Deposit threshold selector */}
            <select
              value={maxDepositFilter}
              onChange={e => setMaxDepositFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Tous dépôts min.</option>
              <option value="50K">Dépôt &le; 50 000 FCFA</option>
              <option value="250K">Dépôt &le; 250 000 FCFA</option>
              <option value="500K">Dépôt &le; 500 000 FCFA</option>
            </select>

            {(searchQuery || selectedCountry !== 'ALL' || filterMobileApp || filterMobileMoney || filterFreeAccount || maxDepositFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedCountry('ALL');
                  setSearchQuery('');
                  setFilterMobileApp(false);
                  setFilterMobileMoney(false);
                  setFilterFreeAccount(false);
                  setMaxDepositFilter('ALL');
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer ml-auto"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Summary Table (Tableau Récapitulatif) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/90 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">
                  <span className="sr-only">Sélectionner</span>
                  <span className="text-[10px] text-slate-400 font-black">Comp.</span>
                </th>

                <th
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SGI & Siège</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('deposit')}
                  className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Dépôt Initial Min.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('brokerage')}
                  className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Frais Courtage SGI</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {showFeeSimCol && (
                  <th className="py-3.5 px-4 text-right bg-emerald-50/50 dark:bg-emerald-950/20 border-x border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center justify-end gap-1 text-emerald-800 dark:text-emerald-300">
                      <Calculator className="w-3 h-3" />
                      <span>Coût Ordre ({simulatedOrderAmount.toLocaleString('fr-FR')} F)</span>
                    </div>
                  </th>
                )}

                <th className="py-3.5 px-4">Tenue de Compte</th>
                <th className="py-3.5 px-4">Droits de Garde</th>
                <th className="py-3.5 px-4 text-center">Canaux & Dépôts</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {processedSgis.length > 0 ? (
                processedSgis.map((sgi, index) => {
                  const isChecked = selectedForCompare.includes(sgi.id);
                  const numDeposit = getNumericDeposit(sgi.minimumDepositEstimate);
                  const feeCalc = calculateFeesForSgi(sgi, simulatedOrderAmount);

                  return (
                    <tr
                      key={sgi.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        isChecked ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox for compare */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCompare(sgi.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          title="Cocher pour comparer en face-à-face"
                        />
                      </td>

                      {/* SGI Name & Headquarters */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xs shrink-0">
                            {sgi.countryCode}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                                {sgi.name}
                              </span>
                              {sgi.featured && (
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-black uppercase">
                                  Top
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{sgi.headquarters}</span>
                              {sgi.parentGroup && <span className="text-slate-400">({sgi.parentGroup})</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Minimum Deposit */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                            numDeposit <= 50000
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : numDeposit <= 250000
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {sgi.minimumDepositEstimate}
                        </span>
                      </td>

                      {/* Brokerage fee */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 dark:text-slate-200">
                        {sgi.brokerageFeeEstimate}
                      </td>

                      {/* Simulation result column */}
                      {showFeeSimCol && (
                        <td className="py-3.5 px-4 text-right bg-emerald-50/30 dark:bg-emerald-950/10 border-x border-emerald-100 dark:border-emerald-900/40">
                          <div className="font-black text-emerald-700 dark:text-emerald-400 text-xs">
                            {Math.round(feeCalc.totalFees).toLocaleString('fr-FR')} FCFA
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            ~{feeCalc.percent.toFixed(2)}% TTC
                          </div>
                        </td>
                      )}

                      {/* Account Maintenance */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {sgi.accountMaintenanceFeeEstimate ? (
                          sgi.accountMaintenanceFeeEstimate.toLowerCase().includes('0 fcfa') ||
                          sgi.accountMaintenanceFeeEstimate.toLowerCase().includes('gratuit') ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Gratuit
                            </span>
                          ) : (
                            <span className="font-medium">{sgi.accountMaintenanceFeeEstimate}</span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Custody fee */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {sgi.custodyFeeEstimate || '0,20% à 0,50% / an'}
                      </td>

                      {/* Channels & Payment */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {sgi.hasMobileApp && (
                            <span
                              className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                              title="Application Mobile dédiée (Android / iOS)"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {sgi.hasWebPortal && (
                            <span
                              className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                              title="Plateforme Web Bourse Direct"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {sgi.mobileMoneySupported && (
                            <span
                              className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              title="Rechargement Wave, Orange Money ou MTN"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {sgi.websiteUrl ? (
                          <a
                            href={sgi.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600 dark:hover:text-white text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs"
                          >
                            <span>Ouvrir</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">En agence</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showFeeSimCol ? 9 : 8} className="py-12 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-800 dark:text-white">
                      Aucune SGI ne correspond aux filtres sélectionnés.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCountry('ALL');
                        setSearchQuery('');
                        setFilterMobileApp(false);
                        setFilterMobileMoney(false);
                        setFilterFreeAccount(false);
                        setMaxDepositFilter('ALL');
                      }}
                      className="mt-2 text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      Effacer tous les filtres
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Bottom Comparison Floating Bar */}
      {selectedForCompare.length > 0 && !propSelectedForCompare && (
        <div className="sticky bottom-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl border border-indigo-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
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
            <div className="text-xs">
              <span className="font-extrabold text-white">
                {selectedForCompare.length}/3 SGI sélectionnée{selectedForCompare.length > 1 ? 's' : ''} :
              </span>{' '}
              <span className="text-indigo-300 hidden sm:inline">
                {comparedSgiObjects.map(s => s.shortName || s.name).join(', ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearCompare}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Vider
            </button>
            <button
              onClick={handleOpenModal}
              disabled={selectedForCompare.length < 2}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comparer Côte à Côte ({selectedForCompare.length}/3)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Direct Face-to-Face Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Comparaison Face-à-Face
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Comparateur Détaillé des SGI Sélectionnées
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Comparison Grid */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                              {sgi.country}
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
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
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
  );
};
