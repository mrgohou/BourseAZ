import React, { useState } from 'react';
import { useAuth, NotificationLog } from '../../features/auth/AuthContext';
import { PriceAlert } from '../../types';
import { Button } from '../ui/Button';
import { CreateAlertModal } from './CreateAlertModal';
import { formatFCFA, formatDateFrench } from '../../lib/formatters';
import {
  Bell,
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
  Eye
} from 'lucide-react';

interface PriceAlertsManagerProps {
  onNavigate?: (path: string) => void;
  defaultSymbol?: string;
}

export const PriceAlertsManager: React.FC<PriceAlertsManagerProps> = ({ onNavigate, defaultSymbol }) => {
  const {
    priceAlerts,
    deletePriceAlert,
    togglePriceAlertActive,
    triggerSimulatedAlert,
    notificationLogs,
    user
  } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [testNotificationToast, setTestNotificationToast] = useState<{
    symbol: string;
    type: string;
    message: string;
  } | null>(null);

  const handleTestAlert = (alertId: string) => {
    const alert = priceAlerts.find(a => a.id === alertId);
    if (!alert) return;

    const createdLogs = triggerSimulatedAlert(alertId, alert.targetPrice);

    setTestNotificationToast({
      symbol: alert.companySymbol,
      type: alert.notificationType,
      message: `Alerte déclenchée avec succès ! ${createdLogs.length} notification(s) [E-mail & Push] générée(s).`,
    });

    setTimeout(() => {
      setTestNotificationToast(null);
    }, 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast feedback banner */}
      {testNotificationToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex items-center justify-between gap-4 border border-blue-400/40 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">
                Notification Push & E-mail Test pour {testNotificationToast.symbol}
              </span>
              <p className="text-xs text-blue-200">{testNotificationToast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setTestNotificationToast(null)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-500/30">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Surveillance Automatique des Cours BRVM
            </div>
            <h2 className="text-xl sm:text-3xl font-black">
              Mes Alertes de Cours & Notifications
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Définissez des seuils cibles après vos simulations pour ne jamais rater une opportunité d'achat à bon compte ou un franchissement d'objectif de plus-value. Recevez un e-mail et une notification push en temps réel.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            Nouvelle Alerte de Cours
          </Button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Alertes de Cours Programmées ({priceAlerts.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gérez vos seuils d'alerte et simulez leur déclenchement.
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter une alerte
          </Button>
        </div>

        {priceAlerts.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Bell className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">Aucune alerte configurée</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Créez une alerte depuis une simulation d'investissement ou choisissez une action de la BRVM pour être averti par e-mail ou push dès que le cours franchit un seuil.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              Créer ma première alerte
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priceAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                  alert.triggered
                    ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
                    : alert.active
                    ? 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 text-base">
                      {alert.companySymbol} - {alert.companyName}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {alert.triggered ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-amber-600" /> Déclenchée
                        </span>
                      ) : alert.active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px]">
                          En Pause
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Target Price Details */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Seuil de Déclenchement Cible
                    </span>
                    <div className="flex items-baseline justify-between text-sm font-black text-slate-900">
                      <span className="flex items-center gap-1.5 text-blue-900">
                        {alert.condition === 'ABOVE' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                        )}
                        {formatFCFA(alert.targetPrice)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Condition : {alert.condition === 'ABOVE' ? '≥ (Supérieur)' : '≤ (Inférieur)'}
                      </span>
                    </div>
                  </div>

                  {/* Notification Channel & Recipient */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1">
                      {alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200">
                          <Mail className="w-3 h-3 text-blue-600" /> {alert.emailRecipient || 'E-mail'}
                        </span>
                      ) : null}

                      {alert.notificationType === 'PUSH' || alert.notificationType === 'BOTH' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <Smartphone className="w-3 h-3 text-emerald-600" /> Push Web
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {alert.notes && (
                    <p className="text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100">
                      "{alert.notes}"
                    </p>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePriceAlertActive(alert.id)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      {alert.active ? 'Suspendre' : 'Réactiver'}
                    </button>

                    <button
                      onClick={() => deletePriceAlert(alert.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Supprimer l'alerte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestAlert(alert.id)}
                    className="text-xs font-extrabold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    <Play className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    Simuler Envoi Notification
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispatched Notification Logs Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <Inbox className="w-5 h-5 text-blue-700" />
            Historique des Notifications Déclenchées ({notificationLogs.length})
          </div>
        </div>

        {notificationLogs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            Aucune notification n'a encore été générée. Utilisez le bouton "Simuler Envoi Notification" pour tester la réception d'e-mails et d'alertes push.
          </p>
        ) : (
          <div className="space-y-3">
            {notificationLogs.map(log => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        log.type === 'EMAIL'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.type === 'EMAIL' ? 'E-MAIL ENVOYÉ' : 'PUSH MOBILE / WEB'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{log.subject}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">
                    Destinataire : <strong className="text-slate-800">{log.recipient}</strong> • Cours constaté : {formatFCFA(log.currentPrice)}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Horodatage : {formatDateFrench(log.sentAt)}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLog(log)}
                  className="shrink-0 text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Aperçu du Message
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Modal Preview */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                {selectedLog.type === 'EMAIL' ? (
                  <Mail className="w-5 h-5 text-blue-600" />
                ) : (
                  <Smartphone className="w-5 h-5 text-emerald-600" />)}
                Notification {selectedLog.type === 'EMAIL' ? 'E-mail' : 'Push'}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Sujet / Titre</span>
                <span className="font-black text-slate-900 block">{selectedLog.subject}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Destinataire</span>
                <span className="font-bold text-slate-800">{selectedLog.recipient}</span>
              </div>

              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
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
