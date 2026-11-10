import React, { useState, useEffect } from 'react';
import { Company, AuditLog } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  FileCode,
  Lock,
  Users,
  Activity,
  Download,
  Mail,
  Search,
  Filter,
  Calendar,
  Smartphone,
  Laptop,
  Globe,
  Database,
  ExternalLink,
  Send,
  Building2,
  TrendingUp,
  Calculator,
  BarChart3,
  BookOpen,
  Bell,
  FileSpreadsheet,
  MousePointerClick,
  UserCheck
} from 'lucide-react';
import {
  fetchAdminDataReviews,
  approveAdminReviewItem,
  rejectAdminReviewItem,
  submitAdminImport
} from '../../lib/api';
import {
  fetchRegisteredAccounts,
  fetchAnalyticsLogs,
  triggerEmailReport,
  UserAccountRecord,
  AnalyticsEvent
} from '../../services/analytics';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { isAdmin, user, loginEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ANALYTICS' | 'BRVM_DATA'>('USERS');

  // Admin Login state for non-authenticated admin view
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Accounts state
  const [accounts, setAccounts] = useState<UserAccountRecord[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [authFilter, setAuthFilter] = useState<'ALL' | 'EMAIL' | 'GOOGLE' | 'PHONE'>('ALL');
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Analytics state
  const [analyticsLogs, setAnalyticsLogs] = useState<AnalyticsEvent[]>([]);
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Email report state
  const [emailRecipient, setEmailRecipient] = useState(user?.email || 'smileafricawebagency@gmail.com');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // BRVM Import & Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [importContent, setImportContent] = useState('');
  const [filename, setFilename] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

  // Quick Admin Login submit handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setAdminLoginLoading(true);
    try {
      await loginEmail(adminUserId, adminPassword);
    } catch (err: any) {
      setAdminLoginError(err.message || 'Identifiants administrateur incorrects.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoadingAccounts(true);
    setLoadingAnalytics(true);
    setLoadingPipeline(true);

    try {
      const [accs, logs, reviewData] = await Promise.all([
        fetchRegisteredAccounts(),
        fetchAnalyticsLogs(),
        fetchAdminDataReviews(),
      ]);

      setAccounts(accs);
      setAnalyticsLogs(logs);

      if (reviewData && reviewData.success) {
        setReviews(reviewData.data || []);
        if (reviewData.auditLogs) {
          setAuditLogs(reviewData.auditLogs);
        }
      }
    } catch (err) {
      console.warn("Error loading admin data:", err);
    } finally {
      setLoadingAccounts(false);
      setLoadingAnalytics(false);
      setLoadingPipeline(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-10 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Shield className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Connexion Dashboard Admin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Veuillez vous authentifier avec vos identifiants administrateur pour accéder à la console de gestion et ouvrir l'ensemble des fonctionnalités du site.
          </p>
        </div>

        {adminLoginError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
            {adminLoginError}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">User ID / Identifiant Admin</label>
            <input
              type="text"
              required
              value={adminUserId}
              onChange={e => setAdminUserId(e.target.value)}
              placeholder="admin@boursefacile.ci"
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold" disabled={adminLoginLoading}>
            {adminLoginLoading ? 'Connexion en cours...' : 'Se connecter au Dashboard Admin'}
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            ← Retourner sur le site public
          </button>
        </div>
      </div>
    );
  }

  // Export Accounts to CSV
  const handleExportAccountsCSV = () => {
    const headers = ['UID', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Fournisseur Auth', 'Date Création', 'Dernier Accès'];
    const rows = accounts.map(a => [
      a.uid,
      `"${a.displayName.replace(/"/g, '""')}"`,
      a.email,
      a.phone || '',
      a.role,
      a.authProvider,
      a.createdAt,
      a.lastLoginAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `comptes_utilisateurs_brvm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Analytics to CSV
  const handleExportAnalyticsCSV = () => {
    const headers = ['ID', 'Horodatage', 'Utilisateur (Email)', 'Path', 'Titre Page', 'Type Evénement', 'Appareil', 'Détails'];
    const rows = analyticsLogs.map(l => [
      l.id,
      l.timestamp,
      l.userEmail,
      l.path,
      `"${(l.pageTitle || '').replace(/"/g, '""')}"`,
      l.eventType,
      l.deviceType,
      `"${(l.eventDetails || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_navigation_brvm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Email Report
  const handleSendEmailReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipient.trim()) return;

    setSendingEmail(true);
    setEmailStatusMessage(null);

    const result = await triggerEmailReport(emailRecipient.trim(), accounts.length, analyticsLogs.length);
    if (result.success) {
      setEmailStatusMessage({ type: 'success', text: result.message });
    } else {
      setEmailStatusMessage({ type: 'error', text: 'Échec de l\'envoi du rapport par e-mail.' });
    }
    setSendingEmail(false);
  };

  // Filtered Accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.email.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.displayName.toLowerCase().includes(accountSearch.toLowerCase()) ||
      (acc.phone && acc.phone.includes(accountSearch));
    const matchesAuth = authFilter === 'ALL' || acc.authProvider === authFilter;
    return matchesSearch && matchesAuth;
  });

  // Filtered Analytics Logs
  const filteredAnalytics = analyticsLogs.filter(log => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
      log.path.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
      (log.eventDetails && log.eventDetails.toLowerCase().includes(analyticsSearch.toLowerCase()));
    const matchesEvent = eventTypeFilter === 'ALL' || log.eventType === eventTypeFilter;
    return matchesSearch && matchesEvent;
  });

  // BRVM import handlers
  const handleApprove = async (id: string) => {
    const res = await approveAdminReviewItem(id, 'Approuvé par administrateur depuis le dashboard.');
    if (res && res.success) {
      loadDashboardData();
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectAdminReviewItem(id, 'Rejeté par administrateur depuis le dashboard.');
    if (res && res.success) {
      loadDashboardData();
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importContent.trim()) {
      setImportMessage({ type: 'error', text: 'Veuillez saisir ou coller le contenu du fichier officiel BRVM.' });
      return;
    }

    setImportMessage(null);
    const res = await submitAdminImport(importContent, filename || 'bulletin_brvm.csv', format);
    if (res && res.success) {
      setImportMessage({ type: 'success', text: res.message });
      setImportContent('');
      loadDashboardData();
    } else {
      setImportMessage({ type: 'error', text: res?.message || 'Erreur lors de l\'importation du fichier BRVM.' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Quick Site Navigation Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Navigation Site Administrateur</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                Connecté : {user?.email || 'boursefacileapp'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Ouvrez n'importe quelle section du site en mode Administrateur avec accès complet aux fonctionnalités.
            </p>
          </div>
        </div>

        {/* Quick Links to All Site Sections */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => onNavigate('/')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Accueil
          </button>
          <button
            onClick={() => onNavigate('/simulation')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" /> Simulateur DCA
          </button>
          <button
            onClick={() => onNavigate('/comparison')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Comparateur
          </button>
          <button
            onClick={() => onNavigate('/learning')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-purple-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Guide BRVM
          </button>
          <button
            onClick={() => onNavigate('/sgi')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" /> Annuaire SGI
          </button>
          <button
            onClick={() => onNavigate('/alerts')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" /> Alertes
          </button>
        </div>
      </div>

      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            CONSOLE D'ADMINISTRATION & PILOTAGE BRVM
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
            Dashboard Administrateur & Analyste
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
            Gestion centralisée des comptes clients, journal d'utilisation temps réel, analytics de consultation et pipeline officiel d'importation des cours BRVM.
          </p>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-emerald-200 font-bold">Comptes enregistrés :</span>
              <span className="font-black text-white">{accounts.length} utilisateurs</span>
              <span className="text-emerald-300 font-extrabold bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-600/50">
                {analyticsLogs.length} événements tracés
              </span>
            </div>

            <button
              onClick={loadDashboardData}
              disabled={loadingAccounts}
              className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
              <span>{loadingAccounts ? 'Chargement...' : 'Rafraîchir les Données'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Direct Firebase Console Access Banner */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Base de Données Firestore Synchronisée</h4>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
              ID Base : <code className="font-mono font-bold bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded">ai-studio-bourseclair-8beb427d-785b-41cf-b1ba-358589ed533a</code>
            </p>
          </div>
        </div>
        <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 shrink-0">
          <span>Collections actives : <strong>/users</strong>, <strong>/user_analytics</strong></span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-5 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'USERS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Comptes Utilisateurs Créés ({accounts.length})
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-5 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          Journal de Navigation & Télémetrie ({analyticsLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('BRVM_DATA')}
          className={`px-5 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'BRVM_DATA'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Validation & Pipeline BRVM ({reviews.length})
        </button>
      </div>

      {/* ================= TAB 1: USER ACCOUNTS ================= */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>Total Comptes Enregistrés</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{accounts.length}</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Comptes validés dans Firestore</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>Connexions E-mail / Mots de Passe</span>
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {accounts.filter(a => a.authProvider === 'EMAIL').length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Double vérification e-mail</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>Connexions Google OAuth</span>
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {accounts.filter(a => a.authProvider === 'GOOGLE').length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Authentification simplifiée</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>Connexions SMS / Téléphone</span>
                <Smartphone className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {accounts.filter(a => a.authProvider === 'PHONE').length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Codes OTP sécurisés</p>
            </div>
          </div>

          {/* Email Report Form */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  Recevoir le Rapport Synthétique par E-mail
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Exportez la synthèse des comptes clients et l'historique de navigation directement vers votre boîte de réception.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAccountsCSV}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Télécharger CSV (Comptes)
              </button>
            </div>

            {emailStatusMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                emailStatusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {emailStatusMessage.text}
              </div>
            )}

            <form onSubmit={handleSendEmailReport} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={emailRecipient}
                onChange={e => setEmailRecipient(e.target.value)}
                placeholder="smileafricawebagency@gmail.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              />
              <Button type="submit" size="sm" disabled={sendingEmail} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black">
                <Send className="w-4 h-4 mr-1.5" />
                {sendingEmail ? 'Envoi en cours...' : 'Envoyer le Rapport par Email'}
              </Button>
            </form>
          </div>

          {/* Accounts Search & Filter Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Répertoire des Comptes Clients Firestore ({filteredAccounts.length})
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher nom, e-mail, tél..."
                    value={accountSearch}
                    onChange={e => setAccountSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Filter */}
                <select
                  value={authFilter}
                  onChange={e => setAuthFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tous les modes de connexion</option>
                  <option value="EMAIL">E-mail / Mot de passe</option>
                  <option value="GOOGLE">Google OAuth</option>
                  <option value="PHONE">Téléphone / SMS OTP</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Aucun compte utilisateur ne correspond à votre recherche.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Utilisateur / Nom</th>
                      <th className="p-4">Adresse E-mail</th>
                      <th className="p-4">Téléphone</th>
                      <th className="p-4">Méthode Connexion</th>
                      <th className="p-4">Rôle</th>
                      <th className="p-4">Inscrit le</th>
                      <th className="p-4">Dernier Accès</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredAccounts.map(acc => (
                      <tr key={acc.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                              {acc.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-white">{acc.displayName}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">{acc.email}</td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{acc.phone || 'Non renseigné'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1 ${
                            acc.authProvider === 'GOOGLE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : acc.authProvider === 'PHONE'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {acc.authProvider}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            acc.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {acc.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {new Date(acc.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {new Date(acc.lastLoginAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ANALYTICS & USAGE LOGS ================= */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Export Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Journal de Navigation & Interaction Client
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Suivi en temps réel des pages consultées, des simulations générées et des interactions.
              </p>
            </div>

            <button
              onClick={handleExportAnalyticsCSV}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              Télécharger CSV (Journal Complet)
            </button>
          </div>

          {/* Search & Event Filters */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrer par utilisateur, URL, action..."
                  value={analyticsSearch}
                  onChange={e => setAnalyticsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <select
                value={eventTypeFilter}
                onChange={e => setEventTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tous les types d'événements</option>
                <option value="PAGE_VIEW">Vue de Page (PAGE_VIEW)</option>
                <option value="SIGN_UP">Inscription (SIGN_UP)</option>
                <option value="LOGIN">Connexion (LOGIN)</option>
                <option value="SIMULATION_CREATED">Simulation Lancée (SIMULATION_CREATED)</option>
                <option value="SGI_CLICKED">Clic Annuaire SGI (SGI_CLICKED)</option>
                <option value="ALERT_SET">Alerte Définie (ALERT_SET)</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              {filteredAnalytics.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Aucun événement de navigation ne correspond aux critères.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Horodatage</th>
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Action / Evénement</th>
                      <th className="p-4">Page / Path</th>
                      <th className="p-4">Appareil</th>
                      <th className="p-4">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredAnalytics.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-900 dark:text-white font-bold">
                          {log.userName ? `${log.userName} (${log.userEmail})` : log.userEmail}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            log.eventType === 'SIGN_UP'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.eventType === 'SIMULATION_CREATED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : log.eventType === 'SGI_CLICKED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{log.path}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400 text-[11px]">{log.deviceType}</td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">{log.eventDetails}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BRVM DATA & PIPELINE ================= */}
      {activeTab === 'BRVM_DATA' && (
        <div className="space-y-6">
          {/* File Import Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Importer un Fichier Officiel BRVM (CSV / JSON)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Soumettez directement un bulletin de cotation ou un extrait officiel de cours pour le soumettre au pipeline de validation.
            </p>

            {importMessage && (
              <div className={`p-3 rounded-2xl text-xs font-semibold ${
                importMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200'
              }`}>
                {importMessage.text}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du fichier</label>
                  <input
                    type="text"
                    placeholder="bulletin_brvm_2026.csv"
                    value={filename}
                    onChange={e => setFilename(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as 'csv' | 'json')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="csv">CSV (Sémi-colon / Virgule)</option>
                    <option value="json">JSON Officiel BRVM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contenu Brut des Données BRVM</label>
                <textarea
                  rows={4}
                  placeholder="Exemple CSV: symbol;cours;veille;ouverture;plus_haut;plus_bas;volume;date&#10;SNTS;16500;16200;16200;16600;16100;4500;2026-08-08"
                  value={importContent}
                  onChange={e => setImportContent(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <Button type="submit" size="sm">
                <FileCode className="w-4 h-4 mr-1.5" />
                Lancer l'Importation & Analyse Pipeline
              </Button>
            </form>
          </div>

          {/* Pending Reviews Queue Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                File d'Attente de Validation Admin ({reviews.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Seules les données VERIFIED ou PUBLISHED sont visibles du grand public.
              </span>
            </div>

            <div className="overflow-x-auto">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Aucune donnée en attente de validation.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">Type & Symbole</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Donnée Normalisée</th>
                      <th className="p-4">Alertes / Anomalies</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Actions Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {reviews.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block">{item.symbol}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">{item.type}</span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">{item.source}</td>
                        <td className="p-4 font-mono text-[11px] text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {JSON.stringify(item.normalizedData)}
                        </td>
                        <td className="p-4">
                          {item.anomalies && item.anomalies.length > 0 ? (
                            <span className="inline-flex items-center text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                              {item.anomalies.join(', ')}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Aucune anomalie</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.status === 'PUBLISHED' || item.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'PENDING_REVIEW'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {item.status === 'PENDING_REVIEW' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="px-2.5 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rejeter
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Traité par {item.reviewedBy || 'Système'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
