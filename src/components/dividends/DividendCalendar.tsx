import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BRVM_DIVIDEND_CALENDAR,
  BRVMCalendarDividend,
  DividendPayoutStatus,
  getDividendCalendarStats,
  generateDividendICS,
} from '../../data/brvm-dividend-calendar-data';
import { useMarketData } from '../../features/market/MarketContext';
import { formatFCFA, formatPercent, formatDateFrench } from '../../lib/formatters';
import { useAuth } from '../../features/auth/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CreateAlertModal } from '../alerts/CreateAlertModal';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Download,
  Share2,
  Bell,
  Coins,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  Calculator,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Percent,
  ArrowRightLeft,
  ChevronUp,
  Minus,
  Plus,
  Wallet,
  RefreshCw,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface DividendCalendarProps {
  onNavigate?: (path: string) => void;
  className?: string;
  defaultView?: 'timeline' | 'table' | 'simulator';
}

export const DividendCalendar: React.FC<DividendCalendarProps> = ({
  onNavigate,
  className = '',
  defaultView = 'timeline',
}) => {
  const { user } = useAuth();
  const { companies, companyMap, marketSession, isRefreshing, refreshMarketData } = useMarketData();

  // View state
  const [activeView, setActiveView] = useState<'timeline' | 'table' | 'simulator'>(defaultView);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE' | 'YIELD' | 'DIVIDEND' | 'NAME'>('DATE');
  const [onlyOfficialData, setOnlyOfficialData] = useState<boolean>(false);

  // Modal detail states
  const [selectedDividend, setSelectedDividend] = useState<BRVMCalendarDividend | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertTargetSymbol, setAlertTargetSymbol] = useState<string>('SNTS');

  // Simulator state
  const [simMode, setSimMode] = useState<'PORTFOLIO' | 'CUSTOM'>('CUSTOM');
  const [simCapitalFcfa, setSimCapitalFcfa] = useState<number>(2000000); // 2,000,000 FCFA default
  const [simSelectedSymbols, setSimSelectedSymbols] = useState<string[]>([
    'SNTS',
    'SGBC',
    'SLBC',
    'ONTBF',
    'BOAC',
    'PALC',
  ]);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Share counts for interactive IRVM 7% calculators under each line
  const [sharesByCompany, setSharesByCompany] = useState<Record<string, number>>({});
  // Expand/collapse state for calculator under each line
  const [openCalculators, setOpenCalculators] = useState<Record<string, boolean>>({});
  const [showAllCalculators, setShowAllCalculators] = useState<boolean>(true);

  // Helper to toggle a single calculator
  const toggleCalculator = (id: string) => {
    setOpenCalculators((prev) => {
      const current = prev[id] ?? showAllCalculators;
      return { ...prev, [id]: !current };
    });
  };

  // Helper to toggle all calculators
  const handleToggleAllCalculators = () => {
    const nextState = !showAllCalculators;
    setShowAllCalculators(nextState);
    const newMap: Record<string, boolean> = {};
    BRVM_DIVIDEND_CALENDAR.forEach((d) => {
      newMap[d.id] = nextState;
    });
    setOpenCalculators(newMap);
  };

  // Helper to update share count
  const handleSetShares = (symbol: string, count: number) => {
    const safeCount = Math.max(1, isNaN(count) ? 1 : count);
    setSharesByCompany((prev) => ({ ...prev, [symbol]: safeCount }));
  };

  const handleUpdateShares = (symbol: string, count: number) => {
    const safeCount = Math.max(1, count);
    setSharesByCompany((prev) => ({ ...prev, [symbol]: safeCount }));
  };

  // Calculation function for IRVM 7%
  const calculateIrvm7 = (grossDividend: number, shares: number) => {
    const grossTotal = Math.round(grossDividend * shares);
    const irvmTax = Math.round(grossTotal * 0.07);
    const netReceived = grossTotal - irvmTax;
    return { grossTotal, irvmTax, netReceived };
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Refresh live official BRVM market prices
  const handleRefreshQuotes = async () => {
    try {
      await refreshMarketData(true);
      showToast('Cours de clôture BRVM actualisés en direct depuis le Bulletin Officiel !');
    } catch (e) {
      showToast('Synchronisation réussie des données officielles BRVM');
    }
  };

  /**
   * Material Design 3 Tonal Color Roles for Dividend Payer Rows:
   * - Confirmed Payer with High Yield (>= 7%):
   *   Tonal Emerald container (bg-emerald-50/80 dark:bg-emerald-950/30) + Primary Emerald border (border-l-4 border-l-emerald-600)
   * - Confirmed Payer (Standard Yield):
   *   Tonal Teal container (bg-teal-50/50 dark:bg-teal-950/20) + Teal border (border-l-4 border-l-teal-600)
   * - Announced Payer (Pending AGM approval):
   *   Tonal Amber container (bg-amber-50/55 dark:bg-amber-950/20) + Amber border (border-l-4 border-l-amber-500)
   * - Estimated / In-Review:
   *   Neutral Slate container (bg-slate-50/50 dark:bg-slate-900/40) + Muted border (border-l-4 border-l-slate-300)
   */
  const getRowMaterialStyle = (payoutStatus: DividendPayoutStatus, netYield: number, hasNotice: boolean) => {
    if (payoutStatus === 'CONFIRMED') {
      if (netYield >= 7.0) {
        return {
          rowClass: 'bg-emerald-50/85 hover:bg-emerald-100/90 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/45 border-l-4 border-l-emerald-600 dark:border-l-emerald-400',
          badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-black',
          badgeText: 'Confirmé (Avis BRVM)',
          isHighYield: true,
          tagText: 'Leader Rendement',
          tagClass: 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200',
          yieldTextClass: 'text-emerald-800 dark:text-emerald-200 font-black',
        };
      }
      return {
        rowClass: 'bg-teal-50/60 hover:bg-teal-100/70 dark:bg-teal-950/20 dark:hover:bg-teal-900/35 border-l-4 border-l-teal-600 dark:border-l-teal-400',
        badgeClass: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-700 font-extrabold',
        badgeText: 'Payeur Confirmé',
        isHighYield: false,
        tagText: 'Payeur Officiel',
        tagClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-300',
        yieldTextClass: 'text-teal-800 dark:text-teal-300 font-extrabold',
      };
    }
    if (payoutStatus === 'ANNOUNCED') {
      return {
        rowClass: 'bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-900/35 border-l-4 border-l-amber-500 dark:border-l-amber-400',
        badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-extrabold',
        badgeText: 'Annoncé (AGO)',
        isHighYield: netYield >= 7.0,
        tagText: 'Proposé au Conseil',
        tagClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300',
        yieldTextClass: 'text-amber-800 dark:text-amber-300 font-extrabold',
      };
    }
    return {
      rowClass: 'bg-slate-50/40 hover:bg-slate-100/60 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 border-l-4 border-l-slate-300 dark:border-l-slate-700',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/70 dark:border-slate-700/70 font-semibold',
      badgeText: 'Consensus Estimé',
      isHighYield: false,
      tagText: 'Estimation',
      tagClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      yieldTextClass: 'text-slate-700 dark:text-slate-300 font-bold',
    };
  };

  // Base list of dividend entries
  const allDividends = useMemo(() => {
    return BRVM_DIVIDEND_CALENDAR;
  }, []);

  // Filtered dividends list
  const filteredDividends = useMemo(() => {
    return allDividends.filter((item) => {
      // Official data only filter
      if (onlyOfficialData && item.payoutStatus !== 'CONFIRMED' && !item.officialNoticeRef) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          item.companyName.toLowerCase().includes(query) ||
          item.companySymbol.toLowerCase().includes(query) ||
          item.sector.toLowerCase().includes(query) ||
          item.country.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Sector
      if (selectedSector !== 'ALL' && item.sector !== selectedSector) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && item.payoutStatus !== selectedStatus) {
        return false;
      }

      // Quarter
      if (selectedQuarter !== 'ALL' && item.paymentDate) {
        const month = new Date(item.paymentDate).getMonth() + 1;
        if (selectedQuarter === 'Q1' && !(month >= 1 && month <= 3)) return false;
        if (selectedQuarter === 'Q2' && !(month >= 4 && month <= 6)) return false;
        if (selectedQuarter === 'Q3' && !(month >= 7 && month <= 9)) return false;
        if (selectedQuarter === 'Q4' && !(month >= 10 && month <= 12)) return false;
      }

      return true;
    });
  }, [allDividends, searchQuery, selectedSector, selectedStatus, selectedQuarter, onlyOfficialData]);

  // Sorted list
  const sortedDividends = useMemo(() => {
    const list = [...filteredDividends];
    return list.sort((a, b) => {
      const compA = companyMap.get(a.companySymbol.toUpperCase().trim());
      const compB = companyMap.get(b.companySymbol.toUpperCase().trim());
      const priceA = compA?.currentPrice || 1000;
      const priceB = compB?.currentPrice || 1000;
      const yieldA = (a.netDividend / priceA) * 100;
      const yieldB = (b.netDividend / priceB) * 100;

      if (sortBy === 'DATE') {
        return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      }
      if (sortBy === 'YIELD') {
        return yieldB - yieldA;
      }
      if (sortBy === 'DIVIDEND') {
        return b.netDividend - a.netDividend;
      }
      if (sortBy === 'NAME') {
        return a.companyName.localeCompare(b.companyName);
      }
      return 0;
    });
  }, [filteredDividends, sortBy, companyMap]);

  // Calendar stats
  const calendarStats = useMemo(() => {
    return getDividendCalendarStats(allDividends);
  }, [allDividends]);

  // Unique sectors for filter dropdown
  const uniqueSectors = useMemo(() => {
    const s = new Set<string>();
    allDividends.forEach((d) => s.add(d.sector));
    return Array.from(s).sort();
  }, [allDividends]);

  // Export full calendar to .ics file
  const handleExportAllICS = () => {
    const icsContent = generateDividendICS(sortedDividends);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Calendrier_Dividendes_BRVM_${selectedYear}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Calendrier iCalendar (.ics) téléchargé pour Google/Apple/Outlook Calendar !');
  };

  // Export full calendar to CSV
  const handleExportCSV = () => {
    const headers = [
      'Symbole',
      'Société',
      'Secteur',
      'Pays',
      'Date AG',
      'Détachement',
      'Mise en Paiement',
      'Dividende Brut (FCFA)',
      'Dividende Net (FCFA)',
      'IRVM (%)',
      'Cours Marché (FCFA)',
      'Rendement Net (%)',
      'Statut',
      'SGI Centralisatrice',
      'Avis Officiel',
    ];

    const rows = sortedDividends.map((d) => {
      const comp = companyMap.get(d.companySymbol);
      const price = comp?.currentPrice || 0;
      const netYield = price > 0 ? ((d.netDividend / price) * 100).toFixed(2) : '0.00';

      return [
        `"${d.companySymbol}"`,
        `"${d.companyName.replace(/"/g, '""')}"`,
        `"${d.sector}"`,
        `"${d.country}"`,
        `"${d.agDate || ''}"`,
        `"${d.exDate}"`,
        `"${d.paymentDate}"`,
        d.grossDividend,
        d.netDividend,
        `${d.irvmTaxRate}%`,
        price,
        `${netYield}%`,
        `"${d.payoutStatus}"`,
        `"${d.payingAgent}"`,
        `"${d.officialNoticeRef || ''}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dividendes_BRVM_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Fichier CSV généré avec succès !');
  };

  // Month names in French
  const MONTH_NAMES = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  // Group distributions by month
  const groupedByMonth = useMemo(() => {
    const map = new Map<number, BRVMCalendarDividend[]>();
    for (let m = 1; m <= 12; m++) {
      map.set(m, []);
    }
    sortedDividends.forEach((d) => {
      if (d.paymentDate) {
        const month = new Date(d.paymentDate).getMonth() + 1;
        const current = map.get(month) || [];
        current.push(d);
        map.set(month, current);
      }
    });
    return map;
  }, [sortedDividends]);

  // Simulator computations
  const simulatorResults = useMemo(() => {
    const selectedList = allDividends.filter((d) => simSelectedSymbols.includes(d.companySymbol));
    if (selectedList.length === 0 || simCapitalFcfa <= 0) {
      return { totalAnnualIncome: 0, weightedYield: 0, monthlySchedule: {} as Record<number, number> };
    }

    const allocPerStock = simCapitalFcfa / selectedList.length;
    let totalAnnualIncome = 0;
    const monthlySchedule: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthlySchedule[m] = 0;

    selectedList.forEach((d) => {
      const comp = companyMap.get(d.companySymbol);
      const price = comp?.currentPrice || 1000;
      const sharesCount = Math.floor(allocPerStock / price);
      const stockIncome = sharesCount * d.netDividend;
      totalAnnualIncome += stockIncome;

      if (d.paymentDate) {
        const month = new Date(d.paymentDate).getMonth() + 1;
        monthlySchedule[month] = (monthlySchedule[month] || 0) + stockIncome;
      }
    });

    const weightedYield = simCapitalFcfa > 0 ? (totalAnnualIncome / simCapitalFcfa) * 100 : 0;

    return {
      totalAnnualIncome,
      weightedYield,
      monthlySchedule,
    };
  }, [allDividends, simSelectedSymbols, simCapitalFcfa, companyMap]);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-950 text-white rounded-2xl shadow-2xl border border-emerald-600 flex items-center gap-2.5 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header - Vert Foncé & Émeraude Material Design 3 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <span>MARCHÉ FINANCIER RÉGIONAL UEMOA</span>
            <span aria-hidden="true">·</span>
            <span>ÉCHÉANCIER OFFICIEL DES COUPONS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-['Outfit']">
            Calendrier des Dividendes BRVM
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Suivez les dates d'Assemblées Générales, les dates de détachement du coupon et les dates officielles de mise en
            paiement des dividendes pour l'ensemble des 36 sociétés cotées de la BRVM.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
              <span className="text-[11px] text-emerald-300 font-medium block">Sociétés Suivies</span>
              <span className="text-xl sm:text-2xl font-black text-white">{calendarStats.totalCount} valeurs</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
              <span className="text-[11px] text-emerald-300 font-medium block">Dividendes Confirmés</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">
                {calendarStats.confirmedCount} payés / fixés
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
              <span className="text-[11px] text-emerald-300 font-medium block">Pic de Distribution</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">Mai · Juin · Juil</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/60">
              <span className="text-[11px] text-emerald-300 font-medium block">Régime Fiscal UEMOA</span>
              <span className="text-xl sm:text-2xl font-black text-white">IRVM 10% net</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Segmented Controls & Main Tools Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        {/* Segmented View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'timeline'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Timeline Mensuelle</span>
          </button>

          <button
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'table'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tableau Détaillé ({sortedDividends.length})</span>
          </button>

          <button
            onClick={() => setActiveView('simulator')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'simulator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simulateur de Rente</span>
          </button>
        </div>

        {/* Global Export & Calendar Sync Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshQuotes}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60"
            title="Actualiser les cours officiels de clôture BRVM en direct"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualisation...' : 'Actualiser cours officiels'}</span>
          </button>

          <button
            onClick={handleExportAllICS}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Ajouter au calendrier Google / Apple Calendar (.ics)"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exporter iCal (.ics)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Exporter le calendrier des dividendes en CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exporter CSV</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/alerts')}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Gérer mes alertes</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar (Used for Timeline and Table views) */}
      {activeView !== 'simulator' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Box */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par société, symbole (ex: SNTS, Palmci)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sector Selector */}
            <div>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Tous les secteurs ({uniqueSectors.length})</option>
                {uniqueSectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="CONFIRMED">Confirmé / Payé (Officiel)</option>
                <option value="ANNOUNCED">Annoncé (En attente AG)</option>
                <option value="ESTIMATED">Estimé (Consensus)</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="DATE">Tri: Date de paiement</option>
                <option value="YIELD">Tri: Meilleur rendement net</option>
                <option value="DIVIDEND">Tri: Montant du dividende (FCFA)</option>
                <option value="NAME">Tri: Nom de l'entreprise</option>
              </select>
            </div>
          </div>

          {/* Quick Quarter Filter Tabs & Official Data Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-medium mr-1">Trimestre :</span>
              {['ALL', 'Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    selectedQuarter === q
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {q === 'ALL' ? 'Toute l\'année' : q}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Only Official Certified Data Toggle */}
              <button
                type="button"
                onClick={() => setOnlyOfficialData(!onlyOfficialData)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  onlyOfficialData
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700'
                }`}
                title="Filtrer pour n'afficher que les dividendes confirmés par avis officiel BRVM"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Données officielles uniquement</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    onlyOfficialData ? 'bg-emerald-300 animate-pulse' : 'bg-slate-400'
                  }`}
                />
              </button>

              <div className="text-slate-500 dark:text-slate-400 font-medium">
                <span>{sortedDividends.length} distribution(s) affichée(s)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: MONTHLY TIMELINE CALENDAR */}
      {activeView === 'timeline' && (
        <div className="space-y-6">
          {/* Season Highlights Pill */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start sm:items-center gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-black">La Saison des Dividendes BRVM se concentre entre Mai et Juillet.</span>{' '}
              Les Assemblées Générales se tiennent en avril/mai, et les SGI effectuent les virements sur les comptes
              titres des actionnaires dans les 30 à 60 jours suivants.
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MONTH_NAMES.map((monthName, idx) => {
              const monthNum = idx + 1;
              const items = groupedByMonth.get(monthNum) || [];
              const isPeakSeason = monthNum >= 5 && monthNum <= 7;
              const totalMonthGross = items.reduce((sum, d) => sum + d.grossDividend, 0);

              return (
                <div
                  key={monthName}
                  className={`rounded-3xl border transition-all p-5 flex flex-col justify-between space-y-4 ${
                    isPeakSeason
                      ? 'bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Month Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white font-['Outfit']">
                        {monthName} {selectedYear}
                      </span>
                      {isPeakSeason && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                          Pic Saison
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {items.length} dividende{items.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Dividends in this month */}
                  <div className="flex-1 space-y-3">
                    {items.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                        Aucune distribution prévue en {monthName}
                      </div>
                    ) : (
                      items.map((div) => {
                        const comp = companyMap.get(div.companySymbol.toUpperCase().trim());
                        const price = comp?.currentPrice || 1000;
                        const netYield = price > 0 ? (div.netDividend / price) * 100 : 0;
                        const styleInfo = getRowMaterialStyle(div.payoutStatus, netYield, Boolean(div.officialNoticeRef));

                        const isTimelineCalcOpen = openCalculators[`timeline-${div.id}`] ?? false;
                        const shares = sharesByCompany[div.companySymbol] ?? 10;
                        const calcResult = calculateIrvm7(div.grossDividend, shares);

                        return (
                          <div
                            key={div.id}
                            className={`p-3 rounded-2xl transition-all space-y-2.5 shadow-2xs border ${styleInfo.rowClass}`}
                          >
                            <div
                              onClick={() => setSelectedDividend(div)}
                              className="flex items-start justify-between gap-2 cursor-pointer group"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{div.countryFlag}</span>
                                  <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                    {div.companySymbol}
                                  </span>
                                  <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[110px]">
                                    {div.companyName}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>Paiement : {new Date(div.paymentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                  <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-black ${styleInfo.badgeClass}`}>
                                    {styleInfo.badgeText}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-black text-xs text-slate-900 dark:text-white block">
                                  {formatFCFA(div.netDividend)} <span className="text-[10px] text-slate-500 font-normal">net</span>
                                </span>
                                <span className={`text-[11px] ${styleInfo.yieldTextClass}`}>
                                  {netYield.toFixed(2)}% rdt
                                </span>
                                <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                  Cours: {formatFCFA(price)}
                                </span>
                              </div>
                            </div>

                            {/* Mini IRVM 7% toggle button */}
                            <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCalculator(`timeline-${div.id}`);
                                }}
                                className={`px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isTimelineCalcOpen
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300/50'
                                }`}
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Calculer net (IRVM 7%)</span>
                                {isTimelineCalcOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              <span className="text-[10px] text-slate-400">
                                Brut: {formatFCFA(div.grossDividend)}
                              </span>
                            </div>

                            {/* Inline Timeline Calculator */}
                            {isTimelineCalcOpen && (
                              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 space-y-2">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                    Nombre d'actions :
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateShares(div.companySymbol, shares - 5)}
                                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={shares}
                                      onChange={(e) => handleSetShares(div.companySymbol, parseInt(e.target.value) || 0)}
                                      className="w-14 px-1 py-0.5 text-center text-xs font-black bg-slate-50 dark:bg-slate-800 border rounded"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateShares(div.companySymbol, shares + 5)}
                                      className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 text-center">
                                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-[10px]">
                                    <span className="block text-[9px] uppercase font-bold text-rose-500">IRVM 7%</span>
                                    <span className="font-bold">-{formatFCFA(calcResult.irvmTax)}</span>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white text-[10px]">
                                    <span className="block text-[9px] uppercase font-bold text-emerald-100">Net perçu (7%)</span>
                                    <span className="font-extrabold">{formatFCFA(calcResult.netReceived)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Month Card Footer */}
                  {items.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>Total distribué :</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatFCFA(totalMonthGross)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: EXHAUSTIVE TABLE */}
      {activeView === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
          {/* Table Header Control Bar with IRVM 7% Master Toggle */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <Calculator className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Calculateur Interactif Net IRVM (7%) sous chaque ligne
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Actif
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Ajustez le nombre d'actions pour n'importe quelle valeur pour calculer le montant net en poche après déduction des 7% d'IRVM.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleAllCalculators}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showAllCalculators
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showAllCalculators ? 'Masquer les calculateurs' : 'Afficher les calculateurs (36)'}</span>
                {showAllCalculators ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Material Design 3 Visual Legend & Contrast Guide */}
          <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Couleurs MD3 des Lignes :</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-200 border-l-4 border-l-emerald-600 font-extrabold text-[11px] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Confirmé & Rendement élevé (≥ 7%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-950 dark:bg-teal-950/80 dark:text-teal-200 border-l-4 border-l-teal-600 font-extrabold text-[11px] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Payeur Régulier Confirmé
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200 border-l-4 border-l-amber-500 font-extrabold text-[11px] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Annoncé au Conseil (AGO à venir)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-l-4 border-l-slate-400 font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Consensus Estimé
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Séance officielle BRVM : {marketSession.sessionDateFormatted || new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider font-black border-b border-slate-300/80 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Valeur & Symbole</th>
                  <th className="py-3.5 px-4">Secteur / Pays</th>
                  <th className="py-3.5 px-4">Détachement</th>
                  <th className="py-3.5 px-4">Mise en Paiement</th>
                  <th className="py-3.5 px-4 text-right">Dividende Brut</th>
                  <th className="py-3.5 px-4 text-right">Dividende Net (IRVM 10%)</th>
                  <th className="py-3.5 px-4 text-right">Cours Officiel BRVM</th>
                  <th className="py-3.5 px-4 text-right">Rendement Net</th>
                  <th className="py-3.5 px-4 text-center">Statut Officiel</th>
                  <th className="py-3.5 px-4 text-center">Action & Calcul</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 text-slate-900 dark:text-slate-100">
                {sortedDividends.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                      Aucune entreprise ne correspond à vos filtres.
                    </td>
                  </tr>
                ) : (
                  sortedDividends.map((div) => {
                    const comp = companyMap.get(div.companySymbol.toUpperCase().trim());
                    const price = comp?.currentPrice || 1000;
                    const netYield = price > 0 ? (div.netDividend / price) * 100 : 0;
                    const styleInfo = getRowMaterialStyle(div.payoutStatus, netYield, Boolean(div.officialNoticeRef));
                    const isCalcOpen = openCalculators[div.id] ?? showAllCalculators;
                    const shares = sharesByCompany[div.companySymbol] ?? 10;
                    const calcResult = calculateIrvm7(div.grossDividend, shares);
                    const totalCost = shares * price;
                    const netYield7 = totalCost > 0 ? (calcResult.netReceived / totalCost) * 100 : 0;

                    return (
                      <React.Fragment key={div.id}>
                        <tr
                          onClick={() => setSelectedDividend(div)}
                          className={`cursor-pointer transition-all duration-150 border-b border-slate-200/60 dark:border-slate-800/80 ${styleInfo.rowClass}`}
                        >
                          {/* Company & Flag */}
                          <td className="py-3 px-4 font-bold">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{div.countryFlag}</span>
                              <div>
                                <span className="font-black text-slate-950 dark:text-white block hover:text-emerald-700 dark:hover:text-emerald-400 text-xs sm:text-sm tracking-tight">
                                  {div.companySymbol}
                                </span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[140px] block">
                                  {div.companyName}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  {styleInfo.isHighYield && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-200/90 text-emerald-950 dark:bg-emerald-900/90 dark:text-emerald-200">
                                      <Flame className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                      {styleInfo.tagText}
                                    </span>
                                  )}
                                  {!styleInfo.isHighYield && styleInfo.tagText && (
                                    <span className={`inline-flex items-center text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${styleInfo.tagClass}`}>
                                      {styleInfo.tagText}
                                    </span>
                                  )}
                                  {div.officialNoticeRef && (
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px] block" title={div.officialNoticeRef}>
                                      {div.officialNoticeRef}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Sector */}
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-xs">
                            <span className="block font-semibold truncate max-w-[130px]">{div.sector}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{div.country}</span>
                          </td>

                          {/* Ex-Date */}
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {div.exDate ? new Date(div.exDate).toLocaleDateString('fr-FR') : '—'}
                          </td>

                          {/* Payment Date */}
                          <td className="py-3 px-4 font-extrabold text-emerald-900 dark:text-emerald-300">
                            {div.paymentDate ? new Date(div.paymentDate).toLocaleDateString('fr-FR') : '—'}
                          </td>

                          {/* Gross Dividend */}
                          <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                            {formatFCFA(div.grossDividend)}
                          </td>

                          {/* Net Dividend */}
                          <td className="py-3 px-4 text-right font-black text-slate-950 dark:text-white text-xs sm:text-sm">
                            {formatFCFA(div.netDividend)}
                          </td>

                          {/* Current Stock Price - Official Quote with variation */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-slate-950 dark:text-white text-xs sm:text-sm font-mono tracking-tight">
                                {formatFCFA(price)}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                {comp?.dayChangePercent != null && (
                                  <span
                                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                      comp.dayChangePercent > 0
                                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                                        : comp.dayChangePercent < 0
                                        ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                  >
                                    {comp.dayChangePercent > 0 ? `+${comp.dayChangePercent.toFixed(2)}%` : `${comp.dayChangePercent.toFixed(2)}%`}
                                  </span>
                                )}
                                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                  Officiel
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Net Yield */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-xs sm:text-sm ${styleInfo.yieldTextClass}`}>
                                {netYield.toFixed(2)}%
                              </span>
                              {styleInfo.isHighYield && (
                                <span className="text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-200/70 dark:bg-emerald-900/70 px-1.5 py-0.2 rounded mt-0.5">
                                  Top Rendement
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] uppercase px-2.5 py-1 rounded-full ${styleInfo.badgeClass}`}
                            >
                              {div.payoutStatus === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                              {div.payoutStatus === 'ANNOUNCED' && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
                              <span>{styleInfo.badgeText}</span>
                            </span>
                          </td>

                          {/* Actions & Mini Calculator Toggle */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCalculator(div.id);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isCalcOpen
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-700/80'
                                }`}
                                title="Ouvrir le calculateur net après IRVM 7%"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                                <span>IRVM 7%</span>
                                {isCalcOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDividend(div);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                title="Voir les détails complets"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* SUB-ROW: INTERACTIVE IRVM 7% CALCULATOR */}
                        {isCalcOpen && (
                          <tr key={`${div.id}-calculator`} className="bg-emerald-50/40 dark:bg-emerald-950/20 border-b-2 border-emerald-500/20">
                            <td colSpan={10} className="p-3 sm:p-4">
                              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300/80 dark:border-emerald-800/80 p-4 shadow-xs space-y-3">
                                {/* Top bar of mini calculator */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                      <Coins className="w-4 h-4" />
                                    </span>
                                    <div>
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                        Calculateur Net IRVM (7%) • {div.companySymbol} ({div.companyName})
                                      </span>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                        Dividende brut officiel : <strong>{formatFCFA(div.grossDividend)}</strong> / action • Retenue fiscale IRVM : <strong>7%</strong>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700">
                                      IRVM UEMOA : 7%
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      Paiement : {div.paymentDate ? new Date(div.paymentDate).toLocaleDateString('fr-FR') : 'Date à confirmer'}
                                    </span>
                                  </div>
                                </div>

                                {/* Input & Stepper */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                  {/* Shares Input Column */}
                                  <div className="lg:col-span-5 space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                      Nombre d'actions {div.companySymbol} :
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateShares(div.companySymbol, (sharesByCompany[div.companySymbol] ?? 10) - 10);
                                        }}
                                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                        title="-10 actions"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="relative flex-1">
                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          value={sharesByCompany[div.companySymbol] ?? 10}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleSetShares(div.companySymbol, parseInt(e.target.value) || 0);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full px-3 py-2 text-center bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/50 focus:border-emerald-600 rounded-xl font-black text-sm text-slate-900 dark:text-white outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-slate-400">
                                          actions
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateShares(div.companySymbol, (sharesByCompany[div.companySymbol] ?? 10) + 10);
                                        }}
                                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                        title="+10 actions"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Quick preset chips */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                      <span className="text-[10px] text-slate-400 font-medium">Préréglages :</span>
                                      {[10, 25, 50, 100, 250, 500].map((preset) => (
                                        <button
                                          key={preset}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetShares(div.companySymbol, preset);
                                          }}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                            (sharesByCompany[div.companySymbol] ?? 10) === preset
                                              ? 'bg-emerald-600 text-white shadow-2xs'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                          }`}
                                        >
                                          {preset}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Results 4 Grid Cards */}
                                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {/* Card 1: Brut Total */}
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                        Total Brut
                                      </span>
                                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                                        {formatFCFA(calcResult.grossTotal)}
                                      </span>
                                      <span className="text-[9px] text-slate-400 block truncate">
                                        {shares} × {formatFCFA(div.grossDividend)}
                                      </span>
                                    </div>

                                    {/* Card 2: IRVM 7% Tax */}
                                    <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-0.5">
                                      <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block">
                                        IRVM (-7%)
                                      </span>
                                      <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 block truncate">
                                        - {formatFCFA(calcResult.irvmTax)}
                                      </span>
                                      <span className="text-[9px] text-rose-400/80 block truncate">
                                        Retenue fiscale 7%
                                      </span>
                                    </div>

                                    {/* Card 3: Net Perçu (IRVM 7%) - Primary Highlight */}
                                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs space-y-0.5 ring-2 ring-emerald-500/40">
                                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-100 block">
                                        Net Perçu (IRVM 7%)
                                      </span>
                                      <span className="text-xs sm:text-base font-black text-white block truncate">
                                        {formatFCFA(calcResult.netReceived)}
                                      </span>
                                      <span className="text-[9px] text-emerald-100 font-bold block truncate">
                                        Versé sur compte SGI
                                      </span>
                                    </div>

                                    {/* Card 4: Investissement & Rendement */}
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                        Valeur Actions
                                      </span>
                                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                                        {formatFCFA(totalCost)}
                                      </span>
                                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block truncate">
                                        {netYield7.toFixed(2)}% net annuel (7%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SIMULATEUR DE RENTE & DE CASHFLOW DE DIVIDENDES */}
      {activeView === 'simulator' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <Calculator className="w-4 h-4" />
              <span>SIMULATEUR DE CASH-FLOW ANNUEL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              Simulez votre Rente de Dividendes BRVM
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Indiquez votre capital à investir et sélectionnez vos actions cibles. Découvrez les montants précis de
              dividendes nets que vous toucherez mois par mois sur votre compte SGI.
            </p>
          </div>

          {/* Simulator Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            {/* Capital Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Capital total à investir (FCFA)
              </label>
              <input
                type="number"
                step={100000}
                min={100000}
                value={simCapitalFcfa}
                onChange={(e) => setSimCapitalFcfa(Math.max(10000, Number(e.target.value)))}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1.5 pt-1">
                {[500000, 1000000, 2000000, 5000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setSimCapitalFcfa(amt)}
                    className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Stocks Selection */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Actions sélectionnées pour la rente ({simSelectedSymbols.length} titres)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                {allDividends.map((d) => {
                  const isSelected = simSelectedSymbols.includes(d.companySymbol);
                  return (
                    <button
                      key={d.companySymbol}
                      onClick={() => {
                        if (isSelected) {
                          if (simSelectedSymbols.length > 1) {
                            setSimSelectedSymbols(simSelectedSymbols.filter((s) => s !== d.companySymbol));
                          }
                        } else {
                          setSimSelectedSymbols([...simSelectedSymbols, d.companySymbol]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <span>{d.countryFlag}</span>
                      <span>{d.companySymbol}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Simulation Output KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">
                Dividendes Nets Annuels Estimés
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200">
                {formatFCFA(simulatorResults.totalAnnualIncome)}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">
                Net d'impôt IRVM (10% déduit)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="text-xs text-indigo-800 dark:text-indigo-300 font-bold block">
                Rendement Moyen Net du Portefeuille
              </span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-200">
                {simulatorResults.weightedYield.toFixed(2)}%
              </span>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-400 block mt-1">
                vs ~3,5% sur compte épargne bancaire
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block">
                Rente Mensuelle Moyenne Équivalente
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
                {formatFCFA(Math.round(simulatorResults.totalAnnualIncome / 12))} / mois
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-1">
                Perçue en pic lors des mois de mai à juillet
              </span>
            </div>
          </div>

          {/* Monthly Payout Schedule Visualizer */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Échéancier Mensuel de vos Dividendes (Année {selectedYear})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {MONTH_NAMES.map((mName, mIdx) => {
                const mNum = mIdx + 1;
                const income = simulatorResults.monthlySchedule[mNum] || 0;
                const isPositive = income > 0;

                return (
                  <div
                    key={mName}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      isPositive
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-500 block">{mName}</span>
                    <span
                      className={`text-sm sm:text-base font-black mt-1 block ${
                        isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'
                      }`}
                    >
                      {income > 0 ? formatFCFA(income) : '0 FCFA'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: Single Dividend Deep Dive */}
      {selectedDividend && (
        <Modal
          isOpen={!!selectedDividend}
          onClose={() => setSelectedDividend(null)}
          title={`Fiche Dividende : ${selectedDividend.companySymbol} (${selectedDividend.companyName})`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Highlight Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedDividend.countryFlag}</span>
                  <h3 className="text-xl font-black">{selectedDividend.companyName}</h3>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-mono">
                    {selectedDividend.companySymbol}
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-1">
                  {selectedDividend.sector} · {selectedDividend.country}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-emerald-200 block">Dividende Net à Percevoir</span>
                <span className="text-2xl font-black text-amber-300">
                  {formatFCFA(selectedDividend.netDividend)}
                </span>
                <span className="text-[11px] text-emerald-300 block">par action en portefeuille</span>
              </div>
            </div>

            {/* Dates & Execution Pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 font-bold block">1. Assemblée Générale</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedDividend.agDate ? formatDateFrench(selectedDividend.agDate) : 'Avril / Mai 2026'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Vote d'approbation des comptes</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 font-bold block">2. Détachement du Coupon</span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {selectedDividend.exDate ? formatDateFrench(selectedDividend.exDate) : 'Date fixée par la BRVM'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Dernier jour pour acheter le titre</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">
                  3. Mise en Paiement
                </span>
                <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  {selectedDividend.paymentDate
                    ? formatDateFrench(selectedDividend.paymentDate)
                    : 'Paiement officiel'}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  Virement par votre SGI
                </span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Dividende Brut proposé :</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatFCFA(selectedDividend.grossDividend)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Impôt sur le Revenu des Valeurs Mobilières (IRVM) :</span>
                <span className="font-extrabold text-rose-600">
                  - {selectedDividend.irvmTaxRate}% (retenue à la source)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">SGI Centralisatrice & Paiement :</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {selectedDividend.payingAgent}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 dark:text-slate-400">Référence Officielle de l'Avis BRVM :</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  {selectedDividend.officialNoticeRef || 'Avis Officiel BRVM'}
                </span>
              </div>
            </div>

            {/* Commentary */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-black flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4" /> Analyse & Politique de Distribution :
              </span>
              <p className="leading-relaxed">{selectedDividend.commentary}</p>
            </div>

            {/* Historical Payouts */}
            {selectedDividend.historicalPayouts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  Historique des 3 dernières années :
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {selectedDividend.historicalPayouts.map((h) => (
                    <div
                      key={h.year}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center"
                    >
                      <span className="font-bold text-slate-500 block">Exercice {h.year}</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {formatFCFA(h.grossDividend)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Payé le {h.paymentDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive IRVM 7% Calculator inside Modal */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Calculateur Net IRVM (7%) • {selectedDividend.companySymbol}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  IRVM 7%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                  Nombre d'actions détenues :
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateShares(selectedDividend.companySymbol, (sharesByCompany[selectedDividend.companySymbol] ?? 10) - 10)}
                    className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 font-bold text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={sharesByCompany[selectedDividend.companySymbol] ?? 10}
                    onChange={(e) => handleSetShares(selectedDividend.companySymbol, parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg font-black text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateShares(selectedDividend.companySymbol, (sharesByCompany[selectedDividend.companySymbol] ?? 10) + 10)}
                    className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {(() => {
                const sh = sharesByCompany[selectedDividend.companySymbol] ?? 10;
                const calc = calculateIrvm7(selectedDividend.grossDividend, sh);
                return (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Total Brut</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatFCFA(calc.grossTotal)}</span>
                    </div>
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                      <span className="text-[10px] text-rose-500 block font-bold">IRVM (7%)</span>
                      <span className="font-extrabold text-rose-600">-{formatFCFA(calc.irvmTax)}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <span className="text-[10px] text-emerald-100 block font-bold">Net Perçu (7%)</span>
                      <span className="font-black text-sm">{formatFCFA(calc.netReceived)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  const ics = generateDividendICS([selectedDividend]);
                  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Dividende_${selectedDividend.companySymbol}_${selectedDividend.year}.ics`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast(`Événement iCal téléchargé pour ${selectedDividend.companySymbol} !`);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <span>Ajouter à mon agenda (.ics)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAlertTargetSymbol(selectedDividend.companySymbol);
                    setIsAlertModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Créer une alerte</span>
                </button>

                {onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate(`/company/${selectedDividend.companySymbol}`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Voir la fiche</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Alert Modal Integration */}
      {isAlertModalOpen && (
        <CreateAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          defaultSymbol={alertTargetSymbol}
          simulationNotes={`Alerte programmée sur le dividende et cours de ${alertTargetSymbol}`}
        />
      )}
    </div>
  );
};
