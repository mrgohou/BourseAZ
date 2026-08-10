import React, { useState } from 'react';
import { TrendingUp, Search, BookOpen, Calculator, BarChart3, User, Shield, LogOut, Menu, X, Sparkles, Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { Button } from '../ui/Button';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, isAdmin, logout, toggleAdminMode, priceAlerts } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeAlertsCount = priceAlerts.filter(a => a.active).length;

  const navLinks = [
    {
      label: 'Accueil',
      path: '/',
      icon: TrendingUp,
      activeClass: 'bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-800/80 shadow-2xs font-bold',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      hoverClass: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300',
    },
    {
      label: 'Comparer',
      path: '/comparison',
      icon: BarChart3,
      activeClass: 'bg-indigo-100/90 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-200 border-indigo-300/80 dark:border-indigo-800/80 shadow-2xs font-bold',
      iconClass: 'text-indigo-600 dark:text-indigo-400',
      hoverClass: 'hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 hover:text-indigo-800 dark:hover:text-indigo-300',
    },
    {
      label: 'Simuler',
      path: '/simulation',
      icon: Calculator,
      activeClass: 'bg-amber-100/90 dark:bg-amber-950/90 text-amber-950 dark:text-amber-200 border-amber-300/80 dark:border-amber-800/80 shadow-2xs font-bold',
      iconClass: 'text-amber-600 dark:text-amber-400',
      hoverClass: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300',
    },
    {
      label: 'Apprendre',
      path: '/learning',
      icon: BookOpen,
      activeClass: 'bg-purple-100/90 dark:bg-purple-950/90 text-purple-950 dark:text-purple-200 border-purple-300/80 dark:border-purple-800/80 shadow-2xs font-bold',
      iconClass: 'text-purple-600 dark:text-purple-400',
      hoverClass: 'hover:bg-purple-50/80 dark:hover:bg-purple-950/40 hover:text-purple-800 dark:hover:text-purple-300',
    },
    {
      label: 'Rechercher',
      path: '/search',
      icon: Search,
      activeClass: 'bg-sky-100/90 dark:bg-sky-950/90 text-sky-950 dark:text-sky-200 border-sky-300/80 dark:border-sky-800/80 shadow-2xs font-bold',
      iconClass: 'text-sky-600 dark:text-sky-400',
      hoverClass: 'hover:bg-sky-50/80 dark:hover:bg-sky-950/40 hover:text-sky-800 dark:hover:text-sky-300',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200/60 dark:shadow-none group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Bourse Facile
            </span>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 -mt-0.5">
              Savoir Investir
            </span>
          </div>
        </div>

        {/* Search Input (Desktop) - Sleek Pill Design */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative flex-1 max-w-xs mx-4">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher une action (ex: SNTS, Solibra)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100/90 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-white border border-transparent focus:border-emerald-500 rounded-full outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </form>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer relative border ${
                  isActive
                    ? link.activeClass
                    : `border-transparent text-slate-500 dark:text-slate-400 ${link.hoverClass}`
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? link.iconClass : 'text-slate-400 dark:text-slate-500'}`} />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Global Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label="Changer le thème"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('/admin')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors cursor-pointer shadow-xs"
            >
              Console Admin
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/account')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="max-w-[100px] truncate">{user?.name}</span>
              </button>
              <button
                onClick={logout}
                title="Déconnexion"
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button size="sm" onClick={() => onNavigate('/auth')}>
              Se connecter
            </Button>
          )}
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            aria-label="Changer le thème"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher une action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </form>

          <div className="space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    onNavigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors border ${
                    isActive
                      ? link.activeClass
                      : `border-transparent text-slate-700 dark:text-slate-200 ${link.hoverClass}`
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? link.iconClass : 'text-slate-400 dark:text-slate-500'}`} />
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {isAuthenticated ? (
              <Button size="sm" variant="ghost" onClick={() => onNavigate('/account')}>
                Mon Compte
              </Button>
            ) : (
              <Button size="sm" onClick={() => onNavigate('/auth')}>
                Connexion
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
