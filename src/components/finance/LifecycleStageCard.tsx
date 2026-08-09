import React from 'react';
import { CompanyLifecycle } from '../../types';
import { Zap, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

interface LifecycleStageCardProps {
  lifecycle: CompanyLifecycle;
}

export const LifecycleStageCard: React.FC<LifecycleStageCardProps> = ({ lifecycle }) => {
  const configs: Record<
    CompanyLifecycle,
    { title: string; color: string; bg: string; icon: React.FC<{ className?: string }>; description: string }
  > = {
    CROISSANCE: {
      title: 'Phase de Croissance',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      icon: Zap,
      description: 'L’entreprise développe fortement ses ventes et réinvestit la majorité de ses bénéfices. Le cours peut monter vite, mais les dividendes sont généralement modérés.',
    },
    MATURITE: {
      title: 'Phase de Maturité',
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
      icon: ShieldCheck,
      description: 'L’entreprise a une position solide sur son marché UEMOA, génère d’abondants flux de trésorerie et distribue de très réguliers dividendes.',
    },
    DECLIN: {
      title: 'Phase de Déclin ou Restructuration',
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      icon: AlertTriangle,
      description: 'Le secteur évolue défavorablement ou la rentabilité baisse. Prudence nécessaire, analyse approfondie conseillée.',
    },
    INDETERMINE: {
      title: 'Phase Indéterminée',
      color: 'text-slate-700',
      bg: 'bg-slate-50 border-slate-200',
      icon: HelpCircle,
      description: 'Données insuffisantes ou historiques financiers récents en cours de vérification.',
    },
  };

  const config = configs[lifecycle] || configs.INDETERMINE;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <h4 className={`font-bold text-sm ${config.color}`}>{config.title}</h4>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed font-medium">{config.description}</p>
    </div>
  );
};
