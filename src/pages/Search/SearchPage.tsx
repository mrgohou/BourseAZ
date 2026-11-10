import React, { useState, useEffect, useMemo } from 'react';
import { Company } from '../../types';
import { CompanyCard } from '../../components/finance/CompanyCard';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { MarketSyncStatusBar } from '../../components/finance/MarketSyncStatusBar';
import { MarketScannerModal } from '../../components/finance/MarketScannerModal';
import { CompanyReportsModal } from '../../components/finance/CompanyReportsModal';
import { DailyMarketSessionBadge } from '../../components/finance/DailyMarketSessionBadge';
import { useMarketData } from '../../features/market/MarketContext';
import { Search, Filter, RefreshCw, AlertCircle, Database, Sparkles, Activity, FileText, ExternalLink } from 'lucide-react';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const { companies, marketSession, isRefreshing, refreshMarketData } = useMarketData();
  const [configError] = useState<string | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [selectedCompanyForReports, setSelectedCompanyForReports] = useState<Company | null>(null);

  const loadCompanies = (isManual = false) => {
    refreshMarketData(isManual);
  };

  // Extract all unique sectors
  const sectors = useMemo(() => {
    const list = companies.map(c => c.sector);
    return Array.from(new Set(list));
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesQuery =
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.symbol.toLowerCase().includes(query.toLowerCase()) ||
        company.sector.toLowerCase().includes(query.toLowerCase());

      const matchesSector = selectedSector === 'ALL' || company.sector === selectedSector;

      return matchesQuery && matchesSector;
    });
  }, [query, selectedSector, companies]);

  const handleReset = () => {
    setQuery('');
    setSelectedSector('ALL');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Live Market Sync Bar */}
      <MarketSyncStatusBar onOpenAuditModal={() => setIsScannerModalOpen(true)} />

      {/* Daily Market Session Badge */}
      <DailyMarketSessionBadge />

      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            COTE OFFICIELLE & ACTIONS COTÉES BRVM
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
            Cote Officielle & Actions BRVM
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
            Explorez l'ensemble des 46 valeurs cotées de la zone UEMOA, filtrez par secteur d'activité, analysez les PER et consultez les rapports financiers annuels officiels.
          </p>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="text-emerald-200 font-bold">Séance en continu :</span>
              <span className="font-black text-white">{companies.length} titres sous surveillance</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              >
                <Activity className="w-4 h-4 text-emerald-950" />
                <span>Palmarès & Audit BRVM</span>
              </button>

              <a
                href="https://www.brvm.org/fr/rapports-societes-cotees"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-emerald-900/80 hover:bg-emerald-800/90 text-emerald-200 border border-emerald-600/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Rapports BRVM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Error Banner if Provider Not Properly Configured */}
      {configError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-1">
          <div className="font-extrabold flex items-center gap-1.5 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Erreur de Configuration de la Source de Données BRVM
          </div>
          <p>{configError}</p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            Le mode de secours local DEMO reste activé pour assurer la continuité d'utilisation.
          </p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box - M3 Pill Shape */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par symbole, nom (ex: SNTS, Solibra, Palmci)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Sector Select - M3 Pill Shape */}
          <div className="flex items-center gap-2 min-w-[240px]">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Tous les secteurs ({companies.length})</option>
              {sectors.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span>
              <strong>{filteredCompanies.length}</strong> entreprise{filteredCompanies.length > 1 ? 's' : ''} trouvée{filteredCompanies.length > 1 ? 's' : ''}
            </span>
            {(query || selectedSector !== 'ALL') && (
              <button
                onClick={handleReset}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-bold ml-2"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          <button
            onClick={() => loadCompanies(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser les cotes'}
          </button>
        </div>
      </div>

      {/* Skeleton Loading State */}
      {(isRefreshing && companies.length === 0) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aucune entreprise trouvée.</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Nous n’avons trouvé aucun résultat correspondant à la recherche « {query} ».
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button size="sm" variant="outline" onClick={handleReset}>
              Effacer la recherche
            </Button>
            <Button size="sm" onClick={() => onNavigate('/')}>
              Voir les plus populaires
            </Button>
          </div>
        </div>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              onSelect={sym => onNavigate(`/company/${sym}`)}
              onSimulate={sym => onNavigate(`/simulation?symbol=${sym}`)}
              onCompare={sym => onNavigate(`/comparison?symbol=${sym}`)}
              onViewReports={comp => setSelectedCompanyForReports(comp)}
            />
          ))}
        </div>
      )}

      {/* Company Official Reports Modal */}
      <CompanyReportsModal
        isOpen={!!selectedCompanyForReports}
        onClose={() => setSelectedCompanyForReports(null)}
        company={selectedCompanyForReports}
      />

      {/* Market Scanner Modal */}
      <MarketScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
