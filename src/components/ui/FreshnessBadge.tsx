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
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
  };

  if (normKey === 'real_time' || normKey === 'realtime') {
    config = {
      label: 'Temps Réel BRVM',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
    };
  } else if (normKey === 'delayed') {
    config = {
      label: 'Cours Différé (15 min)',
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-300 dark:border-sky-800',
    };
  } else if (normKey === 'end_of_day' || normKey === 'endofday') {
    config = {
      label: 'Fin de Séance',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      text: 'text-indigo-800 dark:text-indigo-300',
      border: 'border-indigo-300 dark:border-indigo-800',
    };
  } else if (normKey === 'historical') {
    config = {
      label: 'Historique Officiel',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-700',
    };
  } else if (normKey === 'manual') {
    config = {
      label: 'Saisie / Fichier Officiel',
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800',
    };
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {config.label}
    </span>
  );
};
