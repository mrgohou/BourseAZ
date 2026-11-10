import React, { useState, useEffect } from 'react';
import {
  Target,
  ArrowRight,
  Shield,
  TrendingUp,
  Zap,
  PieChart,
  RefreshCw,
  CheckCircle2,
  Award,
  Sparkles,
  Save,
  Check,
  UserCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { InvestorProfileType, InvestorProfileData } from '../../types';
import { PersonalizedStockSuggestions } from './PersonalizedStockSuggestions';
import { PROFILE_DEFINITIONS } from '../../services/investor-profile/investorProfileService';

interface Question {
  id: number;
  title: string;
  subtitle: string;
  options: {
    label: string;
    description: string;
    score: number; // 1 = Prudent, 2 = Équilibré, 3 = Dynamique
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "Quel est votre horizon d'investissement ?",
    subtitle: "Pendant combien de temps pouvez-vous immobiliser votre capital sans en avoir besoin ?",
    options: [
      { label: "Court terme (Moins de 1 an)", description: "J'aurai besoin de mon argent très rapidement pour des projets imminents.", score: 1 },
      { label: "Moyen terme (1 à 3 ans)", description: "Je souhaite faire fructifier mon capital à moyen terme.", score: 2 },
      { label: "Long terme (Plus de 5 ans)", description: "Je prépare mon avenir (retraite, patrimoine) et n'ai pas besoin du cash immédiat.", score: 3 },
    ]
  },
  {
    id: 2,
    title: "Quelle est votre réaction face aux fluctuations de marché ?",
    subtitle: "Si la valeur de vos actions baisse de 15% en un mois à la BRVM :",
    options: [
      { label: "Je panique et je revends tout", description: "Je ne supporte pas de voir mon capital diminuer, même temporairement.", score: 1 },
      { label: "J'attends sereinement que le cours remonte", description: "Je comprends que la bourse oscille à court terme.", score: 2 },
      { label: "J'en profite pour racheter plus d'actions à bas prix", description: "C'est une opportunité de solde sur de superbes entreprises.", score: 3 },
    ]
  },
  {
    id: 3,
    title: "Quel est votre objectif financier principal ?",
    subtitle: "Qu'attendez-vous en priorité de vos investissements en Bourse ?",
    options: [
      { label: "Sécurité & Préservation du capital", description: "Gagner un peu plus que l'inflation sans prendre de risques majeurs.", score: 1 },
      { label: "Revenus réguliers (Dividendes)", description: "Percevoir chaque année des dividendes stables et réguliers en cash.", score: 2 },
      { label: "Plus-value maximale (Croissance du capital)", description: "Multiplier mon capital grâce à la hausse des cours sur le long terme.", score: 3 },
    ]
  },
  {
    id: 4,
    title: "Quel est votre niveau d'expérience en Bourse ?",
    subtitle: "Connaissez-vous les marchés financiers de l'UEMOA / BRVM ?",
    options: [
      { label: "Débutant complet", description: "Je découvre la bourse et les notions de SGI, PER ou rendement.", score: 1 },
      { label: "Niveau Intermédiaire", description: "Je comprends le fonctionnement de base et suis l'actualité des entreprises.", score: 2 },
      { label: "Investisseur Expérimenté", description: "J'analyse régulièrement les états financiers et ratios des sociétés cotées.", score: 3 },
    ]
  },
  {
    id: 5,
    title: "Quelle est votre capacité d'épargne mensuelle ?",
    subtitle: "Combien pouvez-vous investir régulièrement chaque mois ?",
    options: [
      { label: "Moins de 50 000 FCFA", description: "Petite épargne régulière pour débuter à mon rythme.", score: 1 },
      { label: "50 000 à 250 000 FCFA", description: "Capacité d'épargne solide et récurrente.", score: 2 },
      { label: "Plus de 250 000 FCFA", description: "Capital important à déployer de manière stratégique.", score: 3 },
    ]
  }
];

interface InvestorProfileModuleProps {
  onNavigate?: (path: string) => void;
  defaultView?: 'quiz' | 'suggestions';
}

export const InvestorProfileModule: React.FC<InvestorProfileModuleProps> = ({
  onNavigate,
  defaultView = 'quiz',
}) => {
  const { user, isAuthenticated, updateInvestorProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    defaultView === 'suggestions' || !!user?.investorProfile
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Calculate profile result
  const totalScore = answers.reduce((a, b) => a + b, 0);
  const avgScore = answers.length > 0 ? totalScore / answers.length : 2;

  let calculatedProfileType: InvestorProfileType = 'equilibre';
  if (avgScore <= 1.6) calculatedProfileType = 'prudent';
  else if (avgScore >= 2.4) calculatedProfileType = 'dynamique';

  // Use user's saved profile if available and not just completing quiz
  const activeProfileType: InvestorProfileType =
    answers.length === QUESTIONS.length
      ? calculatedProfileType
      : user?.investorProfile?.profileType || 'equilibre';

  const handleSelectOption = (score: number) => {
    const nextAnswers = [...answers, score];
    setAnswers(nextAnswers);

    if (currentStep + 1 < QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setIsCompleted(false);
    setSaveSuccess(false);
  };

  const handleSaveToAccount = async () => {
    if (!isAuthenticated || !user) {
      if (onNavigate) onNavigate('/auth');
      return;
    }

    setIsSaving(true);
    try {
      const profileData: InvestorProfileData = {
        profileType: activeProfileType,
        score: avgScore,
        answers,
        monthlyBudget: user.investorProfile?.monthlyBudget || 150000,
        riskTolerance: activeProfileType === 'prudent' ? 'faible' : activeProfileType === 'equilibre' ? 'moderee' : 'elevee',
        horizon: activeProfileType === 'prudent' ? 'court_terme' : activeProfileType === 'equilibre' ? 'moyen_terme' : 'long_terme',
        objective: activeProfileType === 'prudent' ? 'capital_preservation' : activeProfileType === 'equilibre' ? 'dividends' : 'growth',
        updatedAt: new Date().toISOString(),
      };
      await updateInvestorProfile(profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving investor profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-extrabold mb-2">
              <Target className="w-3.5 h-3.5" />
              Diagnostic & Stratégie BRVM
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Simulateur & Profil d’Investisseur BRVM
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Répondez à 5 questions simples pour obtenir votre profil de risque, votre allocation d'actifs et vos suggestions d'actions personnalisées.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user?.investorProfile && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Profil enregistré : {PROFILE_DEFINITIONS[user.investorProfile.profileType]?.shortName}
              </div>
            )}

            {isCompleted && (
              <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0">
                <RefreshCw className="w-4 h-4 mr-1.5" /> Refaire le test
              </Button>
            )}
          </div>
        </div>

        {/* QUIZ IN PROGRESS VIEW */}
        {!isCompleted ? (
          <div className="space-y-8 max-w-3xl mx-auto py-2">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Question {currentStep + 1} sur {QUESTIONS.length}</span>
                <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}% accompli</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question Block */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {QUESTIONS[currentStep].title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {QUESTIONS[currentStep].subtitle}
                </p>
              </div>

              {/* Options List */}
              <div className="grid grid-cols-1 gap-3.5">
                {QUESTIONS[currentStep].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt.score)}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {opt.label}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          {opt.description}
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-600 group-hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* QUIZ RESULT BANNER */
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white shadow-xl space-y-6 border border-emerald-800/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-500/30">
                Diagnostic Validé : Profil {PROFILE_DEFINITIONS[activeProfileType].name}
              </span>

              {isAuthenticated ? (
                <Button
                  size="sm"
                  onClick={handleSaveToAccount}
                  disabled={isSaving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-md"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" /> Profil Sauvegardé !
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" /> Enregistrer dans mon Compte
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate && onNavigate('/auth')}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Se connecter pour enregistrer
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {PROFILE_DEFINITIONS[activeProfileType].tagline}
              </h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-3xl">
                {PROFILE_DEFINITIONS[activeProfileType].description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PERSONALIZED STOCK SUGGESTIONS & BUDGET CALCULATOR */}
      {isCompleted && (
        <PersonalizedStockSuggestions
          initialProfileType={activeProfileType}
          onNavigate={onNavigate}
          showSaveButton={true}
        />
      )}
    </div>
  );
};
