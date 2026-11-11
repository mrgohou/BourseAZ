import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Download,
  Search,
  PieChart as PieChartIcon,
  BarChart3,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  DollarSign,
  Sparkles,
  Info,
  Calendar,
  FileSpreadsheet,
  FileText,
  Percent,
  Trash2,
  Calculator,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../../features/auth/AuthContext';
import {
  VirtualPortfolio,
  VirtualPositionCalculated,
  Company,
  VirtualOrderType,
} from '../../types';
import { DEMO_COMPANIES } from '../../data/demo-data';
import {
  loadVirtualPortfolio,
  saveVirtualPortfolio,
  calculatePortfolioKPIs,
  executeBuyOrder,
  executeSellOrder,
  resetVirtualPortfolio,
  deletePositionFromPortfolio,
  PortfolioKPIs,
} from '../../services/virtual-portfolio/virtualPortfolioService';
import { formatFCFA, formatPercent, formatDateFrench } from '../../lib/formatters';
import { exportVirtualPortfolioToCSV, exportVirtualPortfolioToPDF } from '../../lib/export';
import { D3PortfolioBalanceChart } from './D3PortfolioBalanceChart';
import { DailyMarketSessionBadge } from '../finance/DailyMarketSessionBadge';
import { useMarketData } from '../../features/market/MarketContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface VirtualPortfolioManagerProps {
  onNavigate?: (path: string) => void;
}

