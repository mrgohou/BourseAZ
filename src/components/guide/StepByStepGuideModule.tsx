import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Building2, UserCheck, Wallet, ArrowRight, TrendingUp, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface Step {
  id: number;
  number: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
  details: string[];
  tips: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    number: "01",
    title: "Sélectionner une SGI Agréée",
    subtitle: "Société de Gestion et d'Intermédiation obligatoire",
    icon: Building2,
    color: "bg-indigo-600 text-white",
    badge: "Étape Obligatoire",
    details: [
      "Vous ne pouvez pas acheter d'actions en direct au guichet de la BRVM : un courtier agréé (SGI) est obligatoire.",
      "Consultez l'annuaire des 30+ SGI présentes en Côte d'Ivoire, au Sénégal, au Bénin, au Burkina Faso, etc.",
      "Comparez les tarifs de tenue de compte, l'accès à une application web/mobile d'ordres en ligne, et le service client."
    ],
    tips: "Privilégiez les SGI qui proposent la négociation d'ordres en ligne directe via leur portail web pour exécuter vos ordres en quelques clics."
  },
  {
    id: 2,
    number: "02",
    title: "Ouvrir un Compte Titres & Un Compte Espèces",
    subtitle: "Dossier d'ouverture de compte KYC",
    icon: UserCheck,
    color: "bg-emerald-600 text-white",
    badge: "Formalités Administratif",
    details: [
      "Fournissez une pièce d'identité en cours de validité (CNI ou Passeport).",
      "Ajoutez un justificatif de domicile (facture d'électricité, d'eau ou certificat de résidence).",
      "Remplissez le formulaire d'ouverture et signez la convention d'ouverture de compte titres."
    ],
    tips: "L'ouverture de compte peut désormais se faire 100% à distance auprès de plusieurs SGI majeures de l'UEMOA."
  },
  {
    id: 3,
    number: "03",
    title: "Alimenter son Compte d'Investissement",
    subtitle: "Transfert de fonds sécurisé en FCFA",
    icon: Wallet,
    color: "bg-amber-500 text-slate-950",
    badge: "Dépôt de Capital",
    details: [
      "Effectuez un virement bancaire ou un dépôt par Mobile Money sur le compte RIB de votre SGI.",
      "Indiquez impérativement votre numéro de compte titres en libellé de virement.",
      "Vos fonds sont immédiatement crédités sur votre compte d'espèces dédié aux investissements."
    ],
    tips: "Commencez progressivement, par exemple avec 100 000 FCFA ou 250 000 FCFA, sans utiliser l'argent nécessaire à vos dépenses vitales."
  },
  {
    id: 4,
    number: "04",
    title: "Passer son Premier Ordre de Bourse",
    subtitle: "Achat d'actions sur la plate-forme BRVM",
    icon: TrendingUp,
    color: "bg-blue-600 text-white",
    badge: "Exécution de Bourse",
    details: [
      "Choisissez le symbole de l'entreprise visée (ex: SNTS pour Sonatel, SGBC pour Société Générale CI).",
      "Choisissez le type d'ordre : Ordre 'à cours limité' (recommandé pour fixer votre prix max) ou 'au prix du marché'.",
      "Saisissez la quantité de titres souhaitée et validez l'ordre."
    ],
    tips: "Utilisez l'Ordre à cours limité pour ne jamais acheter plus cher que le prix fixé dans votre simulation."
  },
  {
    id: 5,
    number: "05",
    title: "Suivre son Portefeuille & Encaisser les Dividendes",
    subtitle: "Gestion passive et encaissement annuel",
    icon: CheckCircle2,
    color: "bg-purple-600 text-white",
    badge: "Revenus Passifs",
    details: [
      "Suivez la valorisation quotidienne de vos lignes sur votre espace investisseur.",
      "Recevez les dividendes nets d'impôt directement sur votre compte titres chaque année.",
      "Choisissez de réinvestir vos dividendes pour déclencher le pouvoir des intérêts composés !"
    ],
    tips: "À la BRVM, les dividendes distribués sur les actions ne sont pas soumis à l'impôt sur le revenu des valeurs mobilières si l'entreprise s'en est déjà acquittée."
  }
];

interface StepByStepGuideModuleProps {
  onNavigate?: (path: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const StepByStepGuideModule: React.FC<StepByStepGuideModuleProps> = ({ onNavigate, onSelectTab }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const handleProfileClick = () => {
    if (onSelectTab) {
      onSelectTab('profile');
    }
    if (onNavigate) {
      onNavigate('/profil-investisseur');
    }
  };

  const selectedStep = STEPS.find(s => s.id === activeStep) || STEPS[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Parcours Initiatique
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Guide Pas-à-Pas : Comment Investir à la BRVM
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Découvrez les 5 étapes incontournables pour devenir actionnaire de plus grands fleurons de l'économie ouest-africaine.
          </p>
        </div>

        {onNavigate && (
          <Button onClick={() => onNavigate('/sgi')} size="sm">
            <Building2 className="w-4 h-4 mr-1.5" /> Voir l'Annuaire SGI
          </Button>
        )}
      </div>

      {/* Steps Navigation Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${step.color}`}>
                  {step.number}
                </span>
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-400" />}
              </div>

              <div>
                <span className="text-xs font-extrabold block truncate">{step.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Detailed Card */}
      <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedStep.color}`}>
              <selectedStep.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Étape {selectedStep.number} sur 05
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {selectedStep.title}
              </h3>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold">
            {selectedStep.badge}
          </span>
        </div>

        {/* Bullet points */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Actions à réaliser :</h4>
          <ul className="space-y-2.5">
            {selectedStep.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Tip Box */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
          <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Conseil d’Expert Bourse Facile :</strong>
            <p className="mt-0.5 text-slate-700 dark:text-slate-300">{selectedStep.tips}</p>
          </div>
        </div>

        {/* Next Step Navigation */}
        <div className="flex justify-between items-center pt-2">
          {activeStep > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setActiveStep(activeStep - 1)}>
              Précédent
            </Button>
          ) : <div />}

          {activeStep < STEPS.length ? (
            <Button size="sm" onClick={() => setActiveStep(activeStep + 1)}>
              Étape Suivante <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleProfileClick} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-bold">
              Test ton Profil Investiseur <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
