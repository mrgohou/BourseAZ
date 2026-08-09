import React, { useState, useEffect } from 'react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { Company, AuditLog, DataAnomaly } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { FreshnessBadge } from '../../components/ui/FreshnessBadge';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Upload, FileCode, Lock } from 'lucide-react';
import { fetchAdminDataReviews, approveAdminReviewItem, rejectAdminReviewItem, submitAdminImport } from '../../lib/api';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [importContent, setImportContent] = useState('');
  const [filename, setFilename] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [anomalies] = useState<DataAnomaly[]>([
    { id: 'an-1', companySymbol: 'TECH_DEMO', metric: 'BPA (EPS)', issue: 'Résultat financier négatif (-280 FCFA). PER désactivé.', severity: 'HIGH', detectedAt: '2026-08-08', resolved: false },
    { id: 'an-2', companySymbol: 'AGROSUD', metric: 'Publication', issue: 'Publication des états financiers en retard de +180 jours.', severity: 'MEDIUM', detectedAt: '2026-08-05', resolved: false },
  ]);

  const loadReviewData = async () => {
    setLoading(true);
    const data = await fetchAdminDataReviews();
    if (data && data.success) {
      setReviews(data.data || []);
      if (data.auditLogs) {
        setAuditLogs(data.auditLogs);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadReviewData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-md">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Accès Administrateur Restreint</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cette section est réservée aux administrateurs autorisés pour la gestion et le contrôle qualité des données financières.
        </p>
        <Button className="w-full" onClick={() => onNavigate('/')}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    const res = await approveAdminReviewItem(id, 'Approuvé par administrateur depuis la console.');
    if (res && res.success) {
      loadReviewData();
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectAdminReviewItem(id, 'Rejeté par administrateur depuis la console.');
    if (res && res.success) {
      loadReviewData();
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
      loadReviewData();
    } else {
      setImportMessage({ type: 'error', text: res?.message || 'Erreur lors de l\'importation du fichier BRVM.' });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Console d'Administration & Validation BRVM</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pipeline de traitement : Récupération → Normalisation → Détection Anomalies → Validation Admin → Publication
          </p>
        </div>

        <Button size="sm" onClick={loadReviewData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir la File
        </Button>
      </div>

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
              Aucune donnée en attente de validation. Les données DEMO par défaut sont actives.
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
                            <CheckCircle className="w-3.5 h-3.5" /> Approuver
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

      {/* Audit Logs */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Journal d’Audit & Historique des Corrections</h3>
        <div className="space-y-2 text-xs font-mono">
          {auditLogs.length === 0 ? (
            <div className="text-slate-400 text-xs">Aucune action enregistrée pour l'instant.</div>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between text-slate-800 dark:text-slate-200">
                <span>[{log.timestamp ? log.timestamp.substring(11, 19) : ''}] {log.action} : {log.details}</span>
                <span className="text-slate-400">{log.actor}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
