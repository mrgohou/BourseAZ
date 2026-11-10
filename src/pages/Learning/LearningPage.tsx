import React, { useState } from 'react';
import { DEMO_LEARNING_MODULES } from '../../data/demo-data';
import { LearningModule } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { SGIDirectoryModule } from '../../components/learning/SGIDirectoryModule';
import { InteractiveGlossary } from '../../components/learning/InteractiveGlossary';
import { GuidedPathway } from '../../components/learning/GuidedPathway';
import { SmartGlossaryText } from '../../components/common/SmartGlossaryText';
import { BookOpen, CheckCircle, ArrowRight, Award, Calculator, Clock, HelpCircle, Building2, ShieldCheck, Sparkles, Compass, Lightbulb } from 'lucide-react';

interface LearningPageProps {
  onNavigate: (path: string) => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ onNavigate }) => {
  const { learningProgress, completeLearningModule } = useAuth();
  const [activeTab, setActiveTab] = useState<'pathway' | 'modules' | 'glossary' | 'sgi'>('pathway');
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const completedCount = learningProgress.length;
  const progressPercent = Math.round((completedCount / DEMO_LEARNING_MODULES.length) * 100);

  const handleOpenModule = (m: LearningModule) => {
    setSelectedModule(m);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer !== null && selectedModule) {
      setQuizSubmitted(true);
      if (selectedAnswer === selectedModule.content.quizQuestion.correctIndex) {
        completeLearningModule(selectedModule.id);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            ACADEMIE PEDAGOGIQUE & GUIDE BRVM
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
            Apprendre la Bourse pas à pas
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
            Un parcours structuré en 10 modules interactifs pour maîtriser le vocabulaire financier, comprendre les bilans boursiers et faire vos premiers pas en toute confiance.
          </p>

          {/* Overall Progress Bar in Dark Green container */}
          <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 max-w-xl space-y-2 shadow-inner">
            <div className="flex justify-between text-xs font-bold text-emerald-200">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Progression globale : {progressPercent}%
              </span>
              <span className="text-white font-black">{completedCount} / {DEMO_LEARNING_MODULES.length} validés</span>
            </div>
            <div className="w-full bg-emerald-950 rounded-full h-3 overflow-hidden border border-emerald-800">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pedagogical Hint Banner for Interactive Glossary */}
      <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 shadow-xs">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        </div>
        <div className="leading-relaxed">
          <strong className="font-extrabold text-emerald-900 dark:text-emerald-100">Glossaire Interactif Intégré : </strong>
          Tous les termes financiers soulignés en <span className="underline decoration-dashed decoration-emerald-500 font-bold">pointillés</span> affichent une définition simplifiée et sans jargon au survol ou au clic.
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="p-1.5 bg-slate-200/60 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-300/60 dark:border-slate-700/60 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab('pathway')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pathway'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Parcours Guidé Débutant</span>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
            Pas à Pas
          </span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-md ring-1 ring-blue-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Modules & Leçons ({DEMO_LEARNING_MODULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'glossary'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-md ring-1 ring-amber-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Glossaire Boursier</span>
        </button>

        <button
          onClick={() => setActiveTab('sgi')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sgi'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Annuaire SGI</span>
        </button>
      </div>

      {/* PARCOURS GUIDÉ TAB */}
      {activeTab === 'pathway' && (
        <GuidedPathway onNavigate={onNavigate} />
      )}

      {/* INTERACTIVE GLOSSARY TAB */}
      {activeTab === 'glossary' && (
        <InteractiveGlossary />
      )}

      {/* SGI DIRECTORY TAB */}
      {activeTab === 'sgi' && (
        <SGIDirectoryModule onNavigate={onNavigate} />
      )}

      {/* LEARNING MODULES TAB */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_LEARNING_MODULES.map((module, idx) => {
            const isCompleted = learningProgress.includes(module.id);
            return (
              <div
                key={module.id}
                onClick={() => handleOpenModule(module)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between space-y-4 ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                    : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Validé
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {module.durationMinutes} min
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-base">
                    {module.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {module.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                  <span>Commencer la leçon</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Module Modal */}
      {selectedModule && (
        <Modal
          isOpen={!!selectedModule}
          onClose={() => setSelectedModule(null)}
          title={selectedModule.title}
        >
          <div className="space-y-6 text-slate-800">
            {/* Key Takeaway */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-900 dark:text-blue-200">
              💡 À retenir : <SmartGlossaryText text={selectedModule.content.keyTakeaway} onNavigateToGlossary={() => { setSelectedModule(null); setActiveTab('glossary'); }} />
            </div>

            {/* Paragraphs */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {selectedModule.content.fullText.map((p, i) => (
                <p key={i}>
                  <SmartGlossaryText
                    text={p}
                    onNavigateToGlossary={() => {
                      setSelectedModule(null);
                      setActiveTab('glossary');
                    }}
                  />
                </p>
              ))}
            </div>

            {/* Example in FCFA */}
            {selectedModule.content.exampleFcfa && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200 font-semibold space-y-1">
                <span className="font-extrabold block text-amber-900 dark:text-amber-300">Exemple concret en FCFA :</span>
                <div>
                  <SmartGlossaryText
                    text={selectedModule.content.exampleFcfa}
                    onNavigateToGlossary={() => {
                      setSelectedModule(null);
                      setActiveTab('glossary');
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mini Quiz */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <HelpCircle className="w-4 h-4 text-blue-700" />
                Mini-Question de Validation
              </div>

              <p className="text-xs font-semibold text-slate-800">
                {selectedModule.content.quizQuestion.question}
              </p>

              <div className="space-y-2 text-xs">
                {selectedModule.content.quizQuestion.options.map((opt, oIdx) => {
                  let optStyle = 'bg-white border-slate-200 hover:border-slate-300';
                  if (selectedAnswer === oIdx) {
                    optStyle = 'bg-blue-50 border-blue-500 font-bold';
                  }
                  if (quizSubmitted) {
                    if (oIdx === selectedModule.content.quizQuestion.correctIndex) {
                      optStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                    } else if (selectedAnswer === oIdx) {
                      optStyle = 'bg-rose-100 border-rose-500 text-rose-900';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={quizSubmitted}
                      onClick={() => setSelectedAnswer(oIdx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${optStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <Button
                  size="sm"
                  disabled={selectedAnswer === null}
                  onClick={handleQuizSubmit}
                  className="w-full"
                >
                  Valider ma réponse
                </Button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-800 font-medium leading-relaxed">
                  {selectedModule.content.quizQuestion.explanation}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
                Fermer
              </Button>
              <Button size="sm" onClick={() => { setSelectedModule(null); onNavigate('/simulation'); }}>
                <Calculator className="w-4 h-4 mr-1.5" />
                Lancer une simulation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
