import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, GlossaryTermData } from '../../data/glossary-data';
import {
  Search,
  BookOpen,
  Bookmark,
  Sparkles,
  HelpCircle,
  Tag,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Volume2,
  Lightbulb,
  Building2,
  ArrowRight,
  Calculator
} from 'lucide-react';

export const InteractiveGlossary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('brvm');
  const [savedTerms, setSavedTerms] = useState<string[]>(['brvm', 'sgi', 'dividende', 'per']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Flashcard mode toggle
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  // Alphabet letter list
  const alphabet = ['ALL', ...Array.from(new Set(GLOSSARY_TERMS.map(t => t.term.charAt(0).toUpperCase()))).sort()];

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(t => {
      // Search text match
      const matchText =
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.simplifiedDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.abbreviation && t.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.fullExplanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.aliases.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category match
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;

      // Letter match
      const matchLetter = selectedLetter === 'ALL' || t.term.charAt(0).toUpperCase() === selectedLetter;

      return matchText && matchCat && matchLetter;
    });
  }, [searchTerm, selectedCategory, selectedLetter]);

  const toggleSaveTerm = (id: string) => {
    if (savedTerms.includes(id)) {
      setSavedTerms(savedTerms.filter(t => t !== id));
    } else {
      setSavedTerms([...savedTerms, id]);
    }
  };

  const copyToClipboard = (term: GlossaryTermData) => {
    const text = `${term.term}: ${term.simplifiedDefinition}\n\n${term.fullExplanation}${term.formula ? `\n\nFormule: ${term.formula}` : ''}${term.example ? `\n\nExemple: ${term.example}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakTerm = (term: GlossaryTermData) => {
    if ('speechSynthesis' in window) {
      if (playingAudioId === term.id) {
        window.speechSynthesis.cancel();
        setPlayingAudioId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${term.term}. ${term.simplifiedDefinition}`);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.95;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      setPlayingAudioId(term.id);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Flashcard controls
  const currentQuizTerm = GLOSSARY_TERMS[quizIndex % GLOSSARY_TERMS.length];

  const handleNextQuiz = () => {
    setShowQuizAnswer(false);
    setQuizIndex(prev => prev + 1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Glossary Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 border border-emerald-500/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            Glossaire & Dictionnaire Interactif BRVM
          </div>

          <button
            onClick={() => {
              setQuizMode(!quizMode);
              setShowQuizAnswer(false);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-[0.97] transition-all cursor-pointer border border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
            <span>{quizMode ? 'Quitter le Mode Flashcards' : '⚡ Mode Entraînement Flashcards'}</span>
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Le Dictionnaire Boursier Simplifié & Sans Jargon
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
          Tous les termes financiers de la BRVM expliqués avec des mots simples de la vie courante. Survolez ou cliquez sur les termes soulignés dans tout le site pour afficher leur définition instantanée.
        </p>
      </div>

      {/* FLASHCARD REVISION MODE */}
      {quizMode ? (
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Flashcard {quizIndex + 1} / {GLOSSARY_TERMS.length}</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold">
              {currentQuizTerm.categoryLabel}
            </span>
          </div>

          <div className="py-6 space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {currentQuizTerm.term}
            </h3>
            {currentQuizTerm.abbreviation && (
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                {currentQuizTerm.abbreviation}
              </span>
            )}

            {showQuizAnswer ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-left space-y-4 animate-fade-in border border-slate-200 dark:border-slate-700">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase block">
                    💡 Définition Sans Jargon :
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentQuizTerm.simplifiedDefinition}
                  </p>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {currentQuizTerm.fullExplanation}
                </p>

                {currentQuizTerm.formula && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-xs font-mono font-bold text-blue-800 dark:text-blue-300">
                    Formule : {currentQuizTerm.formula}
                  </div>
                )}
                {currentQuizTerm.example && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 font-medium">
                    <strong>Exemple : </strong> {currentQuizTerm.example}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8">
                <Button
                  onClick={() => setShowQuizAnswer(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Révéler la Définition Simple
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setShowQuizAnswer(false);
                setQuizIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={quizIndex === 0}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
            >
              ← Terme Précédent
            </button>

            <button
              onClick={() => setQuizMode(false)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              Passer au Mode Dictionnaire
            </button>

            <Button
              size="sm"
              onClick={handleNextQuiz}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs"
            >
              Terme Suivant <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      ) : (
        /* REGULAR DIRECTORY MODE */
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Bar */}
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un terme (ex: PER, SGI, Dividende, IRVM, Flottant)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="md:col-span-5">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {GLOSSARY_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alphabetical Quick Jump Bar */}
            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 self-center mr-2">
                Index :
              </span>
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    selectedLetter === letter
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
            <span>{filteredTerms.length} terme(s) dans le glossaire</span>
            {savedTerms.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {savedTerms.length} terme(s) favoris
              </span>
            )}
          </div>

          {/* Terms Grid */}
          <div className="space-y-4">
            {filteredTerms.length === 0 ? (
              <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                  Aucun terme ne correspond à votre recherche
                </h4>
                <p className="text-xs text-slate-500">
                  Essayez de réinitialiser vos filtres ou de chercher un autre mot-clé.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLetter('ALL');
                  }}
                  className="text-xs font-bold"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              filteredTerms.map(term => {
                const isExpanded = expandedId === term.id;
                const isSaved = savedTerms.includes(term.id);
                const isAudioPlaying = playingAudioId === term.id;

                return (
                  <div
                    key={term.id}
                    className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 shadow-xs'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : term.id)}
                      className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {term.term}
                          </h3>
                          <span className="px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
                            {term.categoryLabel}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 font-bold leading-relaxed bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                          💡 {term.simplifiedDefinition}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {'speechSynthesis' in window && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              speakTerm(term);
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                              isAudioPlaying
                                ? 'bg-emerald-600 text-white animate-pulse'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="Écouter la définition"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleSaveTerm(term.id);
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            isSaved
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isSaved ? 'Retirer des favoris' : 'Sauvegarder en favoris'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            copyToClipboard(term);
                          }}
                          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          title="Copier la fiche"
                        >
                          {copiedId === term.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <div className="p-1.5 text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Expandable Body */}
                    {isExpanded && (
                      <div className="px-5 pb-6 sm:px-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {term.fullExplanation}
                        </div>

                        {/* Formula if applicable */}
                        {term.formula && (
                          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm text-blue-900 dark:text-blue-200 font-mono font-bold flex items-center gap-2.5">
                            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>Formule : {term.formula}</span>
                          </div>
                        )}

                        {/* Example */}
                        {term.example && (
                          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 space-y-1">
                            <strong className="text-amber-900 dark:text-amber-300 font-extrabold uppercase text-[10px] tracking-wider block">
                              Exemple Chiffré Concret :
                            </strong>
                            <p className="font-medium">{term.example}</p>
                          </div>
                        )}

                        {/* BRVM Specific Context */}
                        {term.brvmContext && (
                          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 space-y-1">
                            <strong className="text-indigo-900 dark:text-indigo-300 font-extrabold uppercase text-[10px] tracking-wider block">
                              Spécificité Marché BRVM & UEMOA :
                            </strong>
                            <p className="font-medium italic">{term.brvmContext}</p>
                          </div>
                        )}

                        {/* Beginner Tip */}
                        {term.beginnerTip && (
                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 space-y-1">
                            <strong className="text-emerald-800 dark:text-emerald-300 font-extrabold uppercase text-[10px] tracking-wider block">
                              💡 Conseil Pratique :
                            </strong>
                            <p className="font-medium">{term.beginnerTip}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
