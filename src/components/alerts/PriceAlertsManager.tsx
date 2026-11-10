import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, NotificationLog } from '../../features/auth/AuthContext';
import { PriceAlert } from '../../types';
import { Button } from '../ui/Button';
import { CreateAlertModal } from './CreateAlertModal';
import { formatFCFA, formatDateFrench } from '../../lib/formatters';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { useMarketData } from '../../features/market/MarketContext';
import {
  Bell,
  BellRing,
  Mail,
  Smartphone,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Send,
  Clock,
  Inbox,
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  Eye,
  Volume2,
  VolumeX,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Radio,
  SlidersHorizontal,
  Check,
  Edit3,
  X,
  Settings
} from 'lucide-react';

interface PriceAlertsManagerProps {
  onNavigate?: (path: string) => void;
  defaultSymbol?: string;
}

export const PriceAlertsManager: React.FC<PriceAlertsManagerProps> = ({ onNavigate, defaultSymbol }) => {
  const {
    priceAlerts,
    deletePriceAlert,
    updatePriceAlert,
    togglePriceAlertActive,
    triggerSimulatedAlert,
    notificationLogs,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotificationLogs,
    user
  } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'NOTIFICATIONS'>('ALERTS');
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD' | 'PUSH' | 'EMAIL'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [simulatedPriceInput, setSimulatedPriceInput] = useState<number>(4500);
  const [selectedAlertForSim, setSelectedAlertForSim] = useState<string>('');
  const [lastWatchdogScan, setLastWatchdogScan] = useState<string>(new Date().toLocaleTimeString('fr-FR'));

  const [testNotificationToast, setTestNotificationToast] = useState<{
    symbol: string;
    type: string;
    message: string;
  } | null>(null);

  // Email Notification configuration state
  const [defaultEmail, setDefaultEmail] = useState<string>(() => {
    return user?.email || localStorage.getItem('bourseclair_default_alert_email') || 'investisseur@bourseclair.ci';
  });
  const [isEditingDefaultEmail, setIsEditingDefaultEmail] = useState(false);
  const [tempDefaultEmail, setTempDefaultEmail] = useState(defaultEmail);

  // Inline alert email editing
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editingAlertEmail, setEditingAlertEmail] = useState<string>('');

  // Initialize and check native browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Request browser push notification permission
  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Votre navigateur ne supporte pas les notifications Web Push.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        playTestChime();
        new Notification("🔔 Bourse Facile - Notifications Activées", {
          body: "Vous recevrez désormais des alertes instantanées dès qu'une action BRVM atteint votre cours cible.",
          icon: '/favicon.ico',
        });
      }
    } catch (err) {
      console.warn("Could not request notification permission:", err);
    }
  };

  // Web Audio chime player
  const playTestChime = () => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch {
      // Audio playback fallback
    }
  };

  // Save default notification email
  const handleSaveDefaultEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempDefaultEmail || !tempDefaultEmail.includes('@')) {
      alert("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    setDefaultEmail(tempDefaultEmail);
    localStorage.setItem('bourseclair_default_alert_email', tempDefaultEmail);
    setIsEditingDefaultEmail(false);
    setTestNotificationToast({
      symbol: 'Configuration E-mail',
      type: 'EMAIL',
      message: `Adresse e-mail par défaut enregistrée : ${tempDefaultEmail}`,
    });
  };

  // Toggle individual alert channel between EMAIL, PUSH, or BOTH
  const handleToggleAlertChannel = (alert: PriceAlert, channel: 'EMAIL' | 'PUSH') => {
    let newType: 'EMAIL' | 'PUSH' | 'BOTH';

    if (channel === 'EMAIL') {
      if (alert.notificationType === 'BOTH') {
        newType = 'PUSH';
      } else if (alert.notificationType === 'EMAIL') {
        newType = 'PUSH';
      } else {
        newType = 'BOTH';
      }
    } else {
      if (alert.notificationType === 'BOTH') {
        newType = 'EMAIL';
      } else if (alert.notificationType === 'PUSH') {
        newType = 'EMAIL';
      } else {
        newType = 'BOTH';
      }
    }

    updatePriceAlert(alert.id, {
      notificationType: newType,
      emailRecipient: alert.emailRecipient || defaultEmail,
    });

    setTestNotificationToast({
      symbol: alert.companySymbol,
      type: newType,
      message:
        newType === 'BOTH'
          ? `Option E-mail activée EN PLUS du Push pour ${alert.companySymbol}`
          : newType === 'EMAIL'
          ? `Option E-mail uniquement activée pour ${alert.companySymbol}`
          : `Option Push Web uniquement activée pour ${alert.companySymbol}`,
    });
  };

  // Save specific alert's email recipient
  const handleSaveAlertEmail = (alertId: string) => {
    if (!editingAlertEmail || !editingAlertEmail.includes('@')) {
      alert("Veuillez entrer une adresse e-mail valide.");
      return;
    }
    updatePriceAlert(alertId, { emailRecipient: editingAlertEmail });
    setEditingAlertId(null);
    setTestNotificationToast({
      symbol: 'Alerte mise à jour',
      type: 'EMAIL',
      message: `Adresse e-mail enregistrée pour cette alerte : ${editingAlertEmail}`,
    });
  };

  // Enable Email on all alerts in addition to push
  const handleEnableEmailOnAll = () => {
    let count = 0;
    priceAlerts.forEach(alert => {
      if (alert.notificationType !== 'BOTH') {
        updatePriceAlert(alert.id, {
          notificationType: 'BOTH',
          emailRecipient: alert.emailRecipient || defaultEmail,
        });
        count++;
      }
    });
    setTestNotificationToast({
      symbol: 'Toutes les alertes',
      type: 'EMAIL',
      message: `Option E-mail activée en complément du Push sur ${count || priceAlerts.length} alertes !`,
    });
  };

  // Send a test email notification
  const handleTestEmailAlert = () => {
    playTestChime();
    const alertToUse = priceAlerts[0];
    if (alertToUse) {
      triggerSimulatedAlert(alertToUse.id, alertToUse.targetPrice);
    }
    setTestNotificationToast({
      symbol: alertToUse?.companySymbol || 'TEST-BRVM',
      type: 'EMAIL',
      message: `Simulation d'envoi d'e-mail réussie vers ${defaultEmail} !`,
    });
  };

  const { companies, marketSession } = useMarketData();

  // Real-time market prices map for quick lookup
  const companyPricesMap = useMemo(() => {
    const list = companies && companies.length > 0 ? companies : DEMO_COMPANIES;
    return new Map<string, number>(list.map(c => [c.symbol, c.currentPrice]));
  }, [companies]);

  // Set default selected alert for test simulation
  useEffect(() => {
    if (priceAlerts.length > 0 && !selectedAlertForSim) {
      setSelectedAlertForSim(priceAlerts[0].id);
      setSimulatedPriceInput(priceAlerts[0].targetPrice);
    }
  }, [priceAlerts, selectedAlertForSim]);

  // Background watchdog simulation to detect price hits
  const runWatchdogScan = () => {
    setLastWatchdogScan(new Date().toLocaleTimeString('fr-FR'));
    let triggeredCount = 0;

    priceAlerts.forEach(alert => {
      if (!alert.active || alert.triggered) return;
      const currentMarketPrice = companyPricesMap.get(alert.companySymbol);
      if (!currentMarketPrice) return;

      const isHit =
        (alert.condition === 'ABOVE' && currentMarketPrice >= alert.targetPrice) ||
        (alert.condition === 'BELOW' && currentMarketPrice <= alert.targetPrice);

      if (isHit) {
        triggerSimulatedAlert(alert.id, currentMarketPrice);
        triggeredCount++;
      }
    });

    if (triggeredCount > 0) {
      setTestNotificationToast({
        symbol: 'SURVEILLANCE BRVM',
        type: 'PUSH',
        message: `${triggeredCount} alerte(s) ont franchi leur cours cible lors de la dernière mise à jour du marché !`,
      });
      setTimeout(() => setTestNotificationToast(null), 5000);
    }
  };

  const handleTriggerTest = (alertId: string, customPrice?: number) => {
    const alert = priceAlerts.find(a => a.id === alertId);
    if (!alert) return;

    const price = customPrice ?? alert.targetPrice;
    const createdLogs = triggerSimulatedAlert(alertId, price);

    setTestNotificationToast({
      symbol: alert.companySymbol,
      type: alert.notificationType,
      message: `Alerte déclenchée avec succès à ${formatFCFA(price)} ! ${createdLogs.length} notification(s) envoyée(s).`,
    });

    setTimeout(() => {
      setTestNotificationToast(null);
    }, 4500);
  };

  // Filtered notification logs
  const filteredLogs = useMemo(() => {
    return notificationLogs.filter(log => {
      // Tab filter
      if (filterType === 'UNREAD' && log.unread === false) return false;
      if (filterType === 'PUSH' && log.type !== 'PUSH') return false;
      if (filterType === 'EMAIL' && log.type !== 'EMAIL') return false;

      // Text search
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        return (
          log.symbol.toLowerCase().includes(query) ||
          log.companyName.toLowerCase().includes(query) ||
          log.subject.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [notificationLogs, filterType, searchFilter]);

  const activeAlertsCount = priceAlerts.filter(a => a.active).length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast feedback banner */}
      {testNotificationToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-2xl flex items-center justify-between gap-4 border border-emerald-400/40 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">
                Notification Déclenchée : {testNotificationToast.symbol}
              </span>
              <p className="text-xs text-emerald-200">{testNotificationToast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setTestNotificationToast(null)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold cursor-pointer shrink-0"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              CENTRE DE NOTIFICATIONS & SURVEILLANCE DES COURS BRVM
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
              Mes Alertes de Cours & Notifications Push
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              Recevez des notifications push instantanées sur votre navigateur et par e-mail dès qu'une action de la BRVM atteint votre cours cible. Surveillance automatisée du marché UEMOA en temps réel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5 text-emerald-950" />
              <span>Nouvelle Alerte de Cours</span>
            </button>
          </div>
        </div>
      </section>

      {/* Options de Réception : Canaux E-mail & Push Navigateur */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Paramètres des Canaux de Réception
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              Option E-mail + Push Navigateur
            </span>
          </div>

          <button
            onClick={handleEnableEmailOnAll}
            className="text-xs font-extrabold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Activer la réception par e-mail en complément du push sur toutes vos alertes actives"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Activer l'option E-mail sur toutes mes alertes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Option E-mail */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center font-black shrink-0">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Notifications par E-mail :
                  </span>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                    Option Disponible & Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recevez un rapport d'opportunité par e-mail avec cours d'exécution et analyse dès qu'un seuil est franchi.
                </p>

                {/* Recipient Address & Quick Edit */}
                <div className="pt-2">
                  {isEditingDefaultEmail ? (
                    <form onSubmit={handleSaveDefaultEmail} className="flex items-center gap-2">
                      <input
                        type="email"
                        required
                        value={tempDefaultEmail}
                        onChange={e => setTempDefaultEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-blue-400 rounded-xl text-slate-900 dark:text-white outline-none flex-1"
                        autoFocus
                      />
                      <Button size="sm" type="submit" className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 font-bold">
                        Enregistrer
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempDefaultEmail(defaultEmail);
                          setIsEditingDefaultEmail(false);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 p-1.5 cursor-pointer"
                      >
                        Annuler
                      </button>
                    </form>
                  ) : (
                    <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-400 font-medium">Destinataire :</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{defaultEmail}</strong>
                      <button
                        onClick={() => {
                          setTempDefaultEmail(defaultEmail);
                          setIsEditingDefaultEmail(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Changer l'adresse e-mail par défaut"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestEmailAlert}
                className="text-xs font-bold text-blue-700 border-blue-300 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-950"
              >
                <Send className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Tester l'envoi d'e-mail d'alerte
              </Button>
            </div>
          </div>

          {/* Card 2: Option Push Navigateur */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                  browserPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                }`}
              >
                {browserPermission === 'granted' ? (
                  <BellRing className="w-6 h-6 animate-pulse" />
                ) : (
                  <Bell className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Notifications Navigateur (Web Push) :
                  </span>
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                      browserPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : browserPermission === 'denied'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                    }`}
                  >
                    {browserPermission === 'granted'
                      ? 'Actives & Autorisées'
                      : browserPermission === 'denied'
                      ? 'Bloquées par le navigateur'
                      : 'En attente d’autorisation'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {browserPermission === 'granted'
                    ? 'Alertes pop-up instantanées sur votre écran même lorsque vous consultez d’autres onglets.'
                    : 'Autorisez les notifications push pour être averti instantanément lors du franchissement de vos cours cibles.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsAudioEnabled(!isAudioEnabled);
                  if (!isAudioEnabled) playTestChime();
                }}
                title={isAudioEnabled ? 'Désactiver le carillon sonore' : 'Activer le carillon sonore'}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {isAudioEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Carillon actif</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span>Son muet</span>
                  </>
                )}
              </button>

              {browserPermission !== 'granted' ? (
                <Button size="sm" onClick={handleRequestPushPermission} className="font-extrabold text-xs">
                  <Bell className="w-4 h-4 mr-1.5" />
                  Activer le Push
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={playTestChime}
                  className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-950"
                >
                  <Zap className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Tester le Carillon
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ALERTS'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Alertes de Cours Actives ({activeAlertsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Historique des Notifications ({notificationLogs.length})</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Watchdog status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Surveillance BRVM synchronisée (Dernier scan : {lastWatchdogScan})</span>
          <button
            onClick={runWatchdogScan}
            title="Rafraîchir et vérifier les cours maintenant"
            className="p-1 hover:text-emerald-600 rounded-md cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: Alertes de Cours Programmées */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-6">
          {/* Quick Simulation / Test Panel */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-amber-400">
                  <SlidersHorizontal className="w-4 h-4" />
                  Simulateur de Déclenchement Instantané
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Testez en direct la réaction du système et la réception de la notification push lorsque le cours atteint votre objectif.
                </p>
              </div>

              {priceAlerts.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedAlertForSim}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedAlertForSim(id);
                      const al = priceAlerts.find(a => a.id === id);
                      if (al) setSimulatedPriceInput(al.targetPrice);
                    }}
                    className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {priceAlerts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.companySymbol} - Seuil {formatFCFA(a.targetPrice)} ({a.condition === 'ABOVE' ? '≥' : '≤'})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-bold">Prix constaté :</span>
                    <input
                      type="number"
                      value={simulatedPriceInput}
                      onChange={e => setSimulatedPriceInput(Number(e.target.value))}
                      className="w-24 bg-transparent text-amber-300 font-mono font-bold text-xs outline-none"
                    />
                    <span className="text-[10px] text-slate-400">FCFA</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleTriggerTest(selectedAlertForSim, simulatedPriceInput)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
                  >
                    <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                    Déclencher l'Alerte
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Alerts Grid */}
          {priceAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Bell className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">Aucune alerte configurée</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Créez une alerte depuis une simulation d'investissement ou choisissez une action de la BRVM pour être averti par e-mail ou push dès que le cours franchit un seuil.
              </p>
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                Créer ma première alerte
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {priceAlerts.map(alert => {
                const currentMarketPrice = companyPricesMap.get(alert.companySymbol) || 0;
                const priceGap = currentMarketPrice - alert.targetPrice;
                const priceGapPercent = alert.targetPrice > 0 ? (priceGap / alert.targetPrice) * 100 : 0;

                return (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                      alert.triggered
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200 dark:ring-amber-800/40'
                        : alert.active
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-black text-slate-900 dark:text-white text-base block">
                            {alert.companySymbol}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {alert.companyName}
                          </span>
                        </div>

                        <div>
                          {alert.triggered ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-amber-600" /> Déclenchée
                            </span>
                          ) : alert.active ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-extrabold text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600" /> Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                              En Pause
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Target Price Box */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                          <span>Seuil Cible</span>
                          <span>Cours BRVM Actuel</span>
                        </div>
                        <div className="flex items-baseline justify-between text-sm font-black text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                            {alert.condition === 'ABOVE' ? (
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-rose-600" />
                            )}
                            {formatFCFA(alert.targetPrice)}
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {currentMarketPrice > 0 ? formatFCFA(currentMarketPrice) : 'En attente'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span>Condition : {alert.condition === 'ABOVE' ? '≥ Supérieur' : '≤ Inférieur'}</span>
                          <span className={priceGap >= 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                            Écart : {priceGap > 0 ? `+${priceGapPercent.toFixed(1)}%` : `${priceGapPercent.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Notification Channels Controls */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Options de Réception :
                          </span>
                          {alert.notificationType === 'BOTH' ? (
                            <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-purple-600" /> E-mail + Push Web
                            </span>
                          ) : alert.notificationType === 'EMAIL' ? (
                            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 text-blue-600" /> E-mail seul
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5 text-emerald-600" /> Push Web seul
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Toggle Email Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleAlertChannel(alert, 'EMAIL')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                              alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-black shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                            title="Cliquer pour activer ou désactiver l'option de notification par E-mail pour cette alerte"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className={`w-3.5 h-3.5 shrink-0 ${alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH' ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className="truncate">E-mail</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                              alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH' ? 'OUI' : 'NON'}
                            </span>
                          </button>

                          {/* Toggle Push Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleAlertChannel(alert, 'PUSH')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                              alert.notificationType === 'PUSH' || alert.notificationType === 'BOTH'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-black shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                            title="Cliquer pour activer ou désactiver la notification Push Navigateur pour cette alerte"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Smartphone className={`w-3.5 h-3.5 shrink-0 ${alert.notificationType === 'PUSH' || alert.notificationType === 'BOTH' ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span className="truncate">Push Web</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                              alert.notificationType === 'PUSH' || alert.notificationType === 'BOTH'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {alert.notificationType === 'PUSH' || alert.notificationType === 'BOTH' ? 'OUI' : 'NON'}
                            </span>
                          </button>
                        </div>

                        {/* Recipient display and quick edit */}
                        {(alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH') && (
                          <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                            {editingAlertId === alert.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="email"
                                  value={editingAlertEmail}
                                  onChange={e => setEditingAlertEmail(e.target.value)}
                                  className="text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg w-full text-slate-900 dark:text-white outline-none"
                                  placeholder="adresse@email.com"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveAlertEmail(alert.id)}
                                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold shrink-0 cursor-pointer"
                                  title="Enregistrer l'adresse e-mail"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingAlertId(null)}
                                  className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 text-xs shrink-0 cursor-pointer"
                                  title="Annuler"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span className="truncate font-mono">{alert.emailRecipient || defaultEmail}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAlertId(alert.id);
                                    setEditingAlertEmail(alert.emailRecipient || defaultEmail);
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold ml-1.5 shrink-0 flex items-center gap-0.5 hover:underline cursor-pointer"
                                  title="Modifier l'adresse e-mail destinataire pour cette alerte"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Modifier</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick combo booster if not BOTH */}
                        {alert.notificationType !== 'BOTH' && (
                          <button
                            type="button"
                            onClick={() => handleToggleAlertChannel(alert, alert.notificationType === 'PUSH' ? 'EMAIL' : 'PUSH')}
                            className="w-full text-center text-[10px] font-extrabold text-purple-700 dark:text-purple-300 hover:bg-purple-100/60 dark:hover:bg-purple-950/60 py-1 rounded-lg border border-dashed border-purple-300 dark:border-purple-800 transition-colors cursor-pointer"
                          >
                            + Activer l'option combinée (E-mail + Push)
                          </button>
                        )}
                      </div>

                      {alert.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                          "{alert.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePriceAlertActive(alert.id)}
                          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {alert.active ? 'Suspendre' : 'Réactiver'}
                        </button>
                        <button
                          onClick={() => deletePriceAlert(alert.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                          title="Supprimer l'alerte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTriggerTest(alert.id, alert.targetPrice)}
                        className="text-xs font-extrabold text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-950"
                      >
                        <Play className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Simuler Déclenchement
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Historique & Centre de Notifications */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Flux des Notifications Envoyées ({filteredLogs.length})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={markAllNotificationsAsRead}
                disabled={unreadNotificationsCount === 0}
                className="text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Tout marquer comme lu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearNotificationLogs}
                disabled={notificationLogs.length === 0}
                className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Vider l'historique
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Toutes ({notificationLogs.length})
              </button>
              <button
                onClick={() => setFilterType('UNREAD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'UNREAD'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Non lues ({unreadNotificationsCount})
              </button>
              <button
                onClick={() => setFilterType('PUSH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'PUSH'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Push Navigateur ({notificationLogs.filter(l => l.type === 'PUSH').length})
              </button>
              <button
                onClick={() => setFilterType('EMAIL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  filterType === 'EMAIL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                E-mails ({notificationLogs.filter(l => l.type === 'EMAIL').length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer par symbole, société..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 italic">
                Aucune notification ne correspond aux critères sélectionnés.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const isUnread = log.unread !== false;

                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      if (isUnread) markNotificationAsRead(log.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                      isUnread
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" title="Non lu" />
                        )}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            log.type === 'EMAIL'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          }`}
                        >
                          {log.type === 'EMAIL' ? 'E-MAIL ENVOYÉ' : 'PUSH NAVIGATEUR'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {log.subject}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                        Destinataire : <strong className="text-slate-800 dark:text-slate-100">{log.recipient}</strong> • Cours constaté : <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatFCFA(log.currentPrice)}</span> (Seuil : {formatFCFA(log.targetPrice)})
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        Horodatage : {formatDateFrench(log.sentAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                          if (isUnread) markNotificationAsRead(log.id);
                        }}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Aperçu du Message
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Log Modal Preview */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                {selectedLog.type === 'EMAIL' ? (
                  <Mail className="w-5 h-5 text-blue-600" />
                ) : (
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                )}
                Aperçu Notification {selectedLog.type === 'EMAIL' ? 'E-mail' : 'Push'}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Sujet / Titre</span>
                <span className="font-black text-slate-900 dark:text-white block">{selectedLog.subject}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Destinataire & Paramètres</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {selectedLog.recipient} • Cours : {formatFCFA(selectedLog.currentPrice)} (Seuil : {formatFCFA(selectedLog.targetPrice)})
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Envoyé le {formatDateFrench(selectedLog.sentAt)}
                </span>
              </div>

              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800">
                {selectedLog.message}
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultSymbol={defaultSymbol}
      />
    </div>
  );
};
