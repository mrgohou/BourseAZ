import React, { useState } from 'react';
import { CompanyReport, getReportsForSymbol, OFFICIAL_BRVM_REPORTS_PORTAL } from '../../data/reports-data';
import { Company } from '../../types';
import {
  FileText,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  BookOpen,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface CompanyReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export const CompanyReportsModal: React.FC<CompanyReportsModalProps> = ({
  isOpen,
  onClose,
  company,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen || !company) return null;

  const reports = getReportsForSymbol(company.symbol);

  const filteredReports = reports.filter(r => {
    if (filterType === 'ALL') return true;
    return r.period === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-sky-200 dark:border-sky-800 shadow-2xl overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/20 text-sky-100 text-xs font-black uppercase tracking-wider w-fit border border-sky-300/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Portail Officiel BRVM
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Rapports d'Activités & États Financiers
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1">
            Société cotée : <span className="font-extrabold text-white">{company.name} ({company.symbol})</span> • {company.sector}
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-sky-50 dark:bg-sky-950/50 border-b border-sky-100 dark:border-sky-900 flex items-start justify-between gap-3 text-xs text-sky-900 dark:text-sky-200">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-slate-900 dark:text-white">Documents Officiels Référencés sur la BRVM</span>
              Retrouvez l'intégralité des publications financières, rapports de gestion et avis déposés conformément à la réglementation AMF-UMOA.
            </div>
          </div>
          <a
            href={OFFICIAL_BRVM_REPORTS_PORTAL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition-colors"
          >
            <span>Portail Global BRVM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-4 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="flex gap-2 pb-3">
            {[
              { id: 'ALL', label: 'Tous les rapports' },
              { id: 'ANNUEL', label: 'Rapports Annuels' },
              { id: 'SEMESTRIEL', label: 'Semestriels S1' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 pb-3 font-medium">
            {filteredReports.length} document(s)
          </span>
        </div>

        {/* Reports List */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-3">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Aucun rapport pour ce filtre</p>
              <p className="text-xs text-slate-500 mt-1">Consultez l'ensemble des publications sur le site officiel de la BRVM.</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <div
                key={report.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-extrabold text-[10px] uppercase tracking-wider">
                      {report.documentType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                      Exercice {report.year}
                    </span>
                    {report.fileSize && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        PDF • {report.fileSize}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {report.title}
                  </h4>

                  {report.highlights && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      💡 {report.highlights}
                    </p>
                  )}

                  <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                    <Calendar className="w-3 h-3" />
                    Publié le {new Date(report.datePublished).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-500 hover:bg-amber-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Consulter</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Lien officiel direct : <strong className="text-slate-700 dark:text-slate-300">brvm.org/fr/rapports-societes-cotees</strong>
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};
