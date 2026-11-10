import React, { useState } from 'react';
import {
  Shield,
  Scale,
  Zap,
  CheckCircle2,
  TrendingUp,
  PieChart,
  ArrowRight,
  Calculator,
  Coins,
  Sparkles,
  ExternalLink,
  Save,
  Check,
  Building2,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { InvestorProfileType, InvestorProfileData } from '../../types';
import {
  PROFILE_DEFINITIONS,
  getPersonalizedStockSuggestions,
  calculateBudgetPortfolio,
} from '../../services/investor-profile/investorProfileService';
import { formatFCFA, formatPercent } from '../../lib/formatters';
import { useAuth } from '../../features/auth/AuthContext';

interface PersonalizedStockSuggestionsProps {
  initialProfileType?: InvestorProfileType;
  onNavigate?: (path: string) => void;
  showSaveButton?: boolean;
  onProfileSaved?: (profileType: InvestorProfileType) => void;
}

export const PersonalizedStockSuggestions: React.FC<PersonalizedStockSuggestionsProps> = ({
  initialProfileType,
  onNavigate,
  showSaveButton = true,
  onProfileSaved,
}) => {
  const { user, isAuthenticated, updateInvestorProfile } = useAuth();

  const userSavedProfileType = user?.investorProfile?.profileType;
  const [selectedProfile, setSelectedProfile] = useState<InvestorProfileType>(
    initialProfileType || userSavedProfileType || 'equilibre'
  );

  const [monthlyBudget, setMonthlyBudget] = useState<number>(
    user?.investorProfile?.monthlyBudget || 150000
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const profileDef = PROFILE_DEFINITIONS[selectedProfile];
  const suggestions = getPersonalizedStockSuggestions(selectedProfile);
  const budgetPortfolio = calculateBudgetPortfolio(monthlyBudget, suggestions);

  const isCurrentProfileSaved = userSavedProfileType === selectedProfile;

  const handleSaveProfile = async () => {
    if (!isAuthenticated || !user) {
      if (onNavigate) onNavigate('/auth');
      return;
    }

    setIsSaving(true);
    try {
      const profileData: InvestorProfileData = {
        profileType: selectedProfile,
        score: selectedProfile === 'prudent' ? 1.2 : selectedProfile === 'equilibre' ? 2.0 : 2.8,
        monthlyBudget,
        riskTolerance: selectedProfile === 'prudent' ? 'faible' : selectedProfile === 'equilibre' ? 'moderee' : 'elevee',
        horizon: selectedProfile === 'prudent' ? 'court_terme' : selectedProfile === 'equilibre' ? 'moyen_terme' : 'long_terme',
        objective: selectedProfile === 'prudent' ? 'capital_preservation' : selectedProfile === 'equilibre' ? 'dividends' : 'growth',
        updatedAt: new Date().toISOString(),
      };

      await updateInvestorProfile(profileData);
      setSaveSuccess(true);
      if (onProfileSaved) {
        onProfileSaved(selectedProfile);
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const budgetPresets = [50000, 100000, 250000, 500000, 1000000];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5" />
            Intelligence d’Allocation & Sécurité BRVM
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Suggestions d'Actions Personnalisées
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sélection algorithmique des meilleures valeurs de la BRVM adaptées à votre tolérance au risque et à vos objectifs financiers.
          </p>
        </div>

        {/* Profile Save Button / Status */}
        {showSaveButton && (
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <Button
                variant={isCurrentProfileSaved ? 'outline' : 'primary'}
                size="sm"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={
                  isCurrentProfileSaved
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-emerald-500" />
                    Profil Enregistré !
                  </>
                ) : isCurrentProfileSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Profil Actif de votre Compte
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    Sauvegarder ce Profil
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate && onNavigate('/auth')}
                className="border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Se connecter pour sauvegarder
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Interactive Profile Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['prudent', 'equilibre', 'dynamique'] as InvestorProfileType[]).map(type => {
          const item = PROFILE_DEFINITIONS[type];
          const isSelected = selectedProfile === type;
          const isUserSaved = userSavedProfileType === type;

          return (
            <button
              key={type}
              onClick={() => setSelectedProfile(type)}
              className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      type === 'prudent'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : type === 'equilibre'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {type === 'prudent' && <Shield className="w-5 h-5" />}
                    {type === 'equilibre' && <Scale className="w-5 h-5" />}
                    {type === 'dynamique' && <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{item.shortName}</h3>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Risque {item.riskLevel}
                    </span>
                  </div>
                </div>

                {isUserSaved && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                    Actif
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                {item.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Profile Highlight Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl space-y-6 border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${profileDef.badgeBg}`}>
                Profil {profileDef.shortName}
              </span>
              <span className="text-xs font-bold text-slate-300">
                Horizon cible : <strong className="text-white">{profileDef.recommendedHorizon}</strong>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{profileDef.tagline}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-medium">
              {profileDef.description}
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 shrink-0 text-center sm:text-left space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400 block">
              Rendement Visé
            </span>
            <span className="text-lg font-black text-white block">{profileDef.targetExpectedReturn}</span>
            <span className="text-[10px] text-slate-400 font-medium">Dividendes + Valorisation</span>
          </div>
        </div>

        {/* Recommended Asset Allocation Bar */}
        <div className="space-y-3 pt-3 border-t border-slate-700/80">
          <div className="flex justify-between items-center text-xs font-extrabold text-slate-300">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Répartition d’Actifs Stratégique Recommandée
            </span>
            <span>100% de votre portefeuille</span>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
            {profileDef.allocation.map((item, idx) => (
              <div
                key={idx}
                className={`${item.color} h-full transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.category}: ${item.percentage}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {profileDef.allocation.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color} mt-0.5 shrink-0`} />
                <div>
                  <span className="font-extrabold text-white">
                    {item.category} ({item.percentage}%)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Stocks Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top Actions Recommandées pour le Profil {profileDef.shortName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sociétés de la BRVM sélectionnées sur des critères rigoureux de rentabilité, liquidité et solidité de bilan.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full self-start sm:self-auto">
            {suggestions.length} valeurs sélectionnées
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((sug, idx) => {
            const { company } = sug;
            const isPositive = company.dayChangePercent >= 0;

            return (
              <div
                key={company.symbol}
                className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-2xs hover:shadow-md space-y-4 flex flex-col justify-between"
              >
                {/* Header with symbol, name, match score */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {company.symbol}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 dark:text-white text-base">
                            {company.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {company.sector} • {company.country}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {sug.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  {/* Price & Highlight Metric */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cours Actuel</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatFCFA(company.currentPrice)}
                        </span>
                        <span
                          className={`text-xs font-extrabold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatPercent(company.dayChangePercent)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {sug.keyMetricLabel}
                      </span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {sug.keyMetricValue}
                      </span>
                    </div>
                  </div>

                  {/* Profile Fit Explanation */}
                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      💡 <strong className="text-slate-900 dark:text-white">Pourquoi pour vous :</strong>{' '}
                      {sug.profileFitReason}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed italic">
                      « {sug.highlightReason} »
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Poids suggéré : <strong className="text-slate-900 dark:text-white font-black">{sug.suggestedWeightPercent}%</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {onNavigate && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigate(`/company/${company.symbol}`)}
                          className="text-xs h-8 px-2.5"
                        >
                          Fiche <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onNavigate(`/simulation?symbol=${company.symbol}`)}
                          className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Calculator className="w-3 h-3 mr-1" />
                          Simuler
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Budget Portfolio Simulation */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Calculateur de Déploiement d’Épargne Mensuelle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Découvrez la composition exacte de votre portefeuille mensuel selon votre budget d’investissement.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {budgetPresets.map(preset => (
              <button
                key={preset}
                onClick={() => setMonthlyBudget(preset)}
                className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  monthlyBudget === preset
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Input & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Votre budget mensuel en FCFA :
            </label>
            <div className="relative">
              <input
                type="number"
                step="10000"
                min="10000"
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(Math.max(10000, Number(e.target.value)))}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                FCFA
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Capital Investi</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {formatFCFA(budgetPortfolio.totalAllocated)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Solde liquidités : {formatFCFA(budgetPortfolio.remainingCash)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">
              Dividendes Annuels Estimés
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
              +{formatFCFA(budgetPortfolio.totalAnnualDividends)} / an
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-bold">
              Rendement estimé : ~{budgetPortfolio.estimatedYieldPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Portfolio Table Breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3">Valeur Recommandée</th>
                <th className="py-2.5 px-3">Cours</th>
                <th className="py-2.5 px-3 text-center">Nombre d’actions</th>
                <th className="py-2.5 px-3 text-right">Montant alloué</th>
                <th className="py-2.5 px-3 text-right">Dividendes annuels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {budgetPortfolio.items.map(item => (
                <tr key={item.symbol} className="hover:bg-white/60 dark:hover:bg-slate-900/60">
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                        {item.symbol}
                      </span>
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold">{formatFCFA(item.price)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 font-black text-slate-900 dark:text-white">
                      {item.shareCount} action{item.shareCount > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                    {formatFCFA(item.actualCost)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatFCFA(item.estimatedAnnualDividend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
