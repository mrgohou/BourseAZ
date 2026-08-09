import React from 'react';
import { TrendingUp, Search, Calculator, BookOpen, User } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  const tabs = [
    { label: 'Accueil', path: '/', icon: TrendingUp },
    { label: 'Rechercher', path: '/search', icon: Search },
    { label: 'Simuler', path: '/simulation', icon: Calculator },
    { label: 'Apprendre', path: '/learning', icon: BookOpen },
    { label: 'Profil', path: '/account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden shadow-lg transition-colors">
      <div className="grid grid-cols-5 h-16">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
