import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { PriceAlertsManager } from '../../components/alerts/PriceAlertsManager';
import { PortfolioPerformanceChart } from '../../components/dashboard/PortfolioPerformanceChart';
import { formatFCFA, formatDateFrench } from '../../lib/formatters';
import { exportSimulationToPDF, exportSimulationToCSV } from '../../lib/export';
import { User, Bookmark, Calculator, BookOpen, LogOut, Shield, Trash2, FileSpreadsheet, FileText, ArrowRight, Bell } from 'lucide-react';

interface AccountPageProps {
  onNavigate: (path: string) => void;
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
    learningProgress,
    isAdmin,
    toggleAdminMode,
  } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-md">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Espace Personnel Reservé</h2>
        <p className="text-xs text-slate-500">
          Veuillez vous connecter pour retrouver vos simulations sauvegardées et votre progression.
        </p>
        <Button className="w-full" onClick={() => onNavigate('/auth')}>
          Se connecter
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{user.name}</h1>
              {isAdmin && (
                <span className="text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-800">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email} • Connecté via {user.authProvider}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAdminMode}>
            <Shield className="w-4 h-4 mr-1 text-purple-700 dark:text-purple-400" />
            {isAdmin ? 'Passer en Mode Utilisateur' : 'Mode Administrateur'}
          </Button>

          <Button variant="ghost" size="sm" onClick={logout} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
            <LogOut className="w-4 h-4 mr-1" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Dynamic Portfolio Performance Chart with Recharts (1Y / 3Y / 5Y) */}
      <PortfolioPerformanceChart simulations={savedSimulations} onNavigate={onNavigate} />

      {/* Saved Simulations */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Calculator className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            Mes Simulations Enregistrées ({savedSimulations.length})
          </div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate('/simulation')}>
            Nouvelle simulation <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {savedSimulations.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">Aucune simulation enregistrée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedSimulations.map(sim => (
              <div key={sim.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{sim.title}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Investi : {formatFCFA(sim.initialAmount)}</span>
                  </div>
                  <button
                    onClick={() => deleteSimulation(sim.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Valeur finale : <strong className="text-slate-900 dark:text-white font-extrabold">{formatFCFA(sim.finalValue)}</strong></span>
                  <span className={`font-extrabold ${sim.netGainOrLoss >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {sim.performancePercent > 0 ? '+' : ''}{sim.performancePercent}%
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => exportSimulationToCSV(sim)} className="text-[11px] h-7 px-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportSimulationToPDF(sim)} className="text-[11px] h-7 px-2">
                    <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Analyses */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Bookmark className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            Mes Analyses Sauvegardées ({savedAnalyses.length})
          </div>
        </div>

        {savedAnalyses.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">Aucune analyse mémorisée.</p>
        ) : (
          <div className="space-y-3">
            {savedAnalyses.map(an => (
              <div key={an.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{an.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Prix capturé : {formatFCFA(an.snapshotPrice)} • {formatDateFrench(an.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onNavigate(`/company/${an.symbol}`)}>
                    Consulter
                  </Button>
                  <button onClick={() => deleteAnalysis(an.id)} className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Alerts Manager */}
      <PriceAlertsManager onNavigate={onNavigate} />
    </div>
  );
};
