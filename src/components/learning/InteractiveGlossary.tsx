import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
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
  RotateCcw,
  Award,
  Layers,
  ArrowRight,
  Calculator
} from 'lucide-react';

export interface GlossaryTerm {
  id: string;
  term: string;
  abbreviation?: string;
  category: 'ratios' | 'market' | 'instruments' | 'regulation' | 'analysis';
  categoryLabel: string;
  shortDefinition: string;
  fullExplanation: string;
  formula?: string;
  example?: string;
  brvmContext?: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'per',
    term: 'PER (Price Earnings Ratio)',
    abbreviation: 'PER / P/E',
    category: 'ratios',
    categoryLabel: 'Ratios & Valorisation',
    shortDefinition: 'Ratio comparant le cours en bourse d’une action au bénéfice net par action (BPA).',
    fullExplanation: 'Le PER indique combien de fois les investisseurs sont prêts à payer le bénéfice annuel d’une entreprise. Un PER élevé peut signifier que l’action est chère ou que le marché anticipe une très forte croissance future. À l’inverse, un PER bas (ex: < 8) peut indiquer une opportunité sous-évaluée ou des risques perçus.',
    formula: 'PER = Cours de l’action / Bénéfice Par Action (BPA)',
    example: 'Si l’action Sonatel coté à 18 000 FCFA dégage un BPA de 1 800 FCFA, son PER est de 18 000 / 1 800 = 10x.',
    brvmContext: 'Le PER moyen de la BRVM oscille historiquement entre 9x et 14x selon la conjoncture macroéconomique UMOA.'
  },
  {
    id: 'bpa',
    term: 'BPA (Bénéfice Par Action)',
    abbreviation: 'BPA / EPS',
    category: 'ratios',
    categoryLabel: 'Ratios & Valorisation',
    shortDefinition: 'La part du résultat net d’une entreprise attribuée à chaque action émise.',
    fullExplanation: 'Le BPA mesure la rentabilité intrinsèque d’une société pour chaque titre détenu. Un BPA en croissance régulière sur 3 à 5 ans témoigne d’une entreprise solide capable de faire croître ses profits.',
    formula: 'BPA = Bénéfice Net Total / Nombre Total d’Actions en circulation',
    example: 'Si Ecobank CI réalise 40 milliards FCFA de bénéfice net avec 80 millions d’actions, le BPA est de 500 FCFA.',
    brvmContext: 'Publié dans les états financiers annuels et semestriels visés par la BRVM.'
  },
  {
    id: 'rendement-dividende',
    term: 'Rendement du Dividende',
    abbreviation: 'Dividend Yield',
    category: 'ratios',
    categoryLabel: 'Ratios & Valorisation',
    shortDefinition: 'Pourcentage de retour en cash annuel apporté par le dividende par rapport au prix d’achat.',
    fullExplanation: 'Le rendement du dividende mesure le revenu passif en dividende brut ou net perçu par rapport au cours actuel de l’action. La BRVM est mondialement connue pour offrir parmi les plus forts rendements au monde (souvent 7% à 10%).',
    formula: 'Rendement (%) = (Dividende Net par Action / Cours de l’Action) × 100',
    example: 'Si une action coûte 5 000 FCFA et verse 400 FCFA de dividende, son rendement est de 8%.',
    brvmContext: 'En zone UMOA, la taxe sur les revenus de capitaux mobiliers (IRVM) est généralement retenue à la source (entre 10% et 15% selon le pays).'
  },
  {
    id: 'sgi',
    term: 'SGI (Société de Gestion et d’Intermédiation)',
    abbreviation: 'SGI',
    category: 'market',
    categoryLabel: 'Marché & Trading BRVM',
    shortDefinition: 'Courtier ou intermédiaire financier agréé obligatoire pour acheter et vendre des titres à la BRVM.',
    fullExplanation: 'Toute personne physique ou morale souhaitant investir à la BRVM doit obligatoirement ouvrir un compte-titres auprès d’une SGI agréée par l’AMF-UMOA (ex-CREPMF). La SGI conserve les titres, exécute les ordres de bourse et verse les dividendes.',
    example: 'Exemples de SGI : BOA Capital Securities, CGF Bourse, BICI Bourse, Coris Bourse, SGI Togo, etc.',
    brvmContext: 'Il existe plus de 30 SGI agréées réparties dans les 8 pays de l’UEMOA.'
  },
  {
    id: 'crepmf',
    term: 'AMF-UMOA (ex-CREPMF)',
    abbreviation: 'AMF-UMOA',
    category: 'regulation',
    categoryLabel: 'Régulation & Rôle Institutionnel',
    shortDefinition: 'L’Autorité des Marchés Financiers de l’UMOA, gendarme et régulateur officiel du marché.',
    fullExplanation: 'Organisme sous-régional chargé de veiller à la protection de l’épargne investie en valeurs mobilières, de délivrer les agréments aux SGI et d’autoriser les appels publics à l’épargne (introductions en bourse et émissions obligataires).',
    brvmContext: 'Basé à Abidjan (Côte d’Ivoire), le régulateur a été renommé AMF-UMOA en 2022.'
  },
  {
    id: 'dcbr',
    term: 'DC/BR (Dépositaire Central / Banque de Règlement)',
    abbreviation: 'DC/BR',
    category: 'regulation',
    categoryLabel: 'Régulation & Rôle Institutionnel',
    shortDefinition: 'Institution centrale assurant la conservation des titres et le règlement-livraison des espèces.',
    fullExplanation: 'Le DC/BR garantit que lorsqu’un ordre d’achat est exécuté, les titres sont immédiatement transférés au compte de l’acheteur et l’argent au vendeur dans le respect des délais (cycle T+2 à la BRVM).',
    brvmContext: 'Organisme central indispensable au bon fonctionnement et à la sécurité des transactions UEMOA.'
  },
  {
    id: 'capitalisation-boursiere',
    term: 'Capitalisation Boursière',
    abbreviation: 'Market Cap',
    category: 'ratios',
    categoryLabel: 'Ratios & Valorisation',
    shortDefinition: 'Valeur marchande totale de l’ensemble des actions d’une entreprise cotée.',
    fullExplanation: 'Elle permet d’évaluer la taille relative d’une société sur la place boursière. Les entreprises à forte capitalisation (Large Cap) comme Sonatel pèsent lourdement dans le calcul de l’indice BRVM Composite.',
    formula: 'Capitalisation = Nombre Total d’Actions × Cours de l’Action',
    example: 'Sonatel avec 100 millions d’actions à 18 000 FCFA = 1 800 milliards FCFA de capitalisation.',
    brvmContext: 'La capitalisation globale du marché actions BRVM dépasse les 9 000 milliards FCFA.'
  },
  {
    id: 'flottant',
    term: 'Flottant (Free Float)',
    abbreviation: 'Flottant',
    category: 'analysis',
    categoryLabel: 'Analyse & Stratégie',
    shortDefinition: 'Part du capital d’une société cotée effectivement disponible à l’achat pour le grand public.',
    fullExplanation: 'Le flottant exclut les parts détenues par les actionnaires de référence (États, fondateurs, maisons mères). Un flottant trop faible (> 10%) signifie que peu d’actions s’échangent, rendant le titre peu liquide.',
    brvmContext: 'L’AMF-UMOA exige généralement au moins 20% de flottant lors d’une introduction en bourse (IPO).'
  },
  {
    id: 'carnet-ordres',
    term: 'Carnet d’Ordres',
    abbreviation: 'Order Book',
    category: 'market',
    categoryLabel: 'Marché & Trading BRVM',
    shortDefinition: 'Tableau récapitulant l’ensemble des intentions d’achat (demande) et de vente (offre) sur une action.',
    fullExplanation: 'Le carnet d’ordres affiche les quantités demandées ou offertes à différents niveaux de prix. Il permet d’évaluer la liquidité instantanée et la pression acheteuse ou vendeuse sur le titre.',
    brvmContext: 'À la BRVM, les ordres sont confrontés lors de séances de cotation en continu ou par fixing.'
  },
  {
    id: 'fixing',
    term: 'Fixing / Cotation en Continu',
    abbreviation: 'Fixing',
    category: 'market',
    categoryLabel: 'Marché & Trading BRVM',
    shortDefinition: 'Mode de confrontation des ordres de bourse pour déterminer le prix d’équilibre.',
    fullExplanation: 'Pendant le fixing, le système informatique accumule les ordres puis calcule à heure fixe le cours qui permet d’échanger le plus grand nombre de titres. En cotation en continu, chaque nouvel ordre compatible s’exécute immédiatement.',
    brvmContext: 'La BRVM fonctionne en cotation en continu de 09h00 à 15h00 GMT.'
  },
  {
    id: 'obligation',
    term: 'Obligation / Titre de Créance',
    abbreviation: 'Obligation',
    category: 'instruments',
    categoryLabel: 'Instruments Financiers',
    shortDefinition: 'Titre de dette émis par un État ou une entreprise, versant un intérêt fixe (coupon) régulier.',
    fullExplanation: 'En achetant une obligation, vous prêtez de l’argent à l’émetteur (ex: État de Côte d’Ivoire, TPO Sénégal) pendant une durée définie (ex: 5 à 10 ans). Vous recevez chaque année un coupon garanti et êtes remboursé du capital à l’échéance.',
    example: 'TPCI 5.90% 2021-2031 : obligation d’État versant 5.90% d’intérêt annuel.',
    brvmContext: 'Le marché obligataire de la BRVM est extrêmement actif, offrant une grande sécurité aux investisseurs prudents.'
  },
  {
    id: 'sukuk',
    term: 'Sukuk (Obligation Islamique)',
    abbreviation: 'Sukuk',
    category: 'instruments',
    categoryLabel: 'Instruments Financiers',
    shortDefinition: 'Certificat d’investissement conforme aux principes de la finance islamique (sans intérêt usurain).',
    fullExplanation: 'Au lieu de percevoir un intérêt fixe (prohibé en finance islamique), le souscripteur d’un Sukuk possède une part d’un actif tangible sous-jacent et perçoit une quote-part des loyers ou profits générés par cet actif.',
    brvmContext: 'Plusieurs États de l’UEMOA (Sénégal, Côte d’Ivoire, Mali, Togo) ont émis des Sukuks cotés à la BRVM.'
  },
  {
    id: 'split',
    term: 'Split / Fractionnement d’Actions',
    abbreviation: 'Split',
    category: 'market',
    categoryLabel: 'Marché & Trading BRVM',
    shortDefinition: 'Division de la valeur nominale d’une action pour réduire son cours et la rendre plus accessible.',
    fullExplanation: 'Lors d’un split (ex: 1 pour 10), une action valant 50 000 FCFA est remplacée par 10 nouvelles actions valant 5 000 FCFA chacune. La valeur totale détenue par l’investisseur ne change pas, mais le titre devient beaucoup plus abordable.',
    example: 'Sonatel et Solibra ont déjà réalisé des splits majeurs pour dynamiser la liquidité de leurs titres à la BRVM.',
    brvmContext: 'Accroît fortement le nombre de petits porteurs individuels en zone UMOA.'
  },
  {
    id: 'dps',
    term: 'DPS (Droit Préférentiel de Souscription)',
    abbreviation: 'DPS',
    category: 'analysis',
    categoryLabel: 'Analyse & Stratégie',
    shortDefinition: 'Droit détaché lors d’une augmentation de capital donnant priorité aux actionnaires existants.',
    fullExplanation: 'Le DPS permet aux anciens actionnaires de souscrire de nouvelles actions à un prix préférentiel avant le public, évitant ainsi la dilution de leur pourcentage de capital.',
    brvmContext: 'Les DPS sont cotés séparément sur la BRVM pendant la durée de l’opération financière.'
  },
  {
    id: 'roe',
    term: 'ROE (Return on Equity)',
    abbreviation: 'ROE',
    category: 'ratios',
    categoryLabel: 'Ratios & Valorisation',
    shortDefinition: 'Rentabilité des capitaux propres engagés par les actionnaires.',
    fullExplanation: 'Indique l’efficacité avec laquelle la direction utilise l’argent apporté par les propriétaires pour générer des bénéfices. Un ROE supérieur à 15% caractérise une entreprise très performante.',
    formula: 'ROE (%) = (Bénéfice Net / Capitaux Propres) × 100',
    example: 'Une banque avec 100 milliards de capitaux propres dégageant 20 milliards de bénéfice a un ROE de 20%.',
    brvmContext: 'Le secteur bancaire BRVM affiche régulièrement des ROE élevés supérieurs à 18%.'
  },
  {
    id: 'pbr',
    term: 'PBR (Price-to-Book Ratio)',
    abbreviation: 'PBR / P/B',
    category: 'ratios',
    categoryLabel: 'Ratios & Valorisation',
    shortDefinition: 'Ratio entre la valeur de marché d’une action et sa valeur comptable par action.',
    fullExplanation: 'Le PBR (ou Price Book Value) compare le cours boursier de l’entreprise aux fonds propres comptables apportés par les actionnaires (Actif Net). Un PBR inférieur à 1,0 signifie que l’action se négocie en-dessous de la valeur brute de ses actifs comptables (décote d’actif). Un PBR élevé (> 2,5) traduit des attentes fortes du marché.',
    formula: 'PBR = Cours de l’action / Valeur comptable par action (Actif Net par Action)',
    example: 'Une action cotant 7 200 FCFA avec un actif net comptable de 4 645 FCFA par action a un PBR de 1,55x.',
    brvmContext: 'Plusieurs valeurs financières à la BRVM se négocient proches de leur valeur comptable (PBR proche de 1,0x à 1,5x).'
  },
  {
    id: 'indices-brvm',
    term: 'Indice BRVM Composite & BRVM 30',
    abbreviation: 'BRVM-C / BRVM-30',
    category: 'market',
    categoryLabel: 'Marché & Trading BRVM',
    shortDefinition: 'Baromètres mesurant l’évolution globale des cours du marché boursier régional.',
    fullExplanation: 'Le BRVM Composite regroupe l’ensemble des sociétés cotées. Le BRVM 30 regroupe les 30 valeurs les plus échangeables et liquides du marché.',
    brvmContext: 'Publiés quotidiennement à l’issue de la séance de cotation par la BRVM.'
  }
];

