import React, { useState, useEffect } from 'react';
import { DEMO_COMPANIES, DEMO_HISTORICAL_PRICES, DEMO_FINANCIAL_PERIODS, DEMO_DIVIDEND_HISTORY } from '../../data/demo-data';
import { Company } from '../../types';
import { FreshnessBadge } from '../../components/ui/FreshnessBadge';
import { Button } from '../../components/ui/Button';
import { SkeletonCompanyDetail } from '../../components/ui/Skeleton';
import { FinancialMetricCard } from '../../components/finance/FinancialMetricCard';
import { LifecycleStageCard } from '../../components/finance/LifecycleStageCard';
import { PERExplanationModal } from '../../components/finance/PERExplanationModal';
import { PriceHistoryChart } from '../../components/charts/PriceHistoryChart';
import { DividendHistoryChart } from '../../components/charts/DividendHistoryChart';
import { DividendProjectionModule } from '../../components/finance/DividendProjectionModule';
import { CompanyReportsModal } from '../../components/finance/CompanyReportsModal';
import { formatFCFA, formatPercent, formatDateFrench } from '../../lib/formatters';
import { calculatePER, calculateROE, calculatePBR } from '../../lib/calculations';
import { useAuth } from '../../features/auth/AuthContext';
import { useMarketData } from '../../features/market/MarketContext';
import { DailyMarketSessionBadge } from '../../components/finance/DailyMarketSessionBadge';
import { fetchCompanyQuote, fetchCompanyFinancials, fetchCompanyDividends } from '../../lib/api';
import { CreateAlertModal } from '../../components/alerts/CreateAlertModal';
import {
  Calculator,
  BarChart2,
  Bookmark,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Coins,
  TrendingUp,
  TrendingDown,
  Target,
  Bell,
  RefreshCw,
  Sparkles,
  ArrowRight,
  FileText,
  ExternalLink,
  Wallet,
} from 'lucide-react';

interface CompanyDetailPageProps {
  symbol: string;
  onNavigate: (path: string) => void;
}

