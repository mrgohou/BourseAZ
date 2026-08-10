import React from 'react';
import { TrendingUp, Search, Calculator, BookOpen, User } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  const tabs = [
    {
      label: 'Accueil',
      path: '/',
      icon: TrendingUp,
      activeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/80',
    },
    {
      label: 'Rechercher',
      path: '/search',
      icon: Search,
      activeColor: 'text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/80',
    },
    {
      label: 'Simuler',
      path: '/simulation',
      icon: Calculator,
      activeColor: 'text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/80',
    },
    {
      label: 'Apprendre',
      path: '/learning',
      icon: BookOpen,
      activeColor: 'text-purple-600 dark:text-purple-400 bg-purple-100/70 dark:bg-purple-950/80',
    },
    {
      label: 'Profil',
      path: '/account',
      icon: User,
      activeColor: 'text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/80',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden shadow-lg transition-colors px-2 py-1">
      <div className="grid grid-cols-5 h-14 items-center">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              className="flex flex-col items-center justify-center cursor-pointer py-1"
            >
              <div
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? `${tab.activeColor} font-bold scale-105 shadow-2xs`
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
