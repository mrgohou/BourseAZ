import React from 'react';
import { DataFreshness } from '../../types';

interface FreshnessBadgeProps {
  freshness: DataFreshness;
  className?: string;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ freshness, className = '' }) => {
  const normKey = (String(freshness || 'demo')).toLowerCase();

  let config = {
    label: 'Données DEMO',
    bg: 'bg-amber-50 dark:bg-amber-950/70',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-400 dark:border-amber-600',
  };

  if (normKey === 'real_time' || normKey === 'realtime') {
    config = {
      label: 'Temps Réel BRVM',
      bg: 'bg-emerald-50 dark:bg-emerald-950/70',
      text: 'text-emerald-900 dark:text-emerald-200',
      border: 'border-emerald-400 dark:border-emerald-600',
    };
  } else if (normKey === 'delayed') {
    config = {
      label: 'Cours Différé (15 min)',
      bg: 'bg-sky-50 dark:bg-sky-950/70',
      text: 'text-sky-900 dark:text-sky-200',
      border: 'border-sky-400 dark:border-sky-600',
    };
  } else if (normKey === 'end_of_day' || normKey === 'endofday') {
    config = {
      label: 'Fin de Séance',
      bg: 'bg-indigo-50 dark:bg-indigo-950/70',
      text: 'text-indigo-900 dark:text-indigo-200',
      border: 'border-indigo-400 dark:border-indigo-600',
    };
  } else if (normKey === 'historical') {
    config = {
      label: 'Historique Officiel',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-900 dark:text-slate-100',
      border: 'border-slate-400 dark:border-slate-600',
    };
  } else if (normKey === 'manual') {
    config = {
      label: 'Saisie / Fichier Officiel',
      bg: 'bg-purple-50 dark:bg-purple-950/70',
      text: 'text-purple-900 dark:text-purple-200',
      border: 'border-purple-400 dark:border-purple-600',
    };
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg} ${config.text} ${config.border} shadow-2xs ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse shrink-0" />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
