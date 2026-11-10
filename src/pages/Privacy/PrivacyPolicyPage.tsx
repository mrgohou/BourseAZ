import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  Cookie,
  Mail,
  FileText,
  CheckCircle,
  ArrowLeft,
  Server,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('privacy@boursefacile.app');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Imprimer / Télécharger (PDF)
        </Button>
      </div>

      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border-2 border-emerald-800 space-y-4">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            PROTECTION DES DONNEES & TRANSPARENCE
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-['Outfit']">
            Politique de Confidentialité
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
            Chez <strong className="text-white font-bold">Bourse Facile</strong>, la protection de vos données personnelles et simulations financières est notre priorité absolue. Cette politique explique en toute clarté quelles données sont collectées, comment elles sont sécurisées et vos droits conformément aux normes en vigueur.
          </p>

          <div className="p-3 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 shadow-inner">
            <span>Dernière mise à jour : <strong className="text-white">Novembre 2026</strong></span>
            <span>•</span>
            <span>Régulation : <strong className="text-white">UEMOA & AMF</strong></span>
            <span>•</span>
            <span>Chiffrement : <strong className="text-white">SSL 256-bit</strong></span>
          </div>
        </div>
      </section>

      {/* Core Guarantees Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Chiffrement SSL/TLS</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toutes les communications sont chiffrées de bout en bout.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Aucune Revente</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vos données ne sont jamais cédées ou vendues à des tiers.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Infrastructure Firebase</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stockage Cloud sécurisé avec règles d'accès strictes.</p>
          </div>
        </div>
      </div>

      {/* Main Detailed Sections */}
      <div className="space-y-6 text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
        
        {/* Section 1: Responsable du traitement */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            1. Responsable du Traitement des Données
          </div>
          <p>
            L'application <strong>Bourse Facile</strong> est éditée pour servir la communauté d'investisseurs de la Zone UEMOA (Sénégal, Côte d'Ivoire, Burkina Faso, Togo, Mali, Bénin, Niger, Guinée-Bissau).
          </p>
          <p>
            Le responsable du traitement veille à ce que la collecte et le traitement de vos informations personnelles soient conformes aux directives régionales sur la protection des données à caractère personnel.
          </p>
        </section>

        {/* Section 2: Données collectées */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            2. Données Personnelles Collectées
          </div>
          <p>
            Nous limitons la collecte de données au strict nécessaire afin d'assurer le fonctionnement optimal de vos simulations boursières et de vos alertes de cours BRVM :
          </p>
          <ul className="space-y-2.5 pl-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>Informations de Compte (Authentication) :</strong> Adresse e-mail, nom complet, mot de passe (hashé de manière irréversible par Firebase Auth), ou numéro de téléphone lors de la connexion par SMS. En cas d'authentification Google, nous récupérons uniquement votre nom et adresse e-mail publique.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>Données de Simulation & Portefeuille :</strong> Montants simulés, prix d'achat enregistrés, nombre de titres BRVM virtuels suivis, analyses et comparatifs sauvegardés.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>Alertes de Cours Intelligentes :</strong> Seuils de prix (ex: franchissement de 17 500 FCFA), type de notification sélectionné (E-mail, Push, SMS), historiques d'envois.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>Données Techniques Anonymisées :</strong> Thème d'affichage préféré (clair/sombre), type d'appareil, version du navigateur et journaux d'erreurs pour l'amélioration continue de l'application.
              </div>
            </li>
          </ul>
        </section>

        {/* Section 3: Finalité du traitement */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            3. Finalités de l'Utilisation des Données
          </div>
          <p>Vos données sont exclusivement utilisées pour :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <strong className="block text-slate-900 dark:text-white mb-1">🎯 Sauvegarde & Synchronisation</strong>
              Conserver vos simulations et portefeuilles sur Cloud Firestore afin de les retrouver sur tous vos appareils.
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <strong className="block text-slate-900 dark:text-white mb-1">🔔 Envoi des Alertes BRVM</strong>
              Vous notifier immédiatement lorsque le cours d'une action atteint votre objectif d'achat ou de vente.
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <strong className="block text-slate-900 dark:text-white mb-1">🎓 Suivi d'Apprentissage</strong>
              Mémoriser votre progression dans les modules pédagogiques (BPA, PER, Dividendes).
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <strong className="block text-slate-900 dark:text-white mb-1">🛡️ Sécurité & Prévention</strong>
              Protéger votre compte contre les accès non autorisés et garantir la fiabilité des données.
            </div>
          </div>
        </section>

        {/* Section 4: Sécurité & Hébergement Firebase */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            4. Hébergement et Sécurité des Données
          </div>
          <p>
            Les données de l'application sont hébergées sur la plateforme <strong>Google Firebase (Cloud Firestore & Authentication)</strong> dans le projet sécurisé <code>bourse-facile</code>.
          </p>
          <div className="p-3.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
            <strong>Règles de Sécurité Firestore :</strong> Vos simulations et alertes sont strictement isolées. Chaque utilisateur ne peut lire ou modifier que ses propres données privées via des règles d'accès vérifiées par le jeton d'authentification unique.
          </div>
        </section>

        {/* Section 5: Cookies et Stockage Local */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <Cookie className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            5. Cookies et Stockage Local (localStorage)
          </div>
          <p>
            Bourse Facile n'utilise <strong>aucun cookie publicitaire ou de traçage tiers</strong>.
          </p>
          <p>
            Nous utilisons uniquement le stockage local de votre navigateur (<code>localStorage</code>) afin d'assurer :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-600 dark:text-slate-400">
            <li>La mémorisation de votre préférence de thème (mode sombre ou clair).</li>
            <li>Le maintien de votre session de connexion active hors-ligne.</li>
            <li>La mise en cache rapide des cotations BRVM pour réduire votre consommation de données mobiles.</li>
          </ul>
        </section>

        {/* Section 6: Vos Droits */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            6. Vos Droits et Contrôle de vos Données
          </div>
          <p>Vous conservez le contrôle total sur vos données personnelles :</p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <strong className="text-indigo-600 dark:text-indigo-400 shrink-0 font-bold">1. Droit d'Accès & Exportation :</strong>
              <span className="text-xs">Vous pouvez télécharger l'ensemble de vos simulations et comparatifs au format PDF ou CSV à tout moment depuis l'application.</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <strong className="text-indigo-600 dark:text-indigo-400 shrink-0 font-bold">2. Droit de Rectification :</strong>
              <span className="text-xs">Vous pouvez modifier votre profil, vos seuils d'alertes et vos paramètres depuis votre espace utilisateur.</span>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <strong className="text-indigo-600 dark:text-indigo-400 shrink-0 font-bold">3. Droit à l'Oubli (Suppression) :</strong>
              <span className="text-xs">Vous pouvez demander la purge complète de vos alertes et la suppression définitive de votre compte utilisateur.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/account')}
              className="text-xs cursor-pointer"
            >
              Gérer mon compte & mes données
            </Button>
          </div>
        </section>

        {/* Section 7: Contact */}
        <section className="p-6 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md space-y-4">
          <div className="flex items-center gap-2.5 font-bold text-base border-b border-slate-800 pb-3">
            <Mail className="w-5 h-5 text-indigo-400" />
            7. Contact & Délégué à la Protection des Données
          </div>
          <p className="text-slate-300 text-xs sm:text-sm">
            Pour toute question, réclamation ou demande d'exercice de vos droits relatifs à la protection de vos données personnelles, vous pouvez contacter directement notre équipe support :
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div>
              <span className="text-xs text-slate-400 block font-medium">E-mail DPO & Confidentialité</span>
              <span className="text-sm font-bold text-white tracking-wide">privacy@boursefacile.app</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyEmail}
              className="shrink-0 text-xs gap-1.5"
            >
              {copiedEmail ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Adresse copiée !
                </>
              ) : (
                <>
                  Copier l'adresse e-mail
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Rappel Pédagogique Majeur :</strong> Bourse Facile est un outil éducatif de simulation d'investissement à la BRVM. Les simulations saisies n'ont aucune valeur de transaction financière réelle.
          </div>
        </div>

      </div>
    </div>
  );
};
