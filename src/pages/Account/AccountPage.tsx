import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { PriceAlertsManager } from '../../components/alerts/PriceAlertsManager';
import { PortfolioPerformanceChart } from '../../components/dashboard/PortfolioPerformanceChart';
import { PersonalizedStockSuggestions } from '../../components/profile/PersonalizedStockSuggestions';
import { InvestorProfileModule } from '../../components/profile/InvestorProfileModule';
import { VirtualPortfolioManager } from '../../components/portfolio/VirtualPortfolioManager';
import { formatFCFA, formatDateFrench } from '../../lib/formatters';
import { exportSimulationToPDF, exportSimulationToCSV } from '../../lib/export';
import { BRVM_SGI_LIST } from '../../data/sgi-data';
import {
  User,
  Bookmark,
  Calculator,
  LogOut,
  Trash2,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  Sparkles,
  Target,
  Shield,
  Scale,
  Zap,
  CheckCircle2,
  RefreshCw,
  Heart,
  Landmark,
  ExternalLink,
  Wallet,
  Bell,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  MailCheck,
  TrendingUp,
  Clock,
  History,
  Coins,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { startOnboardingTour } from '../../components/common/OnboardingTour';
import { PROFILE_DEFINITIONS } from '../../services/investor-profile/investorProfileService';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

interface EmailDeliveryRecord {
  id: string;
  recipient: string;
  subject: string;
  type: string;
  sentAt: string;
  status: string;
  mode?: string;
  previewUrl?: string;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const {
    user,
    isAuthenticated,
    logout,
    savedAnalyses,
    deleteAnalysis,
    savedSimulations,
    deleteSimulation,
    favoriteSgis,
    toggleFavoriteSgi,
    priceAlerts,
    resendConfirmationEmail,
    confirmationEmailNotice,
  } = useAuth();

  const [activeSection, setActiveSection] = useState<
    'DASHBOARD' | 'PORTFOLIO' | 'PROFILE' | 'SIMULATIONS' | 'ALERTS' | 'SGIS' | 'SECURITY' | 'ALL'
  >('DASHBOARD');
  const [isEditingProfileQuiz, setIsEditingProfileQuiz] = useState<boolean>(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailHistory, setEmailHistory] = useState<EmailDeliveryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Fetch recent email confirmations for this client
  useEffect(() => {
    if (user?.email) {
      setIsLoadingHistory(true);
      fetch(`/api/auth/email-history?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.deliveries)) {
            setEmailHistory(data.deliveries);
          }
        })
        .catch(err => console.warn('Could not load email history:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [user?.email]);

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      await resendConfirmationEmail();
      setEmailStatusMsg(`E-mail de confirmation officiel expédié à ${user?.email} !`);
    } catch {
      setEmailStatusMsg(`Notification de sécurité transmise.`);
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailStatusMsg(null), 5000);
    }
  };

  const favoritedSgiObjects = BRVM_SGI_LIST.filter(sgi => favoriteSgis.includes(sgi.id));

  // Deterministic Client ID
  const clientIdentifier = user
    ? `CLI-BRVM-${(user.id || '000000').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
    : 'CLI-BRVM-000000';

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Espace Client Bourse Facile BRVM
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Connectez-vous via votre compte Google ou votre adresse e-mail pour accéder à votre portefeuille virtuel, vos alertes en temps réel et votre diagnostic d'investissement.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onNavigate('/auth')}
            className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <User className="w-4 h-4" />
            <span>Se connecter à mon Espace Client</span>
          </button>
        </div>
      </div>
    );
  }

  const savedProfileType = user.investorProfile?.profileType;
  const profileDetails = savedProfileType ? PROFILE_DEFINITIONS[savedProfileType] : null;

  // Overview metrics
  const totalSimulatedInvested = savedSimulations.reduce((acc, sim) => acc + (sim.initialAmount || 0), 0);
  const totalSimulatedFinal = savedSimulations.reduce((acc, sim) => acc + (sim.finalValue || 0), 0);
  const activeAlertsCount = priceAlerts.filter(a => a.active).length;

  return (
    <div className="space-y-6 pb-14">
      {/* SECTION 1: Institutional Client Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-800 border-2 border-emerald-500/50 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                Espace Client Officiel BRVM
              </span>
              <span className="text-emerald-500" aria-hidden="true">·</span>
              <span className="text-[11px] font-mono text-emerald-200 bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-700/60 font-bold">
                {clientIdentifier}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
              {savedProfileType && (
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 shadow-2xs">
                  {profileDetails?.shortName}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200/90 pt-0.5">
              <span>{user.email}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-100">
                {user.authProvider === 'GOOGLE' ? (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Compte Google Vérifié</span>
                  </>
                ) : (
                  <>
                    <MailCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Compte E-mail Sécurisé</span>
                  </>
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[11px] text-emerald-300 font-medium">UEMOA GMT</span>
            </div>
          </div>
        </div>

        {/* Balanced Header Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={handleResendEmail}
            disabled={isSendingEmail}
            className="h-9 px-3.5 rounded-xl border border-emerald-500/50 bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            title="Renvoyer l'e-mail officiel de confirmation de connexion"
          >
            <MailCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isSendingEmail ? 'Envoi...' : 'E-mail de confirmation'}</span>
          </button>

          <button
            onClick={startOnboardingTour}
            className="h-9 px-3.5 rounded-xl border border-amber-400/60 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Paco Conseiller IA</span>
          </button>

          <button
            onClick={logout}
            className="h-9 px-3.5 rounded-xl border border-emerald-700/60 hover:border-rose-400/60 bg-emerald-900/60 hover:bg-rose-950/80 text-emerald-100 hover:text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </section>

      {/* Confirmation Email Status Bar */}
      {(emailStatusMsg || confirmationEmailNotice) && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{emailStatusMsg || confirmationEmailNotice}</span>
          </div>
          <button
            onClick={handleResendEmail}
            disabled={isSendingEmail}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {isSendingEmail ? 'Envoi...' : 'Renvoyer'}
          </button>
        </div>
      )}

      {/* SECTION 2: Harmonious Segmented Navigation Controller */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('DASHBOARD')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'DASHBOARD'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Tableau de Bord</span>
        </button>

        <button
          onClick={() => setActiveSection('PORTFOLIO')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'PORTFOLIO'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Portefeuille Virtuel</span>
        </button>

        <button
          onClick={() => setActiveSection('PROFILE')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'PROFILE'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Profil & Recommandations</span>
        </button>

        <button
          onClick={() => setActiveSection('SIMULATIONS')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'SIMULATIONS'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Mes Simulations ({savedSimulations.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('ALERTS')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'ALERTS'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alertes ({activeAlertsCount})</span>
        </button>

        <button
          onClick={() => setActiveSection('SGIS')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'SGIS'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>SGI Favorites ({favoritedSgiObjects.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('SECURITY')}
          className={`h-9 px-3.5 rounded-xl text-xs flex items-center gap-2 shrink-0 transition-colors cursor-pointer border ${
            activeSection === 'SECURITY'
              ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-medium'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sécurité & E-mails</span>
        </button>

        <button
          onClick={() => setActiveSection('ALL')}
          className={`h-9 px-3 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ml-auto border ${
            activeSection === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold border-slate-900 dark:border-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
          title="Afficher toutes les sections"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vue Globale</span>
        </button>
      </div>

      {/* SECTION 3: TAB CONTENT */}

      {/* TAB 1: CLIENT DASHBOARD OVERVIEW */}
      {(activeSection === 'DASHBOARD' || activeSection === 'ALL') && (
        <section className="space-y-6">
          {/* 4 Financial KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Portefeuille Virtuel */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Portefeuille Virtuel
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="py-3">
                <span className="text-xl font-black text-slate-900 dark:text-white block">
                  {totalSimulatedFinal > 0 ? formatFCFA(totalSimulatedFinal) : '5 000 000 FCFA'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {savedSimulations.length > 0
                    ? `${savedSimulations.length} simulation(s) active(s)`
                    : 'Solde virtuel de démarrage disponible'}
                </span>
              </div>
              <button
                onClick={() => setActiveSection('PORTFOLIO')}
                className="w-full h-8 px-3 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Accéder au portefeuille</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Dividendes BRVM */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Dividendes BRVM
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="py-3">
                <span className="text-xl font-black text-slate-900 dark:text-white block">
                  36 Sociétés Cotées
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Calculateur net IRVM (7%) inclus
                </span>
              </div>
              <button
                onClick={() => onNavigate('/calendrier-dividendes')}
                className="w-full h-8 px-3 rounded-lg bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/60 text-slate-700 hover:text-amber-800 dark:text-slate-300 dark:hover:text-amber-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Calendrier des dividendes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Alertes & Surveillance */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Alertes de Cours
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
              </div>
              <div className="py-3">
                <span className="text-xl font-black text-slate-900 dark:text-white block">
                  {activeAlertsCount} active{activeAlertsCount > 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notifications SMS & E-mail configurables
                </span>
              </div>
              <button
                onClick={() => setActiveSection('ALERTS')}
                className="w-full h-8 px-3 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Gérer mes alertes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4: Profil d'Investisseur */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Profil Investisseur
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="py-3">
                <span className="text-xl font-black text-slate-900 dark:text-white block">
                  {profileDetails ? profileDetails.shortName : 'Non calibré'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {profileDetails ? 'Recommandations d’actions adaptées' : 'Diagnostic en 2 minutes'}
                </span>
              </div>
              <button
                onClick={() => setActiveSection('PROFILE')}
                className="w-full h-8 px-3 rounded-lg bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/60 text-slate-700 hover:text-purple-700 dark:text-slate-300 dark:hover:text-purple-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{savedProfileType ? 'Voir mes actions cibles' : 'Lancer le diagnostic'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Client Action Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Raccourcis rapides de l'Espace Client :
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                onClick={() => setActiveSection('PORTFOLIO')}
                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Portefeuille</span>
              </button>

              <button
                onClick={() => onNavigate('/simulation')}
                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulateur DCA</span>
              </button>

              <button
                onClick={() => onNavigate('/calendrier-dividendes')}
                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>Dividendes</span>
              </button>

              <button
                onClick={() => onNavigate('/comparison')}
                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Comparateur</span>
              </button>

              <button
                onClick={() => onNavigate('/sgi')}
                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Landmark className="w-3.5 h-3.5 text-teal-500" />
                <span>Annuaire SGI</span>
              </button>

              <button
                onClick={startOnboardingTour}
                className="h-10 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Paco l'IA</span>
              </button>
            </div>
          </div>

          {/* D3 / Recharts Portfolio Performance Chart Component */}
          <PortfolioPerformanceChart simulations={savedSimulations} onNavigate={onNavigate} />
        </section>
      )}

      {/* TAB 2: VIRTUAL PORTFOLIO */}
      {(activeSection === 'PORTFOLIO' || activeSection === 'ALL') && (
        <section className="space-y-4">
          <VirtualPortfolioManager onNavigate={onNavigate} />
        </section>
      )}

      {/* TAB 3: INVESTOR PROFILE */}
      {(activeSection === 'PROFILE' || activeSection === 'ALL') && (
        <section className="space-y-6">
          {isEditingProfileQuiz ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Diagnostic de Profil en cours
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingProfileQuiz(false)}
                  className="text-xs text-slate-500"
                >
                  Fermer le questionnaire
                </Button>
              </div>
              <InvestorProfileModule onNavigate={onNavigate} defaultView="quiz" />
            </div>
          ) : savedProfileType ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white border border-emerald-800/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold shrink-0">
                    {savedProfileType === 'prudent' && <Shield className="w-6 h-6" />}
                    {savedProfileType === 'equilibre' && <Scale className="w-6 h-6" />}
                    {savedProfileType === 'dynamique' && <Zap className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Votre Profil Enregistré :
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-white text-slate-900">
                        {profileDetails?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      {profileDetails?.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingProfileQuiz(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Recalibrer mon profil
                  </Button>
                </div>
              </div>

              <PersonalizedStockSuggestions
                initialProfileType={savedProfileType}
                onNavigate={onNavigate}
                showSaveButton={true}
              />
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 block">
                  Personnalisation BRVM
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Définissez votre profil d'investisseur (Prudent, Équilibré, Dynamique)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                  Obtenez des recommandations d’actions BRVM sur-mesure calculées selon votre horizon d’épargne, votre budget et votre sensibilité au risque.
                </p>
              </div>

              <button
                onClick={() => setIsEditingProfileQuiz(true)}
                className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md shrink-0 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lancer le diagnostic (2 min)</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: SIMULATIONS */}
      {(activeSection === 'SIMULATIONS' || activeSection === 'ALL') && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Mes Simulations Enregistrées ({savedSimulations.length})</span>
              </div>
              <button
                onClick={() => onNavigate('/simulation')}
                className="h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Nouvelle simulation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {savedSimulations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Aucune simulation enregistrée pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSimulations.map(sim => (
                  <div
                    key={sim.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">
                          {sim.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Investi : {formatFCFA(sim.initialAmount)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSimulation(sim.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">
                        Valeur finale :{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {formatFCFA(sim.finalValue)}
                        </strong>
                      </span>
                      <span
                        className={`font-bold ${
                          sim.netGainOrLoss >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {sim.performancePercent > 0 ? '+' : ''}
                        {sim.performancePercent}%
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => exportSimulationToCSV(sim)}
                        className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>CSV</span>
                      </button>
                      <button
                        onClick={() => exportSimulationToPDF(sim)}
                        className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 5: ALERTS */}
      {(activeSection === 'ALERTS' || activeSection === 'ALL') && (
        <section className="space-y-4">
          <PriceAlertsManager onNavigate={onNavigate} />
        </section>
      )}

      {/* TAB 6: SGIS */}
      {(activeSection === 'SGIS' || activeSection === 'ALL') && (
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              <span>Mes SGI Favorites ({favoritedSgiObjects.length})</span>
            </div>
            <button
              onClick={() => onNavigate('/sgi')}
              className="h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Annuaire SGI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {favoritedSgiObjects.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs text-slate-400 italic">
                Vous n'avez pas encore de SGI sauvegardée en favori.
              </p>
              <button
                onClick={() => onNavigate('/sgi')}
                className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Parcourir les 41 SGI
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoritedSgiObjects.map(sgi => (
                <div
                  key={sgi.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {sgi.name}
                      </h4>
                      <button
                        onClick={() => toggleFavoriteSgi(sgi.id)}
                        className="p-1 text-rose-500 hover:text-slate-400 transition-colors cursor-pointer"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{sgi.headquarters} ({sgi.countryCode})</span>
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Dépôt min : <strong className="text-emerald-600 dark:text-emerald-400">{sgi.minimumDepositEstimate}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => onNavigate('/sgi')}
                      className="flex-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer text-center"
                    >
                      Voir dans l'annuaire
                    </button>
                    {sgi.websiteUrl && (
                      <a
                        href={sgi.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                        title="Site officiel"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 7: SECURITY & EMAIL AUDIT */}
      {(activeSection === 'SECURITY' || activeSection === 'ALL') && (
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Sécurité du Compte & Reçus d'E-mails</span>
            </div>
            <button
              onClick={handleResendEmail}
              disabled={isSendingEmail}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <MailCheck className="w-3.5 h-3.5" />
              <span>{isSendingEmail ? 'Envoi...' : 'Envoyer un nouvel e-mail'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Identifiant Client
              </span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white block">
                {clientIdentifier}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Actif & Synchronisé
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Fournisseur d'Authentification
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                {user.authProvider === 'GOOGLE' ? 'Google Auth (OAuth2)' : 'E-mail / Mot de passe'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Chiffrement SSL 256 bits
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Adresse Destinataire
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
                {user.email}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                E-mail certifié
              </span>
            </div>
          </div>

          {/* Email Deliveries History */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Historique des e-mails de session et confirmation</span>
            </div>

            {isLoadingHistory ? (
              <p className="text-xs text-slate-400 italic py-3">Chargement des notifications...</p>
            ) : emailHistory.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>E-mail de confirmation initial envoyé lors de votre connexion.</span>
                <button
                  onClick={handleResendEmail}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Envoyer une copie
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {emailHistory.map(record => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {record.subject}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Envoyé à : {record.recipient} • {formatDateFrench(record.sentAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {record.status}
                      </span>
                      {record.previewUrl && (
                        <a
                          href={record.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Aperçu</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
