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
import { formatFCFA, formatPercent, formatDateFrench } from '../../lib/formatters';
import { calculatePER, calculateROE, calculatePBR } from '../../lib/calculations';
import { useAuth } from '../../features/auth/AuthContext';
import { fetchCompanyQuote, fetchCompanyFinancials, fetchCompanyDividends } from '../../lib/api';
import { CreateAlertModal } from '../../components/alerts/CreateAlertModal';
import { Calculator, BarChart2, Bookmark, AlertCircle, ArrowLeft, CheckCircle, Coins, TrendingUp, TrendingDown, Target, Bell, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

interface CompanyDetailPageProps {
  symbol: string;
  onNavigate: (path: string) => void;
}

export const CompanyDetailPage: React.FC<CompanyDetailPageProps> = ({ symbol, onNavigate }) => {
  const { saveAnalysis, savedAnalyses } = useAuth();
  const [perModalOpen, setPerModalOpen] = useState(false);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const demoComp = DEMO_COMPANIES.find(c => c.symbol.toUpperCase() === symbol.toUpperCase()) || DEMO_COMPANIES[0];
  const [company, setCompany] = useState<Company>(demoComp);
  const [financialPeriods, setFinancialPeriods] = useState(DEMO_FINANCIAL_PERIODS[company.symbol] || []);
  const [dividendHistory, setDividendHistory] = useState(DEMO_DIVIDEND_HISTORY[company.symbol] || []);
  const historicalPrices = DEMO_HISTORICAL_PRICES[company.symbol] || DEMO_HISTORICAL_PRICES.SNTS || [];

  const loadLiveData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const quote = await fetchCompanyQuote(symbol);
      if (quote) {
        setCompany(prev => ({
          ...prev,
          currentPrice: quote.price,
          dayChangePercent: quote.changePercent,
          source: quote.source || prev.source,
          freshness: quote.freshness || prev.freshness,
          lastUpdated: quote.timestamp || prev.lastUpdated,
        }));
      }

      const fin = await fetchCompanyFinancials(symbol);
      if (fin && fin.length > 0) {
        setFinancialPeriods(fin as any);
      }

      const divs = await fetchCompanyDividends(symbol);
      if (divs && divs.length > 0) {
        setDividendHistory(divs as any);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadLiveData();
    return () => { mounted = false; };
  }, [symbol]);

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
      {/* Top Back Navigation & Refresh Action */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('/search')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la recherche
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

      {/* Main Stock Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Pending Review Notice Banner */}
        {company.status === 'PENDING_REVIEW' && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            Donnée en attente de validation par un administrateur. Les chiffres récents sont en cours de vérification.
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-900 text-white font-extrabold text-sm rounded-lg">
                {company.symbol}
              </span>
              <FreshnessBadge freshness={company.freshness} />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">{company.name}</h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Secteur: <strong className="text-slate-800 dark:text-slate-200">{company.sector}</strong></span>
              <span>•</span>
              <span>Pays: <strong className="text-slate-800 dark:text-slate-200">{company.country}</strong></span>
              <span>•</span>
              <span>Marché: <strong className="text-slate-800 dark:text-slate-200">{company.market}</strong></span>
            </div>
          </div>

          {/* Price & Intrinsic Value Comparison Block */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Intrinsic Price (IPO) */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-300 tracking-wider">
                <Coins className="w-3.5 h-3.5" />
                Coût Intrinsèque (Entrée)
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {company.ipoPrice ? formatFCFA(company.ipoPrice) : '1 000 FCFA'}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                Prix d'introduction{company.ipoDate ? ` (${company.ipoDate})` : ''}
              </div>
            </div>

            {/* Current Price Block */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 min-w-[220px]">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block tracking-wider">
                Valeur Actuelle (Marché)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {company.currentPrice > 0 ? formatFCFA(company.currentPrice) : 'Donnée indisponible'}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs font-extrabold">
                <span className={isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                  {formatPercent(company.dayChangePercent)} (24h)
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">Mis à jour: {formatDateFrench(company.lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onNavigate(`/simulation?symbol=${company.symbol}`)}>
              <Target className="w-4 h-4 mr-1.5 text-amber-300" />
              Créer un Plan d'Investissement
            </Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate(`/simulation?symbol=${company.symbol}`)}>
              <Calculator className="w-4 h-4 mr-1.5" />
              Simuler
            </Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate(`/comparison?symbol=${company.symbol}`)}>
              <BarChart2 className="w-4 h-4 mr-1.5" />
              Comparer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAlertModalOpen(true)}
              className="border-amber-300 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-extrabold hover:bg-amber-100"
            >
              <Bell className="w-4 h-4 mr-1.5 text-amber-600" />
              Créer une Alerte
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveAnalysis}
              className={isAlreadySaved || analysisSaved ? 'border-emerald-500 text-emerald-800 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300' : ''}
            >
              {analysisSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Sauvegardé !
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 mr-1.5" />
                  Sauvegarder l’analyse
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Source Officielle: <span className="font-semibold text-slate-700 dark:text-slate-300">{company.source}</span>
          </div>
        </div>
      </div>

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

      {/* Price History Chart */}
      <PriceHistoryChart data={historicalPrices} companySymbol={company.symbol} />

      {/* Lifecycle Stage & Dividends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Cycle de Vie & Stratégie</h3>
          <LifecycleStageCard lifecycle={company.lifecycle} />
        </div>

        <DividendHistoryChart dividends={dividendHistory} />
      </div>

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
