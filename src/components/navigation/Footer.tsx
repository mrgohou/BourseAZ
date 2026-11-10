import React from 'react';
import { AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { startOnboardingTour } from '../common/OnboardingTour';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-16 mb-16 lg:mb-0">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3 text-xs leading-relaxed text-slate-300">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-1">Avertissement Pédagogique Majeur</span>
            Bourse Facile est un outil de simulation et d’analyse pédagogique dédié à la compréhension de la Bourse Régionale des Valeurs Mobilières (BRVM).
            Les simulations et données financières sont fournies à titre indicatif et ne constituent en aucun cas un conseil en investissement ou une incitation à acheter ou vendre des titres.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4 border-t border-slate-800 text-sm">
          <div className="space-y-3">
            <h4 className="text-white font-bold text-base">Bourse Facile</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              La plateforme de référence pour apprendre, analyser et simuler vos investissements en Bourse à la BRVM en toute clarté.
            </p>
          </div>

          <div>
            <h5 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Fonctionnalités</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={startOnboardingTour}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Paco Conseiller Bourse (Chatbot & Guide)
                </button>
              </li>
              <li><button onClick={() => onNavigate('/search')} className="hover:text-white transition-colors cursor-pointer">Rechercher une action</button></li>
              <li><button onClick={() => onNavigate('/simulation')} className="hover:text-white transition-colors cursor-pointer">Simulateur de rendement</button></li>
              <li><button onClick={() => onNavigate('/comparison')} className="hover:text-white transition-colors cursor-pointer">Comparateur d'entreprises</button></li>
              <li><button onClick={() => onNavigate('/learning')} className="hover:text-white transition-colors cursor-pointer">Guide du débutant BRVM</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Pédagogie & Ratios</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/learning/quest-ce-que-le-bpa')} className="hover:text-white transition-colors cursor-pointer">Comprendre le BPA</button></li>
              <li><button onClick={() => onNavigate('/learning/quest-ce-que-le-per')} className="hover:text-white transition-colors cursor-pointer">Comprendre le PER</button></li>
              <li><button onClick={() => onNavigate('/learning/quest-ce-qu-un-dividende')} className="hover:text-white transition-colors cursor-pointer">Rendement des dividendes</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Sécurité & Transparence</h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Données BRVM officielles et historiques réels étiquetés en toute transparence.
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Politique de confidentialité
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Bourse Facile - Tous droits réservés. Développé pour la communauté financière UEMOA.
          </div>
          <div>
            <button
              onClick={() => onNavigate('/privacy')}
              className="hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Politique de confidentialité & Données
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
