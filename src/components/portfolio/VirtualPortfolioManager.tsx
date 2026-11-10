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
  const [selectedPositionForSell, setSelectedPositionForSell] = useState<VirtualPositionCalculated | null>(null);

  // Buy form state
  const [selectedBuySymbol, setSelectedBuySymbol] = useState<string>('SNTS');
  const [buyShares, setBuyShares] = useState<number>(50);
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

  // Calculation for buy modal
  const buyGross = buyShares * (selectedBuyCompany ? selectedBuyCompany.currentPrice : 0);
  const buyFee = Math.max(100, Math.round(buyGross * 0.006));
  const buyNet = buyGross + buyFee;
  const canAffordBuy = buyNet <= portfolio.currentCash && buyShares > 0;

  // Calculation for sell modal
  const sellPrice = selectedPositionForSell ? selectedPositionForSell.currentPrice : 0;
  const sellGross = (selectedPositionForSell ? sellShares : 0) * sellPrice;
  const sellFee = Math.max(100, Math.round(sellGross * 0.006));
  const sellNet = sellGross - sellFee;
  const sellCostBasis = (selectedPositionForSell ? sellShares : 0) * (selectedPositionForSell ? selectedPositionForSell.averageBuyPrice : 0);
  const sellRealizedPL = sellNet - sellCostBasis;
  const sellRealizedPLPercent = sellCostBasis > 0 ? (sellRealizedPL / sellCostBasis) * 100 : 0;

  // Handle Buy execution
  const handleExecuteBuy = (e: React.FormEvent) => {
    e.preventDefault();
    setBuyErrorMessage(null);

    try {
      if (!selectedBuyCompany) throw new Error('Veuillez sélectionner une action.');
      if (buyShares <= 0) throw new Error('Veuillez indiquer un nombre d\'actions valide.');

      const updated = executeBuyOrder(portfolio, selectedBuyCompany, buyShares, undefined, buyNotes);
      updateAndSavePortfolio(updated);
      setIsBuyModalOpen(false);
      setBuyNotes('');
      showToast(
        'Ordre d\'achat exécuté !',
        `Achat de ${buyShares} action(s) ${selectedBuyCompany.symbol} pour un total de ${formatFCFA(buyNet)} (courtage inclus).`
      );
    } catch (err: any) {
      setBuyErrorMessage(err.message || 'Erreur lors de l\'exécution de l\'ordre.');
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
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider shadow-sm">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              PORTFOLIO VIRTUEL • PAPER TRADING BRVM
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
              {portfolio.name}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl font-normal leading-relaxed">
              Investissez avec un capital virtuel en conditions réelles de marché. Testez vos stratégies sans risquer votre argent avant d'ouvrir un compte SGI.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <DailyMarketSessionBadge variant="compact" />

            <button
              onClick={() => {
                setBuyErrorMessage(null);
                setIsBuyModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Acheter une action</span>
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

        {/* TAB 1: POSITIONS TABLE */}
        {activeTab === 'POSITIONS' && (
          <div className="space-y-6">
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
                    Aucune position fictive pour l'instant
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Vous disposez de {formatFCFA(portfolio.currentCash)} de liquidités disponibles pour constituer votre portefeuille BRVM.
                  </p>
                </div>
                <button
                  onClick={() => setIsBuyModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Passer mon premier ordre d'achat</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-3 text-right">Titres</th>
                      <th className="py-3.5 px-3 text-right">PRU</th>
                      <th className="py-3.5 px-3 text-right">Cours Actuel</th>
                      <th className="py-3.5 px-3 text-right">Valeur Totale</th>
                      <th className="py-3.5 px-3 text-right">Plus-Value Latente</th>
                      <th className="py-3.5 px-3 text-right">Poids</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {calculatedPositions.map(pos => {
                      const isGain = pos.unrealizedGainLoss >= 0;
                      return (
                        <tr
                          key={pos.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                                {pos.symbol.slice(0, 3)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{pos.symbol}</span>
                                  {onNavigate && (
                                    <button
                                      onClick={() => onNavigate(`/company/${pos.symbol}`)}
                                      className="text-slate-400 hover:text-emerald-600"
                                      title="Consulter la fiche société"
                                    >
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[150px]">
                                  {pos.companyName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200">
                            {pos.shares.toLocaleString('fr-FR')}
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatFCFA(pos.averageBuyPrice)}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <span className="font-mono font-bold text-slate-900 dark:text-white block">
                              {formatFCFA(pos.currentPrice)}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                pos.dayChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {pos.dayChangePercent >= 0 ? '+' : ''}
                              {pos.dayChangePercent}%
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatFCFA(pos.currentValue)}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`font-mono font-black block ${
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

                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                                {pos.weightPercent}%
                              </span>
                              <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, pos.weightPercent * 2)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedBuySymbol(pos.symbol);
                                  setIsBuyModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] transition-colors cursor-pointer"
                                title="Acheter plus d'actions"
                              >
                                + Acheter
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPositionForSell(pos);
                                  setSellShares(pos.shares); // Default: sell all
                                  setSellErrorMessage(null);
                                  setIsSellModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-800 dark:text-rose-300 font-bold text-[11px] transition-colors cursor-pointer"
                                title="Vendre cette position (partiellement ou totalement)"
                              >
                                Vendre
                              </button>
                            </div>
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
      <Modal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        title="Passer un Ordre d'Achat Fictif (BRVM)"
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
              Liquidités disponibles :
            </span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
              {formatFCFA(portfolio.currentCash)}
            </span>
          </div>

          {/* Select stock */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Sélectionnez une action de la BRVM *
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou symbole (ex: Sonatel, ORAC)..."
                value={buyStockSearch}
                onChange={e => setBuyStockSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredBuyCompanies.slice(0, 15).map(comp => (
                <button
                  key={comp.symbol}
                  type="button"
                  onClick={() => setSelectedBuySymbol(comp.symbol)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedBuySymbol.toUpperCase() === comp.symbol.toUpperCase()
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/50'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-black text-xs text-slate-900 dark:text-white">
                    {comp.symbol}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{comp.name}</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mt-0.5">
                    {formatFCFA(comp.currentPrice)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Nombre d'actions à acheter *
              </label>
              <span className="text-slate-500 text-[11px]">
                Cours actuel : <strong>{formatFCFA(selectedBuyCompany.currentPrice)}</strong>
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
            <div className="flex items-center gap-2 pt-1">
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
                    const possibleShares = Math.max(1, Math.floor(budget / (selectedBuyCompany.currentPrice * 1.006)));
                    setBuyShares(possibleShares);
                  }}
                  className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Montant brut des titres ({buyShares} × {formatFCFA(selectedBuyCompany.currentPrice)}) :</span>
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
              Confirmer l'achat ({formatFCFA(buyNet)})
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
