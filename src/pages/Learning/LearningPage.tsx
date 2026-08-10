import React, { useState } from 'react';
import { DEMO_LEARNING_MODULES } from '../../data/demo-data';
import { LearningModule } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { SGIDirectoryModule } from '../../components/learning/SGIDirectoryModule';
import { InteractiveGlossary } from '../../components/learning/InteractiveGlossary';
import { GuidedPathway } from '../../components/learning/GuidedPathway';
import { BookOpen, CheckCircle, ArrowRight, Award, Calculator, Clock, HelpCircle, Building2, ShieldCheck, Sparkles, Compass } from 'lucide-react';

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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800 text-blue-200 text-xs font-bold border border-blue-700">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Académie Pédagogique BRVM
        </div>

        <h1 className="text-2xl sm:text-4xl font-black">Apprendre la Bourse pas à pas</h1>
        <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
          Un parcours structuré en 10 modules courts pour maîtriser le vocabulaire financier, comprendre les bilans et faire vos premiers pas en toute confiance.
        </p>

        {/* Overall Progress Bar */}
        <div className="pt-2 max-w-xl">
          <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
            <span>Progression globale : {progressPercent} %</span>
            <span>{completedCount} / {DEMO_LEARNING_MODULES.length} modules validés</span>
          </div>
          <div className="w-full bg-blue-950 rounded-full h-3 overflow-hidden border border-blue-800">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-3 sm:gap-6">
        <button
          onClick={() => setActiveTab('pathway')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'pathway'
              ? 'border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Parcours Guidé Débutant
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
            Pas à Pas
          </span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'modules'
              ? 'border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Modules & Leçons ({DEMO_LEARNING_MODULES.length})
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'glossary'
              ? 'border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Glossaire Boursier
        </button>

        <button
          onClick={() => setActiveTab('sgi')}
          className={`pb-3 text-sm font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'sgi'
              ? 'border-blue-700 text-blue-700 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Annuaire SGI
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
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
              💡 À retenir : {selectedModule.content.keyTakeaway}
            </div>

            {/* Paragraphs */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {selectedModule.content.fullText.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Example in FCFA */}
            {selectedModule.content.exampleFcfa && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-semibold space-y-1">
                <span className="font-extrabold block text-amber-900">Exemple concret en FCFA :</span>
                <div>{selectedModule.content.exampleFcfa}</div>
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
