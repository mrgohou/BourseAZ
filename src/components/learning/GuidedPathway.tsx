import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Landmark,
  TrendingUp,
  Calculator,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Lightbulb,
  Award,
  Smartphone,
  Coins,
  BarChart3,
  Search,
  BookOpen,
  Sparkles,
  Zap,
  RotateCcw
} from 'lucide-react';

interface GuidedPathwayProps {
  onNavigate: (path: string) => void;
}

interface StepContent {
  id: number;
  title: string;
  badge: string;
  subtitle: string;
  readTime: string;
  icon: React.ElementType;
  keyPoints: string[];
  explanation: React.ReactNode;
  fcfaExample: {
    title: string;
    details: string;
  };
  checkpointQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  cta?: {
    label: string;
    path: string;
    icon: React.ElementType;
  };
}

export const GuidedPathway: React.FC<GuidedPathwayProps> = ({ onNavigate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [stepId: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<{ [stepId: number]: boolean }>({});

  // Calculator express state for Step 5
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(25000);
  const [expectedYieldPercent, setExpectedYieldPercent] = useState<number>(7.5);
  const [yearsDuration, setYearsDuration] = useState<number>(5);

  const steps: StepContent[] = [
    {
      id: 1,
      title: 'Qu’est-ce que la BRVM ?',
      badge: 'Bases & Principes',
      subtitle: 'Comprendre le fonctionnement du marché financier de l\'UEMOA',
      readTime: '3 min',
      icon: Landmark,
      keyPoints: [
        'Marché financier commun aux 8 pays de l’UEMOA (Côte d\'Ivoire, Sénégal, Burkina, Bénin, Togo, Mali, Niger, Guinée-Bissau)',
        'Plus de 46 sociétés cotées dans 7 secteurs clés (Bancaire, Agroalimentaire, Distribution, Télécoms, Industrie, etc.)',
        'Monnaie unique : le Franc CFA (XOF), éliminant tout risque de change au sein de la zone'
      ],
      explanation: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            La <strong>BRVM (Bourse Régionale des Valeurs Mobilières)</strong> est une bourse entièrement électronique basée à Abidjan. Elle permet aux particuliers et institutions d'investir dans le capital de grandes entreprises régionales comme <strong>Sonatel, Solibra, Ecobank, SGCI, ou Coris Bank</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-slate-900 dark:text-white block text-xs">Indice BRVM 30</strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Regroupe les 30 valeurs les plus liquides du marché.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-slate-900 dark:text-white block text-xs">Indice BRVM Composite</strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Reflète la performance de toutes les sociétés cotées.</span>
              </div>
            </div>
          </div>
        </div>
      ),
      fcfaExample: {
        title: 'Exemple concret d\'action sur la BRVM',
        details: 'Une action Sonatel ou Onatel s\'achète directement à l\'unité en Francs CFA (ex: ~17 500 FCFA l\'action). Vous devenez immédiatement co-propriétaire de l\'entreprise.'
      },
      checkpointQuiz: {
        question: 'Quelle est la monnaie de cotation de toutes les actions sur la BRVM ?',
        options: ['L\'Euro (€)', 'Le Franc CFA (XOF)', 'Le Dollar ($)', 'Le Naira (NGN)'],
        correctIndex: 1,
        explanation: 'Exact ! Toutes les cotations et transactions s\'effectuent en Franc CFA (XOF).'
      },
      cta: {
        label: 'Explorer les entreprises cotées',
        path: '/search',
        icon: Search
      }
    },
    {
      id: 2,
      title: 'Choisir sa SGI (Courtier Agréé)',
      badge: 'Intermédiation',
      subtitle: 'Comment ouvrir un compte-titres et passer par un intermédiaire agréé',
      readTime: '4 min',
      icon: ShieldCheck,
      keyPoints: [
        'L\'accès direct à la Bourse est réservé aux SGI (Sociétés de Gestion et d\'Intermédiation) régulées par l\'AMF-UMOA (ex CREPMF)',
        'Une SGI conserve vos titres en toute sécurité dans votre compte-titres nominatif',
        'La plupart des SGI proposent aujourd\'hui une ouverture de compte en ligne et une application mobile'
      ],
      explanation: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Vous ne pouvez pas acheter directement une action sur le marché sans intermédiaire. Vous devez ouvrir un <strong>compte-titres</strong> auprès d'une SGI (comme BOA Capital Securities, CGF Bourse, NSIA Finance, Coris Bourse, Africabourse, etc.).
          </p>
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-xs uppercase tracking-wider">Critères de choix d'une SGI :</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <li><strong>Frais de courtage :</strong> Généralement entre 0.8% et 1.25% HT par transaction.</li>
              <li><strong>Dépôt minimum :</strong> De 0 FCFA à 100 000 FCFA selon la SGI.</li>
              <li><strong>Plateforme digitale :</strong> Présence d'une application smartphone pour passer vos ordres 24/7.</li>
              <li><strong>Alimentation Mobile Money :</strong> Possibilité de recharger par Orange Money, Wave, MTN ou Moov.</li>
            </ul>
          </div>
        </div>
      ),
      fcfaExample: {
        title: 'Exemple de frais de courtage',
        details: 'Pour un achat d\'actions de 100 000 FCFA, les frais d\'intermédiation s\'élèvent à environ 1 200 FCFA tout compris. Le reste est investi dans vos actions.'
      },
      checkpointQuiz: {
        question: 'Quel est le rôle obligatoire d\'une SGI sur la BRVM ?',
        options: [
          'Garantir des bénéfices à 100% sans risque',
          'Conserver vos titres et exécuter vos ordres d\'achat/vente',
          'Remplacer les banques centrales',
          'Offrir des crédits gratuits'
        ],
        correctIndex: 1,
        explanation: 'Correct ! La SGI est l\'intermédiaire officiel agréé pour exécuter vos ordres et garder vos actions.'
      },
      cta: {
        label: 'Consulter l\'Annuaire des SGI Agréées',
        path: '/sgi',
        icon: Landmark
      }
    },
    {
      id: 3,
      title: 'Passer son 1er Ordre de Bourse',
      badge: 'Pratique & Mécanique',
      subtitle: 'Acheter et vendre une action étape par étape',
      readTime: '4 min',
      icon: Smartphone,
      keyPoints: [
        'Horaires du marché : La séance de cotation en continu se déroule de 09h00 à 15h00 UTC',
        'Types d\'ordres essentiels : "Ordre à cours limité" (prix max fixé) et "Ordre au cours du marché"',
        'Validité des ordres : Journée, à date limite ou jusqu\'à annulation'
      ],
      explanation: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Pour passer un ordre, vous vous connectez sur l'application de votre SGI (ou transmettez une fiche d'ordre). Vous indiquez :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">1. Code Symbole</span>
              <span className="font-black text-slate-900 dark:text-white text-xs">ex: SNTS (Sonatel)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">2. Quantité</span>
              <span className="font-black text-slate-900 dark:text-white text-xs">ex: 10 actions</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">3. Prix Limite</span>
              <span className="font-black text-slate-900 dark:text-white text-xs">ex: 18 000 FCFA max</span>
            </div>
          </div>
          <p>
            Dès qu'un vendeur accepte votre prix dans le <strong>carnet d'ordres</strong>, la transaction est exécutée instantanément.
          </p>
        </div>
      ),
      fcfaExample: {
        title: 'Conseil de sécurité débutant',
        details: 'Utilisez toujours un "Ordre à cours limité". Si une action est cotée 12 500 FCFA, placer un ordre limité à 12 500 FCFA vous protège contre une hausse soudaine au moment de l\'exécution.'
      },
      checkpointQuiz: {
        question: 'Pourquoi privilégier un ordre à cours limité lorsqu\'on débute ?',
        options: [
          'Pour payer le double du prix',
          'Pour fixer un prix d\'achat maximum strict et éviter les mauvaises surprises',
          'Parce que les autres ordres sont interdits',
          'Pour annuler automatiquement son compte'
        ],
        correctIndex: 1,
        explanation: 'Absolument ! L\'ordre à cours limité vous garantit de ne pas acheter au-dessus du montant fixé.'
      },
      cta: {
        label: 'Tester une simulation d\'ordre',
        path: '/simulation',
        icon: Calculator
      }
    },
    {
      id: 4,
      title: 'Dividendes & Plus-values : Comment gagner ?',
      badge: 'Rendement & Fiscalité',
      subtitle: 'Comprendre les deux moteurs de gain en bourse et la fiscalité avantageuse UEMOA',
      readTime: '4 min',
      icon: Coins,
      keyPoints: [
        'Plus-value : Différence positive entre le prix de revente et le prix d\'achat d\'une action',
        'Dividende : Part du bénéfice net redistribuée annuellement aux actionnaires en cash',
        'Avantage fiscal UEMOA : L\'IRVM sur les dividendes d\'actions cotées à la BRVM est retenu à la source (10%), vous ne payez aucun impôt supplémentaire'
      ],
      explanation: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            En Bourse, votre capital fructifie grâce à deux mécanismes complémentaires :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-900 dark:text-amber-300 text-xs">
                <Coins className="w-4 h-4 text-amber-500" /> Le Dividende (Revenu Passif)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Chaque année (souvent entre mai et août), les entreprises rentables versent des dividendes directement sur votre compte SGI.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-300 text-xs">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> La Plus-Value (Croissance)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Si vous achetez une action à 10 000 FCFA et que sa valeur monte à 15 000 FCFA grâce aux bons résultats de la société, vous gagnez 5 000 FCFA de plus-value par action.
              </p>
            </div>
          </div>
        </div>
      ),
      fcfaExample: {
        title: 'Exemple de rendement net',
        details: 'Si une société verse un dividende de 1 000 FCFA par action pour un cours de 12 000 FCFA, votre rendement brut en dividende est de 8.33% net d\'impôt dans votre poche.'
      },
      checkpointQuiz: {
        question: 'Comment appelle-t-on la part de bénéfice versée en espèces aux actionnaires ?',
        options: ['Un agio', 'Un dividende', 'Un intérêt débiteur', 'Une cotisation'],
        correctIndex: 1,
        explanation: 'Bravo ! Le dividende est la part des bénéfices distribuée aux propriétaires des actions.'
      },
      cta: {
        label: 'Analyser le rendement des actions',
        path: '/comparison',
        icon: BarChart3
      }
    },
    {
      id: 5,
      title: 'Simuler & Bâtir sa Stratégie',
      badge: 'Action & Projection',
      subtitle: 'Calculer l\'impact des versements réguliers et des intérêts composés',
      readTime: '3 min',
      icon: Calculator,
      keyPoints: [
        'La régularité bat le timing : Investir un montant fixe chaque mois (DCA - Dollar Cost Averaging) lisse les variations du marché',
        'Réinvestissement des dividendes : Réinjecter vos dividendes accélère la croissance exponentielle de votre portefeuille',
        'Horizon long terme : La bourse récompense la patience et la rigueur d\'investissement'
      ],
      explanation: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Testez directement le pouvoir d'un investissement mensuel régulier sur la BRVM avec notre calculateur express :
          </p>

          {/* Interactive Mini Express Calculator */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-black text-emerald-400 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Simulateur Express Débutant
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                FCFA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Versement Mensuel</label>
                <input
                  type="number"
                  step={5000}
                  min={5000}
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Math.max(5000, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">ex: 25 000 FCFA / mois</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rendement Moyen Annuel</label>
                <select
                  value={expectedYieldPercent}
                  onChange={(e) => setExpectedYieldPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5}>5.0% (Prudent)</option>
                  <option value={7.5}>7.5% (Moyen BRVM)</option>
                  <option value={10}>10.0% (Dynamique)</option>
                  <option value={12}>12.0% (Ambitieux)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Dividendes + Plus-value</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Durée (Années)</label>
                <select
                  value={yearsDuration}
                  onChange={(e) => setYearsDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={3}>3 ans</option>
                  <option value={5}>5 ans</option>
                  <option value={10}>10 ans</option>
                  <option value={15}>15 ans</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Horizon de placement</span>
              </div>
            </div>

            {/* Calculations Result */}
            {(() => {
              const months = yearsDuration * 12;
              const totalInjected = monthlyInvestment * months;
              const monthlyRate = expectedYieldPercent / 100 / 12;
              let futureValue = 0;
              for (let i = 0; i < months; i++) {
                futureValue = (futureValue + monthlyInvestment) * (1 + monthlyRate);
              }
              const estimatedGain = Math.max(0, futureValue - totalInjected);

              return (
                <div className="p-4 rounded-xl bg-slate-800/90 border border-emerald-900/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Capital Épargné</span>
                    <span className="font-extrabold text-sm text-slate-200">
                      {Math.round(totalInjected).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-400 uppercase">Gains Générés</span>
                    <span className="font-extrabold text-sm text-emerald-400">
                      +{Math.round(estimatedGain).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-amber-400 uppercase">Valeur Totale Finale</span>
                    <span className="font-extrabold text-base text-amber-300">
                      {Math.round(futureValue).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ),
      fcfaExample: {
        title: 'Conseil clé du débutant',
        details: 'Commencez avec de petites sommes régulières (ex: 15 000 ou 30 000 FCFA/mois) plutôt qu\'un gros montant unique. Vous apprendrez sereinement sans stress.'
      },
      checkpointQuiz: {
        question: 'Quelle est la stratégie recommandée pour lisser les risques du marché ?',
        options: [
          'Investir toutes ses économies en un seul jour',
          'Investir un montant fixe régulièrement chaque mois (DCA)',
          'Vendre toutes ses actions chaque semaine',
          'Attendre 20 ans sans rien faire'
        ],
        correctIndex: 1,
        explanation: 'Parfait ! Le versement mensuel régulier permet de lisser le cours d\'achat moyen et réduit l\'impact de la volatilité.'
      },
      cta: {
        label: 'Accéder au Simulateur Complet de Portefeuille',
        path: '/simulation',
        icon: Calculator
      }
    }
  ];

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleSelectQuiz = (optIndex: number) => {
    setSelectedQuizAnswers(prev => ({ ...prev, [currentStep.id]: optIndex }));
  };

  const handleValidateQuiz = () => {
    setQuizSubmitted(prev => ({ ...prev, [currentStep.id]: true }));
    const selected = selectedQuizAnswers[currentStep.id];
    if (selected === currentStep.checkpointQuiz.correctIndex) {
      if (!completedSteps.includes(currentStep.id)) {
        setCompletedSteps(prev => [...prev, currentStep.id]);
      }
    }
  };

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const overallProgressPercent = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="space-y-8">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              Parcours Guidé Interactif Débutant
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-emerald-800/80">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Badge Débutant : {completedSteps.length} / {steps.length} étapes validées</span>
            </div>
          </div>

          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Découvrir les bases de la BRVM étape par étape
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Un chemin clair, visuel et pédagogique conçu spécialement pour les nouveaux investisseurs de la zone UEMOA. Validez chaque étape grâce aux explications et quiz pratiques.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="pt-2 max-w-xl">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Progression du parcours : {overallProgressPercent}%</span>
              {overallProgressPercent === 100 && (
                <span className="text-emerald-400 flex items-center gap-1 font-extrabold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Parcours Masterisé !
                </span>
              )}
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-3 overflow-hidden border border-emerald-800/80 p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {steps.map((s, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isCompleted = completedSteps.includes(s.id);
          const IconComponent = s.icon;

          return (
            <button
              key={s.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative ${
                isCurrent
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                  : isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  0{s.id}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                ) : (
                  <IconComponent className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                )}
              </div>

              <div>
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {s.badge}
                </span>
                <span className={`font-extrabold text-xs line-clamp-1 ${isCurrent ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {s.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Step Detail Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Step Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Étape {currentStep.id} sur {steps.length} • {currentStep.badge}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {currentStep.readTime} de lecture
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {currentStep.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          {/* Quick CTA if present */}
          {currentStep.cta && (
            <button
              onClick={() => onNavigate(currentStep.cta!.path)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <currentStep.cta.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{currentStep.cta.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Key Points Bullet Rectangles */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Ce qu'il faut retenir :
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentStep.keyPoints.map((point, pIdx) => (
              <div
                key={pIdx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="pt-2">
          {currentStep.explanation}
        </div>

        {/* FCFA Example Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              {currentStep.fcfaExample.title}
            </h5>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {currentStep.fcfaExample.details}
            </p>
          </div>
        </div>

        {/* Mini Checkpoint Quiz */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Quiz de Validation de l'Étape {currentStep.id}
            </div>

            {isStepCompleted(currentStep.id) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Étape Validée
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {currentStep.checkpointQuiz.question}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentStep.checkpointQuiz.options.map((opt, oIdx) => {
              const selectedAnswer = selectedQuizAnswers[currentStep.id];
              const submitted = quizSubmitted[currentStep.id];

              let optStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400';

              if (selectedAnswer === oIdx) {
                optStyle = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
              }

              if (submitted) {
                if (oIdx === currentStep.checkpointQuiz.correctIndex) {
                  optStyle = 'bg-emerald-100 dark:bg-emerald-900/90 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-extrabold ring-2 ring-emerald-500/30';
                } else if (selectedAnswer === oIdx) {
                  optStyle = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-900 dark:text-rose-200';
                }
              }

              return (
                <button
                  key={oIdx}
                  disabled={submitted}
                  onClick={() => handleSelectQuiz(oIdx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                >
                  <span>{opt}</span>
                  {submitted && oIdx === currentStep.checkpointQuiz.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {!quizSubmitted[currentStep.id] ? (
            <button
              disabled={selectedQuizAnswers[currentStep.id] === undefined}
              onClick={handleValidateQuiz}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedQuizAnswers[currentStep.id] !== undefined
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Valider ma réponse</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed border border-slate-200 dark:border-slate-700">
              <strong className="block text-emerald-700 dark:text-emerald-400 mb-0.5">Explication :</strong>
              {currentStep.checkpointQuiz.explanation}
            </div>
          )}
        </div>

        {/* Footer Stepper Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Étape précédente
          </button>

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <span>Étape suivante ({steps[currentStepIndex + 1].badge})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/simulation')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Parcours Terminé ! Lancer une simulation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
