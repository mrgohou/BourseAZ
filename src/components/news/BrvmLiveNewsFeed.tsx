import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Newspaper,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  Clock,
  Building2,
  Coins,
  FileText,
  Rocket,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { openPacoChat } from '../chat/PacoChatModal';

export interface BrvmNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  timeAgo: string;
  category: 'DIVIDENDE' | 'RESULTATS' | 'OFFICIEL' | 'STRATEGIE' | 'MARCHE';
  companySymbol?: string;
  companyName?: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CAUTION';
  tags: string[];
}

interface BrvmLiveNewsFeedProps {
  onNavigate?: (path: string) => void;
  defaultSymbol?: string;
}

export const BrvmLiveNewsFeed: React.FC<BrvmLiveNewsFeedProps> = ({ onNavigate, defaultSymbol }) => {
  const [news, setNews] = useState<BrvmNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState(defaultSymbol || '');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchNews = async (force = false) => {
    try {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);

      const endpoint = force ? '/api/news/refresh' : '/api/news';
      const method = force ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data.items)) {
        setNews(json.data.items);
        setLastUpdated(json.data.lastUpdated || new Date().toISOString());
      }
    } catch (err) {
      console.warn('News fetch fallback:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Filter items based on category and search query
  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      (item.companySymbol && item.companySymbol.toLowerCase().includes(query)) ||
      (item.companyName && item.companyName.toLowerCase().includes(query)) ||
      item.source.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'DIVIDENDE':
        return {
          label: 'Dividende',
          color: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
          icon: Coins,
        };
      case 'RESULTATS':
        return {
          label: 'Résultats',
          color: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
          icon: TrendingUp,
        };
      case 'OFFICIEL':
        return {
          label: 'Officiel',
          color: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30',
          icon: FileText,
        };
      case 'STRATEGIE':
        return {
          label: 'Stratégie',
          color: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30',
          icon: Rocket,
        };
      default:
        return {
          label: 'Marché',
          color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          icon: Newspaper,
        };
    }
  };

  const handleAskPaco = (item: BrvmNewsItem) => {
    const prompt = `Peux-tu m'expliquer et analyser cette annonce concernant ${item.companyName || item.companySymbol || 'la BRVM'} ?\n\n"${item.title}"\n\nQue signifie cette annonce pour un investisseur débutant et quelles peuvent être les retombées sur le cours ou les dividendes ?`;
    openPacoChat(prompt);
  };

  return (
    <section className="bg-white dark:bg-[#0d1712] rounded-[32px] p-6 sm:p-8 border border-slate-200 dark:border-emerald-900/40 shadow-xl space-y-6 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              En Direct • Annonces & Cote BRVM
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Scraping RichBourse, Sika Finance & Alertes Officielles
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            Actualités des Sociétés Cotées
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal max-w-2xl">
            Suivez les derniers résultats financiers, votes de dividendes et communiqués officiels des 45+ entreprises de l'espace UEMOA.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => fetchNews(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Rafraîchir les flux d'actualités"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualisation...' : 'Actualiser en direct'}</span>
          </motion.button>
        </div>
      </div>

      {/* Breaking News Marquee Header Bar */}
      {news.length > 0 && (
        <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 p-2.5 px-4 overflow-hidden flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Flash Marché
          </span>
          <div className="overflow-x-auto no-scrollbar whitespace-nowrap text-xs text-slate-700 dark:text-emerald-200 font-medium">
            <span className="inline-block">
              {news.slice(0, 4).map((item, idx) => (
                <span key={item.id} className="inline-flex items-center mr-6">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 mr-1.5">[{item.companySymbol || 'BRVM'}]</span>
                  <span>{item.title}</span>
                  {idx < 3 && <span className="mx-4 text-emerald-300 dark:text-emerald-700">•</span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar (M3 Assist Chips & Search Pill) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills (NO UGLY SCROLLBAR) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1">
          {[
            { id: 'ALL', label: 'Toutes les annonces' },
            { id: 'DIVIDENDE', label: 'Dividendes', icon: Coins },
            { id: 'RESULTATS', label: 'Résultats', icon: TrendingUp },
            { id: 'OFFICIEL', label: 'Communiqués', icon: FileText },
            { id: 'STRATEGIE', label: 'Stratégie', icon: Rocket },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />}
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer par société (ex: SNTS, Orange, SGBC)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* News Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-5 rounded-[24px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-[28px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <Newspaper className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Aucune annonce trouvée pour ces critères
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Essayez de réinitialiser la recherche ou de sélectionner « Toutes les annonces » pour voir l'ensemble des communiqués de la BRVM.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-500 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <AnimatePresence>
            {filteredNews.map((item) => {
              const badge = getCategoryBadge(item.category);
              const CategoryIcon = badge.icon;
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="p-5 sm:p-6 rounded-[26px] bg-slate-50/80 hover:bg-white dark:bg-[#122019]/80 dark:hover:bg-[#15271f] border border-slate-200/80 dark:border-emerald-900/30 hover:border-emerald-500/50 dark:hover:border-emerald-600/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Card Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.companySymbol ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shadow-xs">
                            {item.companySymbol}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-white font-bold text-[11px]">
                            BRVM
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          <CategoryIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {item.summary}
                    </p>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.source}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Ask Paco Advisor Analysis Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAskPaco(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Demander à Paco de vous expliquer cette annonce"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Analyser avec Paco</span>
                      </motion.button>

                      {/* Official Link */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Lire l'article ou le communiqué source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};
