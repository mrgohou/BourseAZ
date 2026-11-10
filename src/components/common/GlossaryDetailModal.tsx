import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { GlossaryTermData } from '../../data/glossary-data';
import {
  BookOpen,
  Sparkles,
  Calculator,
  ShieldCheck,
  Volume2,
  CheckCircle2,
  Copy,
  Lightbulb,
  Building2,
  Share2
} from 'lucide-react';

interface GlossaryDetailModalProps {
  term: GlossaryTermData | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGlossary?: () => void;
}

export const GlossaryDetailModal: React.FC<GlossaryDetailModalProps> = ({
  term,
  isOpen,
  onClose,
  onNavigateToGlossary
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  if (!term) return null;

  const handleCopy = () => {
    const text = `${term.term} (${term.categoryLabel})\n\nDéfinition simple : ${term.simplifiedDefinition}\n\nExplication détaillée : ${term.fullExplanation}${term.formula ? `\n\nFormule : ${term.formula}` : ''}${term.example ? `\n\nExemple : ${term.example}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${term.term}. ${term.simplifiedDefinition}`);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={term.term}>
      <div className="space-y-6 text-slate-800 dark:text-slate-200">
        {/* Header Badges & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
              {term.categoryLabel}
            </span>
            {term.abbreviation && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                {term.abbreviation}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {'speechSynthesis' in window && (
              <button
                type="button"
                onClick={handleSpeak}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Écouter la définition"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">{isPlayingAudio ? 'Lecture...' : 'Écouter'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copier la fiche"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Simplified Definition Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Définition Simplifiée (Sans Jargon)
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
            {term.simplifiedDefinition}
          </p>
        </div>

        {/* Full Explanation */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
            Explication Complète & Fonctionnement
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {term.fullExplanation}
          </p>
        </div>

        {/* Formula if exists */}
        {term.formula && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-mono font-bold text-blue-900 dark:text-blue-200 flex items-center gap-3">
            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-sans font-black text-blue-700 dark:text-blue-400 block">Formule mathématique :</span>
              <span>{term.formula}</span>
            </div>
          </div>
        )}

        {/* Example in FCFA */}
        {term.example && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 space-y-1 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-[11px] uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Exemple concret en Francs CFA (XOF)
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {term.example}
            </p>
          </div>
        )}

        {/* BRVM Regional Specificity */}
        {term.brvmContext && (
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-extrabold text-[11px] uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Réalité & Cadre Régional (UEMOA)
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {term.brvmContext}
            </p>
          </div>
        )}

        {/* Beginner Tip */}
        {term.beginnerTip && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 space-y-1">
            <strong className="text-emerald-800 dark:text-emerald-300 font-extrabold uppercase text-[10px] tracking-wider block">
              💡 Conseil Débutant :
            </strong>
            <p className="font-medium">{term.beginnerTip}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>

          {onNavigateToGlossary && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onNavigateToGlossary();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Consulter tout le Glossaire
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