export const VirtualPortfolioManager: React.FC<VirtualPortfolioManagerProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || 'guest';

  const [portfolio, setPortfolio] = useState<VirtualPortfolio>(() =>
    loadVirtualPortfolio(userId) as unknown as VirtualPortfolio
  );
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'ANALYTICS' | 'TRANSACTIONS'>('POSITIONS');
  const [showD3ChartOverview, setShowD3ChartOverview] = useState(true);

  // Modals state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<VirtualPositionCalculated | null>(null);
  const [selectedPositionForSell, setSelectedPositionForSell] = useState<VirtualPositionCalculated | null>(null);

  // Buy form state
  const [selectedBuySymbol, setSelectedBuySymbol] = useState<string>('SNTS');
  const [buyShares, setBuyShares] = useState<number>(50);
  const [customBuyPrice, setCustomBuyPrice] = useState<number | null>(null);
  const [buyStockSearch, setBuyStockSearch] = useState<string>('');
  const [buyNotes, setBuyNotes] = useState<string>('');
  const [buyErrorMessage, setBuyErrorMessage] = useState<string | null>(null);

  // Sell form state
  const [sellShares, setSellShares] = useState<number>(1);
  const [sellErrorMessage, setSellErrorMessage] = useState<string | null>(null);

  // Reset form state
  const [resetCapitalPreset, setResetCapitalPreset] = useState<number>(10000000);
  const [customResetCapital, setCustomResetCapital] = useState<string>('10000000');
  const [resetPortfolioName, setResetPortfolioName] = useState<string>('Mon Portefeuille Virtuel BRVM');

  // Notification toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);

  // Load portfolio on mount or when user changes
  useEffect(() => {
    let mounted = true;
    loadVirtualPortfolio(userId).then(p => {
      if (mounted && p) {
        setPortfolio(p);
      }
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Save changes
  const updateAndSavePortfolio = (newPortfolio: VirtualPortfolio) => {
    setPortfolio(newPortfolio);
    saveVirtualPortfolio(newPortfolio);
  };

  const showToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const { companies, marketSession, isRefreshing, refreshMarketData } = useMarketData();

  // KPI & positions calculation with live daily updated quotes
  const { calculatedPositions, kpis } = useMemo(() => {
    return calculatePortfolioKPIs(portfolio, companies);
  }, [portfolio, companies]);

  // Selected company for buy order with live daily price
  const selectedBuyCompany = useMemo(() => {
    return companies.find(c => c.symbol.toUpperCase() === selectedBuySymbol.toUpperCase()) || companies[0] || DEMO_COMPANIES[0];
  }, [selectedBuySymbol, companies]);

  // Filtered companies for buy modal with live daily prices
  const filteredBuyCompanies = useMemo(() => {
    if (!buyStockSearch.trim()) return companies;
    const term = buyStockSearch.toLowerCase();
    return companies.filter(
      c => c.symbol.toLowerCase().includes(term) || c.name.toLowerCase().includes(term) || c.sector.toLowerCase().includes(term)
    );
  }, [buyStockSearch, companies]);

  // Effective purchase price entered by user or defaulting to current market price
  const effectiveBuyPrice = useMemo(() => {
    if (customBuyPrice !== null && customBuyPrice > 0) {
      return customBuyPrice;
    }
    return selectedBuyCompany ? selectedBuyCompany.currentPrice : 0;
  }, [customBuyPrice, selectedBuyCompany]);

  // Calculation for buy modal
  const buyGross = buyShares * effectiveBuyPrice;
  const buyFee = Math.max(100, Math.round(buyGross * 0.006));
  const buyNet = buyGross + buyFee;
  const canAffordBuy = buyNet <= portfolio.currentCash && buyShares > 0 && effectiveBuyPrice > 0;

  // Calculation for sell modal
  const sellPrice = selectedPositionForSell ? selectedPositionForSell.currentPrice : 0;
  const sellGross = (selectedPositionForSell ? sellShares : 0) * sellPrice;
  const sellFee = Math.max(100, Math.round(sellGross * 0.006));
  const sellNet = sellGross - sellFee;
  const sellCostBasis = (selectedPositionForSell ? sellShares : 0) * (selectedPositionForSell ? selectedPositionForSell.averageBuyPrice : 0);
  const sellRealizedPL = sellNet - sellCostBasis;
  const sellRealizedPLPercent = sellCostBasis > 0 ? (sellRealizedPL / sellCostBasis) * 100 : 0;

  // Open buy modal prefilled with a given stock
  const openBuyModalWithStock = (symbol?: string) => {
    const sym = symbol || selectedBuySymbol;
    setSelectedBuySymbol(sym);
    const targetComp = companies.find(c => c.symbol.toUpperCase() === sym.toUpperCase());
    if (targetComp) {
      setCustomBuyPrice(targetComp.currentPrice);
    }
    setBuyErrorMessage(null);
    setIsBuyModalOpen(true);
  };

  // Handle Buy execution
  const handleExecuteBuy = (e: React.FormEvent) => {
    e.preventDefault();
    setBuyErrorMessage(null);

    try {
      if (!selectedBuyCompany) throw new Error('Veuillez sélectionner une action.');
      if (buyShares <= 0) throw new Error('Veuillez indiquer un nombre d\'actions valide.');
      if (effectiveBuyPrice <= 0) throw new Error('Veuillez indiquer un cours à l\'achat valide.');

      const updated = executeBuyOrder(portfolio, selectedBuyCompany, buyShares, effectiveBuyPrice, buyNotes);
      updateAndSavePortfolio(updated);
      setIsBuyModalOpen(false);
      setBuyNotes('');
      setCustomBuyPrice(null);
      showToast(
        'Action ajoutée au portefeuille !',
        `Ajout de ${buyShares} action(s) ${selectedBuyCompany.symbol} au cours d'achat de ${formatFCFA(effectiveBuyPrice)} (Total net débité : ${formatFCFA(buyNet)} avec courtage).`
      );
    } catch (err: any) {
      setBuyErrorMessage(err.message || 'Erreur lors de l\'exécution de l\'ordre.');
    }
  };

  // Handle position deletion
  const handleConfirmDeletePosition = () => {
    if (!positionToDelete) return;
    try {
      const updated = deletePositionFromPortfolio(portfolio, positionToDelete.symbol);
      updateAndSavePortfolio(updated);
      showToast(
        'Position supprimée du portefeuille',
        `La ligne ${positionToDelete.symbol} (${positionToDelete.companyName}) a été retirée et le montant investi (${formatFCFA(positionToDelete.totalInvested)}) a été réintégré à vos liquidités.`
      );
      setPositionToDelete(null);
    } catch (err: any) {
      showToast('Erreur', err.message || 'Impossible de supprimer cette position.', 'error');
    }
  };

  // Handle Sell execution
  const handleExecuteSell = (e: React.FormEvent) => {
    e.preventDefault();
    setSellErrorMessage(null);

    try {
      if (!selectedPositionForSell) throw new Error('Aucune position sélectionnée.');
      if (sellShares <= 0 || sellShares > selectedPositionForSell.shares) {
        throw new Error('Quantité de vente invalide.');
      }

      const updated = executeSellOrder(portfolio, selectedPositionForSell.symbol, sellShares);
      updateAndSavePortfolio(updated);
      setIsSellModalOpen(false);
      showToast(
        'Ordre de vente exécuté !',
        `Vente de ${sellShares} action(s) ${selectedPositionForSell.symbol}. +${formatFCFA(sellNet)} crédités sur vos liquidités (Plus-value nette : ${sellRealizedPL >= 0 ? '+' : ''}${formatFCFA(sellRealizedPL)}).`
      );
    } catch (err: any) {
      setSellErrorMessage(err.message || 'Erreur lors de la vente.');
    }
  };

  // Handle Reset execution
  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customResetCapital, 10);
    if (isNaN(amount) || amount < 100000) {
      alert('Veuillez entrer un montant simulé d\'au moins 100 000 FCFA.');
      return;
    }

    const updated = resetVirtualPortfolio(portfolio, amount, resetPortfolioName.trim() || undefined);
    updateAndSavePortfolio(updated);
    setIsResetModalOpen(false);
    showToast(
      'Portefeuille réinitialisé !',
      `Votre capital de départ simulé a été calibré à ${formatFCFA(amount)} avec 0 position active.`
    );
  };

  // Paco Strategic Analysis
  const pacoAdvice = useMemo(() => {
    if (calculatedPositions.length === 0) {
      return {
        badge: 'Premier pas',
        text: `Vous disposez de ${formatFCFA(portfolio.currentCash)} de liquidités intactes. C\'est le moment idéal pour lancer votre premier achat virtuel sur des valeurs emblématiques de la BRVM comme Sonatel (SNTS), Orange CI (ORAC) ou Ecobank (ETIT).`,
      };
    }

    if (kpis.cashWeightPercent > 60) {
      return {
        badge: 'Liquidités Élevées',
        text: `Votre portefeuille est composé à ${kpis.cashWeightPercent}% de liquidités (${formatFCFA(portfolio.currentCash)}). Vous avez une marge de manœuvre confortable pour entrer progressivement par achats fractionnés (DCA) sur les valeurs bancaires ou agroalimentaires.`,
      };
    }

    if (calculatedPositions.length > 0 && calculatedPositions[0].weightPercent > 45) {
      return {
        badge: 'Concentration à Surveiller',
        text: `L\'action ${calculatedPositions[0].symbol} représente ${calculatedPositions[0].weightPercent}% de vos actifs totaux. Pour réduire votre risque spécifique, envisagez de rééquilibrer vos liquidités en diversifiant sur d\'autres secteurs (ex: banques, distribution).`,
      };
    }

    return {
      badge: 'Portefeuille Équilibré',
      text: `Belle diversification ! Vous détenez ${kpis.positionsCount} lignes réparties sur ${kpis.sectorAllocation.length} secteur(s). Vous conservez ${kpis.cashWeightPercent}% de volant de trésorerie pour saisir des replis de marché.`,
    };
  }, [calculatedPositions, kpis, portfolio.currentCash]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-start gap-3 max-w-md animate-bounce-short ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-white border-emerald-500'
              : 'bg-rose-950 text-white border-rose-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h5 className="font-extrabold text-sm">{toastMessage.title}</h5>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      {/* Header Banner - Vert Foncé / Émeraude Premium */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white border-b border-emerald-800/80 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
              {portfolio.name}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl font-normal leading-relaxed">
              Sélectionnez des titres et actions de la BRVM à ajouter dans votre portefeuille pour suivre leur évolution, leur rentabilité et leur performance en temps réel.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <DailyMarketSessionBadge variant="compact" />

            <button
              onClick={() => openBuyModalWithStock()}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajouter des actions</span>
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2.5 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Calibrer le solde de départ ou réinitialiser"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Capital</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => exportVirtualPortfolioToCSV(portfolio, calculatedPositions, kpis)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs transition-colors cursor-pointer"
                title="Exporter les positions en CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => exportVirtualPortfolioToPDF(portfolio, calculatedPositions, kpis)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs transition-colors cursor-pointer"
                title="Télécharger le rapport PDF officiel"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* KPI Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Portfolio Value */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border border-slate-700/70 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold uppercase tracking-wider">
              <span>Valeur Totale</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
              {formatFCFA(kpis.totalValue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  kpis.totalGainLoss >= 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {kpis.totalGainLoss >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {kpis.totalGainLoss >= 0 ? '+' : ''}
                  {formatFCFA(kpis.totalGainLoss)} ({kpis.totalGainLossPercent}%)
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">vs capital</span>
            </div>
          </div>

          {/* Card 2: Available Cash */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <span>Liquidités Disponibles</span>
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              {formatFCFA(kpis.currentCash)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Part en cash : <strong>{kpis.cashWeightPercent}%</strong></span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Prêt à investir</span>
            </div>
          </div>

          {/* Card 3: Invested in Stocks */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <span>Investi en Actions</span>
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              {formatFCFA(kpis.totalInvested)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{kpis.positionsCount} ligne{kpis.positionsCount > 1 ? 's' : ''} active{kpis.positionsCount > 1 ? 's' : ''}</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                {kpis.stocksWeightPercent}% du portefeuille
              </span>
            </div>
          </div>

          {/* Card 4: Plus/Moins-Value Latente */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <span>Plus-Value Latente</span>
              <Percent className="w-4 h-4 text-amber-500" />
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-['Outfit'] ${
                kpis.unrealizedGainLoss >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {kpis.unrealizedGainLoss >= 0 ? '+' : ''}
              {formatFCFA(kpis.unrealizedGainLoss)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Rdt actions : <strong className={kpis.unrealizedGainLossPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{kpis.unrealizedGainLossPercent}%</strong></span>
              <span className="text-[11px] text-slate-400">Séance : {kpis.dailyGainLoss >= 0 ? '+' : ''}{formatFCFA(kpis.dailyGainLoss)}</span>
            </div>
          </div>
        </div>

        {/* Paco's Strategic Advisor Note */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-900 dark:text-emerald-300">
                Paco • Analyse Stratégique du Portefeuille
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 text-[10px] font-black uppercase">
                {pacoAdvice.badge}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {pacoAdvice.text}
            </p>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('POSITIONS')}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'POSITIONS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Positions Actives ({calculatedPositions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Courbe D3 & Analyses</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Journal des Ordres ({portfolio.transactions.length})</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/calendrier-dividendes')}
              className="ml-auto px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendrier Dividendes</span>
            </button>
          )}
        </div>

        {/* TAB 1: POSITIONS TABLE - 3 SECTIONS EDUCATIVES & PEDAGOGIQUES */}
        {activeTab === 'POSITIONS' && (
          <div className="space-y-8">
            {/* D3 Portfolio Balance Progression Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Progression du solde en temps réel (D3.js)
                </span>
                <button
                  onClick={() => setShowD3ChartOverview(!showD3ChartOverview)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {showD3ChartOverview ? 'Masquer le graphique D3' : 'Afficher la courbe D3'}
                </button>
              </div>

              {showD3ChartOverview && (
                <D3PortfolioBalanceChart
                  initialCash={portfolio.initialCash}
                  currentCash={portfolio.currentCash}
                  currentTotalValue={kpis.totalValue}
                  totalInvested={kpis.totalInvested}
                  createdAt={portfolio.createdAt}
                  transactionsCount={portfolio.transactions.length}
                />
              )}
            </div>

            {calculatedPositions.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Wallet className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Aucune action dans votre portefeuille pour l'instant
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Vous disposez de {formatFCFA(portfolio.currentCash)} de liquidités disponibles pour sélectionner des actions de la BRVM.
                  </p>
                </div>
                <button
                  onClick={() => openBuyModalWithStock()}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Sélectionner et ajouter une action</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* ========================================================================= */}
                {/* SECTION 1: NOM, SYMBOLE SOULIGNÉ, NOMBRE PRIS, COURS ACHAT, COURS ACTUEL, INVESTI, PLUS-VALUE */}
                {/* ========================================================================= */}
                <section className="space-y-3 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
                        <Building2 className="w-3 h-3" />
                        SECTION 1 • VUE DÉTAILLÉE DES ACTIONS & COURS DU MARCHÉ
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        Actions Détenues, Cours d'Achat & Cotations Officielles
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Visualisez chaque action avec son symbole officiel souligné de sa dénomination, la quantité prise, le cours à l'achat et la plus-value actuelle.
                      </p>
                    </div>

                    <button
                      onClick={() => openBuyModalWithStock()}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Ajouter une action</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Action & Dénomination</th>
                          <th className="py-3 px-3 text-right">Nombre Pris</th>
                          <th className="py-3 px-3 text-right">Cours à l'Achat</th>
                          <th className="py-3 px-3 text-right">Cours Actuel</th>
                          <th className="py-3 px-3 text-right">Montant Total Investi</th>
                          <th className="py-3 px-3 text-right">Plus-Value (Gain / Perte)</th>
                          <th className="py-3 px-4 text-center">Gérer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {calculatedPositions.map(pos => {
                          const isGain = pos.unrealizedGainLoss >= 0;
                          return (
                            <tr
                              key={pos.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              {/* Nom de l'action et son symbole (symbole souligné de sa dénomination) */}
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-sm text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2 underline-offset-4 tracking-wide">
                                      {pos.symbol}
                                    </span>
                                    {onNavigate && (
                                      <button
                                        onClick={() => onNavigate(`/company/${pos.symbol}`)}
                                        className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                        title="Voir la fiche officielle"
                                      >
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate max-w-[200px]">
                                    {pos.companyName}
                                  </div>
                                  <span className="inline-block text-[10px] text-slate-400 dark:text-slate-500">
                                    {pos.sector}
                                  </span>
                                </div>
                              </td>

                              {/* Nombre d'actions prises */}
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {pos.shares.toLocaleString('fr-FR')} <span className="text-[10px] text-slate-400 font-normal">titres</span>
                              </td>

                              {/* Cours à l'achat (prix de l'action au moment où l'action a été achetée) */}
                              <td className="py-3 px-3 text-right">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                                  {formatFCFA(pos.averageBuyPrice)}
                                </span>
                                <span className="text-[10px] text-slate-400">Prix acquisition</span>
                              </td>

                              {/* Cours actuel (prix actuel du marché de l'action) */}
                              <td className="py-3 px-3 text-right">
                                <span className="font-mono font-black text-slate-900 dark:text-white block">
                                  {formatFCFA(pos.currentPrice)}
                                </span>
                                <span
                                  className={`text-[10px] font-bold inline-flex items-center gap-0.5 ${
                                    pos.dayChangePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {pos.dayChangePercent >= 0 ? '+' : ''}
                                  {pos.dayChangePercent}%
                                </span>
                              </td>

                              {/* Montant total investi sur l'action */}
                              <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                                {formatFCFA(pos.totalInvested)}
                              </td>

                              {/* Plus value (positive ou négative) */}
                              <td className="py-3 px-3 text-right">
                                <span
                                  className={`font-mono font-black text-sm block ${
                                    isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isGain ? '+' : ''}
                                  {formatFCFA(pos.unrealizedGainLoss)}
                                </span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isGain ? '+' : ''}
                                  {pos.unrealizedGainLossPercent}%
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openBuyModalWithStock(pos.symbol)}
                                    className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] transition-colors cursor-pointer"
                                    title="Acheter plus d'actions"
                                  >
                                    + Acheter
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPositionForSell(pos);
                                      setSellShares(pos.shares);
                                      setSellErrorMessage(null);
                                      setIsSellModalOpen(true);
                                    }}
                                    className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-[11px] transition-colors cursor-pointer"
                                    title="Vendre cette position"
                                  >
                                    Vendre
                                  </button>
                                  <button
                                    onClick={() => setPositionToDelete(pos)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                                    title="Supprimer cette action du portefeuille"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 2: COURS MOYEN DES ACTIONS & FORMULE PEDAGOGIQUE */}
                {/* ========================================================================= */}
                <section className="space-y-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 p-5 shadow-xs">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">
                      <Calculator className="w-3 h-3" />
                      SECTION 2 • COURS MOYEN DES ACTIONS & PÉDAGOGIE FINANCIÈRE
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Calcul et Décomposition du Cours Moyen des Actions
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Découvrez comment est calculé le cours moyen (PRU) de chaque titre présent dans votre portefeuille pour apprendre à évaluer vos points d'entrée.
                    </p>
                  </div>

                  {/* IMPORTANT : FORMULE DU COURS MOYEN MISE EN EVIDENCE */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-700 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                        IMPORTANT • FORMULE DE CALCUL
                      </span>
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Comment calculer le cours moyen d'une action ?
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-700/80 shadow-xs">
                      <div className="text-center font-mono font-black text-sm sm:text-base text-indigo-950 dark:text-indigo-200">
                        <span className="text-indigo-600 dark:text-indigo-400">Cours moyen des actions</span> = <span className="underline decoration-indigo-400">Cours à l'achat des actions</span> / (divisé par) <span className="underline decoration-indigo-400">le nombre d'actions prises ou ajoutées au portefeuille</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/60 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <p>
                        <strong>Apprenez à vous en servir :</strong> Le cours moyen (aussi appelé Prix de Revient Unitaire - PRU) représente le montant réel payé par action. Si vous réalisez plusieurs achats à des prix différents sur un même titre, divisez le montant total déboursé à l'achat par le nombre total de titres obtenus. Ce cours moyen correspond à votre seuil d'équilibre : au-dessus de ce prix, toute hausse du marché génère un profit !
                      </p>
                    </div>
                  </div>

                  {/* Tableau des cours moyens calculés */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-indigo-100 dark:border-indigo-900/50">
                        <tr>
                          <th className="py-3 px-4">Action & Dénomination</th>
                          <th className="py-3 px-3 text-right">Quantité d'actions prises</th>
                          <th className="py-3 px-3 text-right">Cours à l'achat des actions (Total)</th>
                          <th className="py-3 px-4 text-center">Application de la Formule</th>
                          <th className="py-3 px-4 text-right">Cours Moyen Résultant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {calculatedPositions.map(pos => (
                          <tr key={`cm-${pos.id}`} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                            {/* Nom et symbole souligné de sa dénomination */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="font-black text-sm text-slate-900 dark:text-white underline decoration-indigo-500 decoration-2 underline-offset-4 tracking-wide block">
                                  {pos.symbol}
                                </span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate max-w-[200px]">
                                  {pos.companyName}
                                </span>
                              </div>
                            </td>

                            {/* Quantité d'actions prises */}
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              {pos.shares.toLocaleString('fr-FR')} actions
                            </td>

                            {/* Cours à l'achat des actions (montant total investi) */}
                            <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {formatFCFA(pos.totalInvested)}
                            </td>

                            {/* Démonstration de la formule */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-block px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono text-indigo-900 dark:text-indigo-200">
                                {formatFCFA(pos.totalInvested)} ÷ {pos.shares} actions
                              </div>
                            </td>

                            {/* Cours moyen */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono font-black text-sm text-indigo-700 dark:text-indigo-300">
                                {formatFCFA(pos.averageBuyPrice)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">par action</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* ========================================================================= */}
                {/* SECTION 3: PLUS-VALUE TOTALE ACTUELLE & QUANTITE D'ACTIONS PRISES */}
                {/* ========================================================================= */}
                <section className="space-y-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 p-5 shadow-xs">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                      <TrendingUp className="w-3 h-3" />
                      SECTION 3 • PLUS-VALUE TOTALE ACTUELLE & RENTABILITÉ
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Plus-Value Totale Actuelle des Actions et Performance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Suivez en direct la plus-value totale dégagée sur vos actions en comparant le cours actuel du marché avec votre cours moyen d'achat.
                    </p>
                  </div>

                  {/* IMPORTANT : FORMULE DE LA PLUS-VALUE TOTALE MISE EN EVIDENCE */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-700 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        IMPORTANT • FORMULE DE CALCUL
                      </span>
                      <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Comment calculer la plus-value totale des actions ?
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-amber-200 dark:border-amber-700/80 shadow-xs space-y-2">
                      <div className="text-center font-mono font-black text-sm sm:text-base text-amber-950 dark:text-amber-200">
                        <span className="text-amber-700 dark:text-amber-400">Plus value actuelle</span> = <span className="underline decoration-amber-400">cours actuel des actions (cours actuel sur le marché)</span> - (moins) <span className="underline decoration-amber-400">cours moyen des actions</span>
                      </div>
                      <div className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                        <strong>Plus-value totale du portefeuille</strong> = Plus-value actuelle unitaire × Quantité d'actions prises
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p>
                        <strong>Apprenez à vous en servir :</strong> La plus-value mesure votre enrichissement potentiel. Lorsque le cours actuel sur le marché de la BRVM dépasse votre cours moyen, vous dégagez une plus-value positive (gain de capital). Si le cours de marché passe en-dessous, vous êtes en moins-value latente temporaire. En bourse, tant que l'action n'est pas vendue, le gain ou la perte reste non matérialisé.
                      </p>
                    </div>
                  </div>

                  {/* Tableau des plus-values totales */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-50/70 dark:bg-amber-950/40 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-amber-100 dark:border-amber-900/50">
                        <tr>
                          <th className="py-3 px-4">Action & Dénomination</th>
                          <th className="py-3 px-3 text-right">Quantité d'actions prises</th>
                          <th className="py-3 px-3 text-right">Cours Moyen</th>
                          <th className="py-3 px-3 text-right">Cours Actuel Marché</th>
                          <th className="py-3 px-3 text-right">Écart Unitaire</th>
                          <th className="py-3 px-4 text-right">Plus-Value Totale Actuelle</th>
                          <th className="py-3 px-4 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {calculatedPositions.map(pos => {
                          const unitGain = pos.currentPrice - pos.averageBuyPrice;
                          const isGain = unitGain >= 0;
                          return (
                            <tr key={`pv-${pos.id}`} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40">
                              {/* Nom et symbole souligné de sa dénomination */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <span className="font-black text-sm text-slate-900 dark:text-white underline decoration-amber-500 decoration-2 underline-offset-4 tracking-wide block">
                                    {pos.symbol}
                                  </span>
                                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block truncate max-w-[200px]">
                                    {pos.companyName}
                                  </span>
                                </div>
                              </td>

                              {/* Quantité d'actions prises */}
                              <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                {pos.shares.toLocaleString('fr-FR')} actions
                              </td>

                              {/* Cours moyen */}
                              <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                                {formatFCFA(pos.averageBuyPrice)}
                              </td>

                              {/* Cours actuel sur le marché */}
                              <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {formatFCFA(pos.currentPrice)}
                              </td>

                              {/* Écart unitaire (Cours actuel - Cours moyen) */}
                              <td className="py-3.5 px-3 text-right font-mono font-bold">
                                <span className={isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                  {isGain ? '+' : ''}{formatFCFA(unitGain)}
                                </span>
                              </td>

                              {/* Plus-value totale de la position */}
                              <td className="py-3.5 px-4 text-right font-mono">
                                <span
                                  className={`text-base font-black block ${
                                    isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isGain ? '+' : ''}
                                  {formatFCFA(pos.unrealizedGainLoss)}
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isGain ? '+' : ''}
                                  {pos.unrealizedGainLossPercent}%
                                </span>
                              </td>

                              {/* Statut */}
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                    isGain
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {isGain ? 'Gain Réalisable' : 'Moins-Value'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Synthèse globale consolidée */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div>Total des titres : <strong>{calculatedPositions.reduce((acc, p) => acc + p.shares, 0).toLocaleString('fr-FR')} actions</strong></div>
                      <div>Montant global investi à l'achat : <strong>{formatFCFA(kpis.totalInvested)}</strong></div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Plus-Value Totale Portefeuille</span>
                        <span
                          className={`text-xl font-black font-mono ${
                            kpis.unrealizedGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {kpis.unrealizedGainLoss >= 0 ? '+' : ''}
                          {formatFCFA(kpis.unrealizedGainLoss)}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono ${
                          kpis.unrealizedGainLoss >= 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {kpis.unrealizedGainLoss >= 0 ? '+' : ''}{kpis.unrealizedGainLossPercent}%
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALYTICS & CHARTS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            {/* Interactive D3 Balance Progression Chart */}
            <D3PortfolioBalanceChart
              initialCash={portfolio.initialCash}
              currentCash={portfolio.currentCash}
              currentTotalValue={kpis.totalValue}
              totalInvested={kpis.totalInvested}
              createdAt={portfolio.createdAt}
              transactionsCount={portfolio.transactions.length}
            />

            {/* Asset Allocation Breakdown: Sectors and Cash */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sector breakdown pie */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Répartition Sectorielle des Actions
                  </h4>
                  <span className="text-xs text-slate-500 font-bold">
                    {kpis.sectorAllocation.length} secteur(s)
                  </span>
                </div>

                {kpis.sectorAllocation.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-8 text-center">
                    Aucune action en portefeuille pour l'instant.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kpis.sectorAllocation}
                            dataKey="value"
                            nameKey="sector"
                            cx="50%"
                            cy="50%"
                            outerRadius={65}
                            innerRadius={35}
                            paddingAngle={3}
                          >
                            {kpis.sectorAllocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, '']}
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {kpis.sectorAllocation.map(s => (
                        <div key={s.sector} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                              {s.sector}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {s.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cash vs Stocks Allocation Bar */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Équilibre Liquidités vs Actions
                  </h4>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${kpis.stocksWeightPercent}%` }}
                      className="bg-indigo-600 h-full transition-all"
                      title={`Actions : ${kpis.stocksWeightPercent}%`}
                    />
                    <div
                      style={{ width: `${kpis.cashWeightPercent}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Liquidités : ${kpis.cashWeightPercent}%`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <span>Actions Détenues</span>
                      </div>
                      <div className="font-black text-base text-slate-900 dark:text-white font-mono">
                        {kpis.stocksWeightPercent}%
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatFCFA(kpis.totalInvested)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Trésorerie / Cash</span>
                      </div>
                      <div className="font-black text-base text-slate-900 dark:text-white font-mono">
                        {kpis.cashWeightPercent}%
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatFCFA(kpis.currentCash)}
                      </p>
                    </div>
                  </div>

                  {kpis.bestPerformer && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs flex items-center justify-between">
                      <span className="text-emerald-900 dark:text-emerald-300 font-medium">
                        Meilleure performance : <strong>{kpis.bestPerformer.symbol}</strong>
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        +{kpis.bestPerformer.gainPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTIONS HISTORY */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-4">
            {portfolio.transactions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                Aucun ordre passé pour l'instant.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Action</th>
                      <th className="py-3 px-3 text-right">Quantité</th>
                      <th className="py-3 px-3 text-right">Prix Unitaire</th>
                      <th className="py-3 px-3 text-right">Frais Courtage</th>
                      <th className="py-3 px-3 text-right">Montant Net</th>
                      <th className="py-3 px-4 text-right">Plus-Value Réalisée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {portfolio.transactions.map(tx => {
                      const isBuy = tx.type === 'BUY';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            {formatDateFrench(tx.timestamp)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                                isBuy
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {isBuy ? 'Achat' : 'Vente'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                            {tx.symbol} <span className="font-normal text-slate-500 text-[11px]">({tx.companyName})</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200">
                            {tx.shares.toLocaleString('fr-FR')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatFCFA(tx.pricePerShare)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                            {formatFCFA(tx.fee)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            {formatFCFA(tx.netAmount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tx.realizedGainLoss !== undefined ? (
                              <span
                                className={`font-mono font-black ${
                                  tx.realizedGainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {tx.realizedGainLoss >= 0 ? '+' : ''}
                                {formatFCFA(tx.realizedGainLoss)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BUY ORDER MODAL */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 1: BUY ORDER MODAL - 4 ETAPES DE SELECTION & AJOUT D'ACTIONS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        title="Ajouter des Actions au Portefeuille BRVM"
      >
        <form onSubmit={handleExecuteBuy} className="space-y-4 text-xs">
          {buyErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{buyErrorMessage}</span>
            </div>
          )}

          {/* Available Cash banner */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span className="text-emerald-900 dark:text-emerald-200 font-bold">
              Liquidités disponibles pour investissement :
            </span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
              {formatFCFA(portfolio.currentCash)}
            </span>
          </div>

          {/* Étape 1 : Sélectionner l'action dans la liste des actions de la BRVM */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                1. Sélectionner l'action dans la liste des actions de la BRVM *
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                Sélectionnée : {selectedBuyCompany.symbol}
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par symbole ou dénomination (ex: Sonatel, ORAC, SIVC)..."
                value={buyStockSearch}
                onChange={e => setBuyStockSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Liste des actions : symbole affiché et souligné de sa dénomination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredBuyCompanies.slice(0, 18).map(comp => {
                const isSelected = selectedBuySymbol.toUpperCase() === comp.symbol.toUpperCase();
                return (
                  <button
                    key={comp.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedBuySymbol(comp.symbol);
                      setCustomBuyPrice(comp.currentPrice);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 ring-2 ring-emerald-500/50'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Symbole de l'action affiché et souligné de sa dénomination */}
                    <div className="font-black text-sm text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2 underline-offset-4 tracking-wide">
                      {comp.symbol}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-1">
                      {comp.name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-500 dark:text-slate-400">
                      <span className="truncate max-w-[120px]">{comp.sector}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatFCFA(comp.currentPrice)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Étape 2 : Définir le nombre d'actions */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                2. Définir le nombre d'actions à prendre *
              </label>
              <span className="text-slate-500 text-[11px]">
                Quantité souhaitée
              </span>
            </div>

            <input
              type="number"
              min={1}
              required
              value={buyShares}
              onChange={e => setBuyShares(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full p-2.5 text-base font-mono font-black text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
            />

            {/* Quick percent buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              {[
                { label: '10%', frac: 0.1 },
                { label: '25%', frac: 0.25 },
                { label: '50%', frac: 0.5 },
                { label: 'Max (100%)', frac: 0.99 },
              ].map(btn => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    const budget = portfolio.currentCash * btn.frac;
                    const price = effectiveBuyPrice > 0 ? effectiveBuyPrice : selectedBuyCompany.currentPrice;
                    const possibleShares = Math.max(1, Math.floor(budget / (price * 1.006)));
                    setBuyShares(possibleShares);
                  }}
                  className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Étape 3 : Indiquer le cours à l'achat */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                3. Indiquer le cours à l'achat (prix au moment de l'achat en FCFA) *
              </label>
              <button
                type="button"
                onClick={() => setCustomBuyPrice(selectedBuyCompany.currentPrice)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
              >
                Cours du jour ({formatFCFA(selectedBuyCompany.currentPrice)})
              </button>
            </div>

            <input
              type="number"
              min={1}
              required
              value={effectiveBuyPrice}
              onChange={e => setCustomBuyPrice(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full p-2.5 text-base font-mono font-black text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Prix unitaire de l'action au moment où l'action a été achetée. Pré-rempli avec le cours actuel officiel du marché BRVM ({formatFCFA(selectedBuyCompany.currentPrice)}), modifiable selon votre cours d'acquisition effectif.
            </p>
          </div>

          {/* Étape 4 : Récapitulatif du coût & Validation */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Montant des titres ({buyShares} × {formatFCFA(effectiveBuyPrice)}) :</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatFCFA(buyGross)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Frais de courtage SGI estimés (0.6%) :</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{formatFCFA(buyFee)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700 text-sm">
              <span>Total débité de votre trésorerie :</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatFCFA(buyNet)}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button
              type="submit"
              disabled={!canAffordBuy}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold"
            >
              Valider l'ajout d'actions ({formatFCFA(buyNet)})
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBuyModalOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL CONFIRMATION SUPPRESSION ACTION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={positionToDelete !== null}
        onClose={() => setPositionToDelete(null)}
        title="Supprimer une Action du Portefeuille"
      >
        {positionToDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm">
                  Confirmer la suppression de {positionToDelete.symbol} ?
                </p>
                <p className="leading-relaxed">
                  Vous vous apprêtez à supprimer la ligne <strong>{positionToDelete.companyName}</strong> ({positionToDelete.shares} actions).
                  Le capital investi initialement de <strong>{formatFCFA(positionToDelete.totalInvested)}</strong> sera réintégré dans vos liquidités disponibles.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                type="button"
                onClick={handleConfirmDeletePosition}
                className="flex-1 bg-rose-600 hover:bg-rose-500 font-bold text-white"
              >
                Confirmer la suppression
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPositionToDelete(null)}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: SELL ORDER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        title={`Vendre des Actions ${selectedPositionForSell?.symbol || ''}`}
      >
        {selectedPositionForSell && (
          <form onSubmit={handleExecuteSell} className="space-y-4 text-xs">
            {sellErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sellErrorMessage}</span>
              </div>
            )}

            {/* Position summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Titres détenus :</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedPositionForSell.shares} actions ({selectedPositionForSell.companyName})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prix de revient unitaire (PRU) :</span>
                <span className="font-mono">{formatFCFA(selectedPositionForSell.averageBuyPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cours actuel BRVM :</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatFCFA(selectedPositionForSell.currentPrice)}
                </span>
              </div>
            </div>

            {/* Shares to sell input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Quantité à céder (Max : {selectedPositionForSell.shares})
              </label>
              <input
                type="number"
                min={1}
                max={selectedPositionForSell.shares}
                required
                value={sellShares}
                onChange={e =>
                  setSellShares(
                    Math.min(
                      selectedPositionForSell.shares,
                      Math.max(1, parseInt(e.target.value, 10) || 1)
                    )
                  )
                }
                className="w-full p-2.5 text-base font-mono font-black text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-rose-500"
              />

              {/* Quick buttons */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { label: '25%', frac: 0.25 },
                  { label: '50%', frac: 0.5 },
                  { label: '75%', frac: 0.75 },
                  { label: '100% (Tout vendre)', frac: 1.0 },
                ].map(btn => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => setSellShares(Math.max(1, Math.round(selectedPositionForSell.shares * btn.frac)))}
                    className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proceeds breakdown */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Montant brut de la vente :</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatFCFA(sellGross)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Frais de courtage estimés (0.6%) :</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">-{formatFCFA(sellFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Plus-value / Moins-value nette réalisée :</span>
                <span
                  className={`font-mono font-bold ${
                    sellRealizedPL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {sellRealizedPL >= 0 ? '+' : ''}
                  {formatFCFA(sellRealizedPL)} ({sellRealizedPLPercent >= 0 ? '+' : ''}{sellRealizedPLPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700 text-sm">
                <span>Crédité sur vos liquidités :</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">+{formatFCFA(sellNet)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-500 font-bold">
                Confirmer la vente (+{formatFCFA(sellNet)})
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsSellModalOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: RESET / CAPITAL SETUP MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Paramètres du Capital Virtuel & Réinitialisation"
      >
        <form onSubmit={handleExecuteReset} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Choisir un nouveau capital de départ réinitialisera vos positions actives pour vous permettre de tester une nouvelle stratégie d'investissement.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nom du portefeuille virtuel
            </label>
            <input
              type="text"
              required
              value={resetPortfolioName}
              onChange={e => setResetPortfolioName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Montants de départ calibrés (FCFA)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Petit Épargnant', amount: 1000000 },
                { label: 'Profil Équilibré', amount: 5000000 },
                { label: 'Standard Conseillé', amount: 10000000 },
                { label: 'Grand Compte', amount: 25000000 },
              ].map(preset => (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => {
                    setResetCapitalPreset(preset.amount);
                    setCustomResetCapital(preset.amount.toString());
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    parseInt(customResetCapital, 10) === preset.amount
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/40 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 block">{preset.label}</span>
                  <span className="font-black font-mono text-sm text-slate-900 dark:text-white">
                    {formatFCFA(preset.amount)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Ou saisie d'un capital personnalisé (FCFA)
            </label>
            <input
              type="number"
              step={100000}
              min={100000}
              required
              value={customResetCapital}
              onChange={e => setCustomResetCapital(e.target.value)}
              className="w-full p-2.5 font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold">
              Valider et réinitialiser
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsResetModalOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
