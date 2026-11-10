import React from 'react';
import { TrendingUp, Search, Calculator, BookOpen, User } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const tabs = [
    {
      label: 'Accueil',
      path: '/',
      icon: TrendingUp,
    },
    {
      label: 'Rechercher',
      path: '/search',
      icon: Search,
    },
    {
      label: 'Simuler',
      path: '/simulation',
      icon: Calculator,
    },
    {
      label: 'Apprendre',
      path: '/learning',
      icon: BookOpen,
    },
    {
      label: isAuthenticated ? 'Espace Client' : 'Connexion',
      path: isAuthenticated ? '/espace-client' : '/auth',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 lg:hidden shadow-lg transition-colors px-2 py-2">
      <div className="grid grid-cols-5 h-16 items-center max-w-md mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isClientTab = tab.path === '/espace-client' || tab.path === '/account';
          const isActive = isClientTab
            ? currentPath.startsWith('/espace-client') || currentPath.startsWith('/account') || currentPath.startsWith('/client')
            : currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              className="flex flex-col items-center justify-center cursor-pointer py-1 group"
            >
              <div
                className={`flex items-center justify-center px-3.5 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] font-semibold tracking-tight mt-1 transition-colors ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