export const InteractiveGlossary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('per');
  const [savedTerms, setSavedTerms] = useState<string[]>(['per', 'rendement-dividende']);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flashcard mode toggle
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  // Category filter list
  const categories = [
    { id: 'all', label: 'Toutes les catégories' },
    { id: 'ratios', label: 'Ratios & Valorisation' },
    { id: 'market', label: 'Marché & Trading BRVM' },
    { id: 'instruments', label: 'Instruments Financiers' },
    { id: 'regulation', label: 'Régulation & Cadre' },
    { id: 'analysis', label: 'Analyse & Stratégies' },
  ];

  // Alphabet letter list
  const alphabet = ['ALL', ...Array.from(new Set(GLOSSARY_TERMS.map(t => t.term.charAt(0).toUpperCase()))).sort()];

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(t => {
      // Search text match
      const matchText =
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.shortDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.abbreviation && t.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.fullExplanation.toLowerCase().includes(searchTerm.toLowerCase());

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

  const copyToClipboard = (term: GlossaryTerm) => {
    const text = `${term.term}: ${term.shortDefinition}\n\n${term.fullExplanation}${term.formula ? `\n\nFormule: ${term.formula}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-4 border border-indigo-800/40">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            Dictionnaire Financier BRVM
          </div>

          <button
            onClick={() => {
              setQuizMode(!quizMode);
              setShowQuizAnswer(false);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            {quizMode ? 'Quitter le Mode Flashcards' : 'Mode Révision Flashcards'}
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black">
          Glossaire Boursier & Financier Interactif
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
          Maîtrisez les concepts clés de la Bourse Régionale des Valeurs Mobilières. Recherchez une notion, visualisez les formules et entraînez-vous grâce au mode flashcards.
        </p>
      </div>

      {/* FLASHCARD REVISION MODE */}
      {quizMode ? (
        <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Flashcard {quizIndex + 1} / {GLOSSARY_TERMS.length}</span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
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
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-left space-y-3 animate-fade-in border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {currentQuizTerm.fullExplanation}
                </p>
                {currentQuizTerm.formula && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    💡 Formule : {currentQuizTerm.formula}
                  </div>
                )}
                {currentQuizTerm.brvmContext && (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold italic">
                    Contexte BRVM : {currentQuizTerm.brvmContext}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8">
                <Button
                  onClick={() => setShowQuizAnswer(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-6"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Révéler la Définition & la Formule
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setShowQuizAnswer(false);
                setQuizIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={quizIndex === 0}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-40"
            >
              ← Terme Précédent
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
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Bar */}
              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une notion (ex: PER, SGI, Flottant, Obligation)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {categories.map(cat => (
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
                      ? 'bg-indigo-600 text-white shadow-xs'
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
            <span>{filteredTerms.length} terme(s) trouvé(s)</span>
            {savedTerms.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {savedTerms.length} terme(s) favoris enregistrés
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

                return (
                  <div
                    key={term.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'border-indigo-500/80 shadow-md ring-1 ring-indigo-500/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : term.id)}
                      className="p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">
                            {term.term}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                            {term.categoryLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {term.shortDefinition}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleSaveTerm(term.id);
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            isSaved
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                          title="Copier la définition"
                        >
                          {copiedId === term.id ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <div className="p-1.5 text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Expandable Body */}
                    {isExpanded && (
                      <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {term.fullExplanation}
                        </div>

                        {/* Formula if applicable */}
                        {term.formula && (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-300 font-mono font-bold flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Formule : {term.formula}</span>
                          </div>
                        )}

                        {/* Example */}
                        {term.example && (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                            <strong className="text-indigo-900 dark:text-indigo-300 font-extrabold uppercase text-[10px] tracking-wider block">
                              Exemple Chiffré Concret :
                            </strong>
                            <p className="font-medium">{term.example}</p>
                          </div>
                        )}

                        {/* BRVM Specific Context */}
                        {term.brvmContext && (
                          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                            <strong className="text-slate-900 dark:text-white font-extrabold uppercase text-[10px] tracking-wider block">
                              Spécificité Marché BRVM & UEMOA :
                            </strong>
                            <p className="font-medium italic">{term.brvmContext}</p>
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
