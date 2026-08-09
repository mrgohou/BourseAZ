import React, { useState, useEffect, useMemo } from 'react';
import { DEMO_COMPANIES } from '../../data/demo-data';
import { Company } from '../../types';
import { CompanyCard } from '../../components/finance/CompanyCard';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { fetchPublicCompanies } from '../../lib/api';
import { Search, Filter, RefreshCw, AlertCircle, Database, Sparkles } from 'lucide-react';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [companies, setCompanies] = useState<Company[]>(DEMO_COMPANIES);
  const [provider, setProvider] = useState<string>('demo');
  const [configError, setConfigError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCompanies = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetchPublicCompanies();
      if (res.configError) {
        setConfigError(res.configError);
      } else if (res.companies && res.companies.length > 0) {
        setCompanies(res.companies);
      }
      if (res.provider) setProvider(res.provider);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadCompanies();
    return () => { mounted = false; };
  }, []);

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
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Rechercher une action BRVM</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explorez le marché des entreprises cotées, consultez les prix et filtrez par secteur d’activité.
        </p>
      </div>

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
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou symbole (ex: Sonatel, SNTS, Banque)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="ALL">Tous les secteurs ({companies.length})</option>
                {sectors.map(sec => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {(query || selectedSector !== 'ALL') && (
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Réinitialiser la recherche"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <span>{filteredCompanies.length} entreprise(s) trouvée(s)</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            Source: <strong className="uppercase text-slate-700 dark:text-slate-300">{provider}</strong>
          </span>
          <button
            onClick={() => loadCompanies(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser les cotes'}
          </button>
        </div>
      </div>

      {/* Skeleton Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-xs">
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