export const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({ symbol, onNavigate }) => {
  const { saveAnalysis, savedAnalyses } = useAuth();
  const [perModalOpen, setPerModalOpen] = useState(false);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);

  const { getCompany, getQuote, refreshMarketData, historicalPrices: allHistoricalPrices } = useMarketData();
  const liveComp = getCompany(symbol) || DEMO_COMPANIES.find(c => c.symbol.toUpperCase() === symbol.toUpperCase()) || DEMO_COMPANIES[0];
  const [company, setCompany] = useState<Company>(liveComp);
  const [financialPeriods, setFinancialPeriods] = useState(DEMO_FINANCIAL_PERIODS[liveComp.symbol] || []);
  const [dividendHistory, setDividendHistory] = useState(DEMO_DIVIDEND_HISTORY[liveComp.symbol] || []);
  
  // Use dynamic historical prices incorporating today's live daily quote
  const historicalPrices = React.useMemo(() => {
    return allHistoricalPrices[company.symbol] || DEMO_HISTORICAL_PRICES[company.symbol] || DEMO_HISTORICAL_PRICES.SNTS || [];
  }, [allHistoricalPrices, company.symbol]);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLiveData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
      await refreshMarketData(true);
    }

    try {
      const [quote, fin, divs] = await Promise.all([
        fetchCompanyQuote(symbol),
        fetchCompanyFinancials(symbol),
        fetchCompanyDividends(symbol)
      ]);

      if (quote) {
        setCompany(prev => ({
          ...prev,
          currentPrice: quote.price,
          dayChangePercent: quote.changePercent,
          previousClose: quote.previousClose || prev.previousClose,
          volume: quote.volume || prev.volume,
          source: quote.source || prev.source,
          freshness: quote.freshness || prev.freshness,
          lastUpdated: quote.timestamp || prev.lastUpdated,
        }));
      }

      if (fin && fin.length > 0) {
        setFinancialPeriods(fin as any);
      }

      if (divs && divs.length > 0) {
        setDividendHistory(divs as any);
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const updated = getCompany(symbol) || DEMO_COMPANIES.find(c => c.symbol.toUpperCase() === symbol.toUpperCase()) || DEMO_COMPANIES[0];
    setCompany(updated);
    setFinancialPeriods(DEMO_FINANCIAL_PERIODS[updated.symbol] || []);
    setDividendHistory(DEMO_DIVIDEND_HISTORY[updated.symbol] || []);

    loadLiveData();
  }, [symbol, getCompany]);

  const perResult = calculatePER(company.currentPrice, company.eps);
  const roeResult = calculateROE(company.roe);
  const pbrResult = calculatePBR(company.currentPrice, company.bookValuePerShare, company.pbr);
  const isPositive = company.dayChangePercent >= 0;

  const isAlreadySaved = savedAnalyses.some(a => a.symbol === company.symbol);

  const handleSaveAnalysis = () => {
    saveAnalysis({
      symbol: company.symbol,
      companyName: company.name,
      title: `Analyse ${company.symbol} (${company.name})`,
      notes: `Analyse réalisée sur BourseClair au cours de ${formatFCFA(company.currentPrice)}.`,
      snapshotPrice: company.currentPrice,
      snapshotPer: perResult.per || undefined,
      snapshotEps: company.eps,
    });
    setAnalysisSaved(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <button
          onClick={() => onNavigate('/search')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la recherche
        </button>
        <SkeletonCompanyDetail />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Back Navigation & Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('/search')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la recherche
        </button>

        <div className="flex items-center gap-2">
          {/* Official Reports Direct Button in Sky Blue hover Orange */}
          <DailyMarketSessionBadge variant="compact" />

          <button
            onClick={() => setReportsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-400 hover:bg-orange-500 text-slate-950 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-sky-300 hover:border-orange-500 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rapports d'activités</span>
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => loadLiveData(true)}
            disabled={isRefreshing}
            className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Rafraîchir les données'}
          </Button>
        </div>
      </div>

      {/* Analysis Saved Confirmation Toast Banner */}
      {analysisSaved && (
        <div className="p-4 rounded-2xl bg-emerald-900 text-white shadow-xl flex items-center justify-between gap-4 border border-emerald-400/40 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">Analyse de {company.symbol} Enregistrée avec Succès !</span>
              <p className="text-xs text-emerald-200 font-medium">
                Retrouvez cette analyse à tout moment dans votre espace compte pour suivre son évolution.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onNavigate('/account')}
              className="bg-white text-emerald-950 hover:bg-emerald-100 font-extrabold text-xs"
            >
              Voir mon Compte <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <button
              onClick={() => setAnalysisSaved(false)}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Main Stock Hero Header (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800 space-y-6">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        {/* Pending Review Notice Banner */}
        {company.status === 'PENDING_REVIEW' && (
          <div className="relative z-10 p-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            Donnée en attente de validation par un administrateur. Les chiffres récents sont en cours de vérification.
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-amber-400 text-emerald-950 font-black text-sm rounded-xl shadow-md">
                {company.symbol}
              </span>
              <FreshnessBadge freshness={company.freshness} />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
              {company.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200/90 font-medium">
              <span>Secteur: <strong className="text-white font-bold">{company.sector}</strong></span>
              <span>•</span>
              <span>Pays: <strong className="text-white font-bold">{company.country}</strong></span>
              <span>•</span>
              <span>Marché: <strong className="text-white font-bold">{company.market}</strong></span>
            </div>
          </div>

          {/* Price & Intrinsic Value Comparison Block */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-3">
            {/* Intrinsic Price (IPO) */}
            <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 min-w-[200px] shadow-inner">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                <Coins className="w-3.5 h-3.5" />
                Coût Intrinsèque (Entrée)
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {company.ipoPrice ? formatFCFA(company.ipoPrice) : '1 000 FCFA'}
              </div>
              <div className="text-[11px] font-normal text-emerald-200/70 mt-1">
                Prix d'introduction{company.ipoDate ? ` (${company.ipoDate})` : ''}
              </div>
            </div>

            {/* Current Price Block */}
            <div className="p-4 rounded-2xl bg-emerald-900/90 border border-emerald-600/80 min-w-[220px] shadow-md">
              <span className="text-[10px] font-black uppercase text-emerald-300 block tracking-wider">
                Valeur Actuelle (Marché)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {company.currentPrice > 0 ? formatFCFA(company.currentPrice) : 'Donnée indisponible'}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs font-black">
                <span className={isPositive ? 'text-emerald-300 bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-500/50' : 'text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded-md border border-rose-500/50'}>
                  {formatPercent(company.dayChangePercent)} (24h)
                </span>
                <span className="text-emerald-200/70 text-[10px]">Mis à jour: {formatDateFrench(company.lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="relative z-10 pt-4 border-t border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate(`/simulation?symbol=${company.symbol}`)}
              className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
            >
              <Target className="w-4 h-4 text-emerald-950" />
              <span>Créer un Plan d'Investissement</span>
            </button>
            <button
              onClick={() => onNavigate(`/simulation?symbol=${company.symbol}`)}
              className="px-4 py-2 rounded-full bg-emerald-900/80 hover:bg-emerald-800/90 text-white border border-emerald-600/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Simuler</span>
            </button>
            <button
              onClick={() => onNavigate(`/comparison?symbol=${company.symbol}`)}
              className="px-4 py-2 rounded-full bg-emerald-900/80 hover:bg-emerald-800/90 text-white border border-emerald-600/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Comparer</span>
            </button>
            <button
              onClick={() => onNavigate('/account')}
              className="px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Tester cette action dans mon Portfolio Virtuel"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Portfolio Virtuel</span>
            </button>
            <button
              onClick={() => setAlertModalOpen(true)}
              className="px-4 py-2 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span>Créer une Alerte</span>
            </button>
            <button
              onClick={handleSaveAnalysis}
              className={`px-4 py-2 rounded-full font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                isAlreadySaved || analysisSaved
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-emerald-900/80 hover:bg-emerald-800/90 text-emerald-200 border border-emerald-600/60'
              }`}
            >
              {analysisSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-950" />
                  <span>Sauvegardé !</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Sauvegarder l’analyse</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-emerald-200/80 font-medium flex items-center gap-2">
            <span>Source: <strong className="text-white">{company.source}</strong></span>
          </div>
        </div>
      </section>

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">À propos de l'entreprise</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{company.description}</p>
      </div>

      {/* Intrinsic Cost vs Current Value Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-md border border-indigo-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold mb-1">
              <Coins className="w-3.5 h-3.5" />
              Analyse de Valeur & Coût Intrinsèque
            </div>
            <h3 className="text-lg sm:text-xl font-bold">Prix d'Entrée sur le Marché vs Cours Actuel</h3>
          </div>
          <div className="text-xs text-indigo-200 font-medium bg-slate-800/80 px-3 py-1.5 rounded-xl border border-indigo-800/50">
            Ajustement historique & création de valeur
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-indigo-500/20 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Coût Intrinsèque d'Entrée (IPO)</span>
            <div className="text-2xl font-black text-white">
              {company.ipoPrice ? formatFCFA(company.ipoPrice) : '1 000 FCFA'}
            </div>
            <p className="text-[11px] text-slate-400">
              Prix unitaire lors de l'introduction en bourse{company.ipoDate ? ` (${company.ipoDate})` : ''}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-indigo-500/20 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Valeur Actuelle du Marché</span>
            <div className="text-2xl font-black text-white">
              {company.currentPrice > 0 ? formatFCFA(company.currentPrice) : 'Non coté'}
            </div>
            <p className="text-[11px] text-slate-400">
              Dernier cours de clôture négocié à la BRVM
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Plus-value / Variation Historique</span>
            {company.ipoPrice && company.currentPrice > 0 ? (
              <>
                <div className={`text-2xl font-black ${company.currentPrice >= company.ipoPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {company.currentPrice >= company.ipoPrice ? '+' : ''}
                  {(((company.currentPrice - company.ipoPrice) / company.ipoPrice) * 100).toFixed(1)} %
                </div>
                <p className="text-[11px] text-indigo-200">
                  Evolution du capital par action depuis l'entrée
                </p>
              </>
            ) : (
              <div className="text-sm font-bold text-slate-400">Non disponible</div>
            )}
          </div>
        </div>

        <div className="text-xs text-indigo-200/90 leading-relaxed font-medium bg-indigo-950/40 p-4 rounded-2xl border border-indigo-800/30">
          <strong className="text-white block mb-1">💡 Explication pédagogique du coût intrinsèque :</strong>
          Le <strong>coût intrinsèque d'entrée</strong> correspond à la valeur nominale ou au prix de souscription de l'action lors de sa première cotation publique (IPO) à la BRVM. La <strong>valeur actuelle</strong> reflète l'offre et la demande actuelles des investisseurs sur le marché secondaire.
        </div>
      </div>

      {/* Financial Ratios Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FinancialMetricCard
          label="BPA (Bénéfice Par Action)"
          value={company.eps !== undefined ? `${company.eps} FCFA` : 'Donnée indisponible'}
          subValue="Part du bénéfice net annuel / action"
          tooltipText="Le Bénéfice Par Action (BPA) ou EPS mesure ce que gagne réellement l’entreprise pour chaque action émise."
        />

        <FinancialMetricCard
          label="PER (Price Earning Ratio)"
          value={perResult.status === 'VALID' ? `${perResult.per}x` : 'Donnée indisponible'}
          subValue={perResult.status === 'VALID' ? 'Multiple de bénéfice' : perResult.status === 'NEGATIVE_EPS' ? 'BPA Négatif (Perte)' : 'Donnée indisponible'}
          tooltipText="Le PER indique combien de fois le bénéfice annuel vous payez pour acheter l'action."
          variant={perResult.status === 'NEGATIVE_EPS' ? 'negative' : 'highlight'}
          onClickHelp={() => setPerModalOpen(true)}
        />

        <FinancialMetricCard
          label="ROE (Rentabilité Capitaux Propres)"
          value={roeResult.roe !== null ? `${roeResult.roe}%` : 'Donnée indisponible'}
          subValue={roeResult.status === 'EXCELLENT' ? 'Excellente rentabilité (≥ 20%)' : roeResult.status === 'GOOD' ? 'Bonne rentabilité (≥ 12%)' : 'Rendement sur fond propre'}
          tooltipText="Le ROE (Return on Equity) mesure l'efficacité avec laquelle l'entreprise génère des bénéfices à partir des capitaux propres des actionnaires."
          variant={roeResult.status === 'EXCELLENT' || roeResult.status === 'GOOD' ? 'highlight' : 'default'}
        />

        <FinancialMetricCard
          label="PBR (Price-to-Book Ratio)"
          value={pbrResult.pbr !== null ? `${pbrResult.pbr}x` : 'Donnée indisponible'}
          subValue={pbrResult.status === 'BELOW_BOOK_VALUE' ? 'Décote d’actif (< 1.0x)' : company.bookValuePerShare ? `Actif net: ${formatFCFA(company.bookValuePerShare)}` : 'Multiple de la valeur comptable'}
          tooltipText="Le PBR compare le cours de bourse à la valeur comptable des fonds propres par action (Actif Net). Un PBR < 1,0 signale une action cotant sous sa valeur comptable."
          variant={pbrResult.status === 'BELOW_BOOK_VALUE' ? 'highlight' : 'default'}
        />

        <FinancialMetricCard
          label="Dernier Dividende"
          value={company.lastDividend ? `${company.lastDividend} FCFA` : '0 FCFA'}
          subValue="Paiement annuel en cash par action"
          tooltipText="Part du bénéfice distribuée directement aux actionnaires."
        />

        <FinancialMetricCard
          label="Rendement Dividende"
          value={company.dividendYield ? formatPercent(company.dividendYield, false) : '0 %'}
          subValue="Calculé sur le cours actuel"
          tooltipText="Ratio entre le dernier dividende annuel et le prix actuel de l'action."
          variant="highlight"
        />
      </div>

      {/* Interactive Price History Chart (Recharts) */}
      <PriceHistoryChart data={historicalPrices} companySymbol={company.symbol} />

      {/* Dividend Projection Module */}
      <DividendProjectionModule
        company={company}
        dividendHistory={dividendHistory}
        onNavigate={onNavigate}
      />

      {/* Lifecycle Stage & Historical Dividends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Cycle de Vie & Stratégie</h3>
          <LifecycleStageCard lifecycle={company.lifecycle} />
        </div>

        <DividendHistoryChart dividends={dividendHistory} />
      </div>

      {/* Official Reports Modal */}
      <CompanyReportsModal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
        company={company}
      />

      {/* Pedagogical Notice */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Rappel d'analyse BourseClair</span>
          Ce contenu à caractère éducatif est basé sur les données diffusées par {company.source} pour {company.name}. Il ne constitue pas une recommandation d’investissement.
        </div>
      </div>

      {/* PER Modal */}
      <PERExplanationModal isOpen={perModalOpen} onClose={() => setPerModalOpen(false)} company={company} />

      {/* Create Alert Modal */}
      <CreateAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        defaultSymbol={company.symbol}
        defaultTargetPrice={company.currentPrice}
      />
    </div>
  );
};
