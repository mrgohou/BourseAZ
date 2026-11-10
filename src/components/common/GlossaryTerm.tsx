import React, { useState, useRef, useEffect } from 'react';
import { GlossaryTermData, getGlossaryTermById, findGlossaryTermByText } from '../../data/glossary-data';
import { GlossaryDetailModal } from './GlossaryDetailModal';
import {
  HelpCircle,
  Sparkles,
  Volume2,
  Copy,
  CheckCircle2,
  BookOpen,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface GlossaryTermProps {
  termId?: string;
  termText?: string;
  children?: React.ReactNode;
  className?: string;
  onNavigateToGlossary?: () => void;
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({
  termId,
  termText,
  children,
  className = '',
  onNavigateToGlossary
}) => {
  const [term, setTerm] = useState<GlossaryTermData | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('top');

  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (termId) {
      setTerm(getGlossaryTermById(termId));
    } else if (termText) {
      setTerm(findGlossaryTermByText(termText));
    } else if (typeof children === 'string') {
      setTerm(findGlossaryTermByText(children));
    }
  }, [termId, termText, children]);

  // Handle outside click to close popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsHovered(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsHovered(false);
      }
    };

    if (isOpen || isHovered) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isHovered]);

  // Calculate popover positioning relative to viewport
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // If trigger is in the upper 320px of the screen, place popover below
      if (rect.top < 320) {
        setPopoverPosition('bottom');
      } else {
        setPopoverPosition('top');
      }
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePosition();
    setIsOpen(!isOpen);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!term) return;
    navigator.clipboard.writeText(`${term.term} : ${term.simplifiedDefinition}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!term || !('speechSynthesis' in window)) return;
    
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
  };

  // If term not found in dictionary, just render children as plain text
  if (!term) {
    return <span className={className}>{children || termText || termId}</span>;
  }

  const isVisible = isOpen || isHovered;

  return (
    <>
      <span className="relative inline-block">
        <span
          ref={triggerRef}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={isVisible}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick(e as any);
            }
          }}
          className={`group cursor-pointer inline-flex items-baseline gap-0.5 border-b-2 border-dashed border-emerald-500/70 dark:border-emerald-400/70 text-emerald-900 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/60 font-semibold px-0.5 rounded transition-all duration-150 ${className}`}
          title={`Cliquez ou survolez pour voir la définition simplifiée de : ${term.term}`}
        >
          <span>{children || term.abbreviation || term.term}</span>
          <Sparkles className="w-2.5 h-2.5 text-emerald-500/70 dark:text-emerald-400/70 group-hover:scale-125 transition-transform inline-block self-center ml-0.5 shrink-0" />
        </span>

        {/* Floating Definition Popover */}
        {isVisible && (
          <div
            ref={popoverRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`fixed sm:absolute z-50 w-[92vw] max-w-sm sm:w-80 p-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
              // Mobile centering vs Desktop positioning
              popoverPosition === 'top'
                ? 'bottom-24 left-1/2 -translate-x-1/2 sm:bottom-full sm:mb-2 sm:translate-x-0 sm:left-1/2 sm:-translate-x-1/2'
                : 'top-24 left-1/2 -translate-x-1/2 sm:top-full sm:mt-2 sm:translate-x-0 sm:left-1/2 sm:-translate-x-1/2'
            }`}
          >
            {/* Popover Header */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {term.categoryLabel}
                  </span>
                  {term.abbreviation && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      ({term.abbreviation})
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight pt-1">
                  {term.term}
                </h4>
              </div>

              <div className="flex items-center gap-1">
                {'speechSynthesis' in window && (
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isPlayingAudio
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Écouter la définition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Copier la définition"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors sm:hidden"
                  title="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simplified Jargon-Free Definition */}
            <div className="py-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Définition Sans Jargon :
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                {term.simplifiedDefinition}
              </p>
            </div>

            {/* Practical Example or Formula Preview if present */}
            {term.example && (
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium pb-2 line-clamp-2">
                <strong className="text-slate-800 dark:text-slate-200">Exemple : </strong>
                {term.example}
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsHovered(false);
                  setShowFullModal(true);
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Voir la fiche complète</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </span>

      {/* Full Detailed Modal */}
      {showFullModal && (
        <GlossaryDetailModal
          term={term}
          isOpen={showFullModal}
          onClose={() => setShowFullModal(false)}
          onNavigateToGlossary={onNavigateToGlossary}
        />
      )}
    </>
  );
};
