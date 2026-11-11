import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import {
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';

interface AuthPageProps {
  onNavigate: (path: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const {
    loginEmail,
    registerEmail,
    verifyOtpPhone,
    loginGoogle,
    featureFlags,
    isAuthenticated,
    user,
    confirmationEmailNotice,
    resendConfirmationEmail,
  } = useAuth();

  const [mode, setMode] = useState<'SELECT' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER' | 'PHONE' | 'OTP'>('SELECT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connexion réussie !</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Bienvenue sur votre Espace Client, <strong>{user.name}</strong> ({user.email}).
        </p>
        {confirmationEmailNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            ✉️ {confirmationEmailNotice}
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => onNavigate('/espace-client')}
            className="w-full h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Accéder à mon Espace Client</span>
          </button>
          <button
            onClick={() => resendConfirmationEmail()}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold py-1 cursor-pointer"
          >
            Renvoyer l'e-mail de confirmation
          </button>
        </div>
      </div>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === 'EMAIL_LOGIN') {
        if (!email.trim() || !password) {
          throw new Error('Veuillez remplir votre adresse e-mail et votre mot de passe.');
        }
        await loginEmail(email, password);
      } else {
        if (!email.trim() || !password || !name.trim()) {
          throw new Error('Veuillez remplir tous les champs obligatoires.');
        }
        await registerEmail(email, password, name);
      }
      onNavigate('/espace-client');
    } catch (err: any) {
      if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes('api-key-not-valid'))) {
        setErrorMsg('Service d’authentification en mode démo. Utilisez les comptes prédéfinis ci-dessous pour tester l’application.');
      } else {
        setErrorMsg(err.message || 'Erreur d’authentification.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Veuillez entrer un numéro de téléphone valide d’au moins 8 chiffres (ex: +22507000000).');
      return;
    }
    setErrorMsg(null);
    setMode('OTP');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new Error('Le code OTP doit comporter exactement 6 chiffres.');
      }
      await verifyOtpPhone(phone, otp);
      onNavigate('/espace-client');
    } catch (err: any) {
      setErrorMsg(err.message || 'Code OTP invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (specificEmail?: string, specificName?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginGoogle(specificEmail, specificName);
      setIsGoogleModalOpen(false);
      onNavigate('/espace-client');
    } catch (err: any) {
      console.warn('Google login notice:', err);
      // loginGoogle now handles popup fallback seamlessly
      setIsGoogleModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const renderGoogleButton = (label = 'Continuer avec Google', sublabel = 'Connexion sécurisée en 1 clic') => (
    <div className="w-full">
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto my-8 pb-12 space-y-6">
      {/* Section 1: Hero Banner (Vert Foncé) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-800 text-center space-y-3">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-[11px] font-black uppercase tracking-wider shadow-sm">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            ESPACE MEMBRE & SECURITE
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Connexion Bourse Facile
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 font-normal max-w-sm mx-auto leading-relaxed">
            Accédez à vos simulations sauvegardées, vos analyses financières et votre progression d'apprentissage.
          </p>
        </div>
      </section>

      {errorMsg && <Alert type="error">{errorMsg}</Alert>}

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        {mode === 'SELECT' && (
          <div className="space-y-4">
            {/* Google OAuth button */}
            {featureFlags.FEATURE_GOOGLE_AUTH && (
              renderGoogleButton('Se connecter avec Google', 'Connexion instantanée en 1 clic')
            )}

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="shrink-0 mx-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                ou autres options
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            {/* Email button */}
            <button
              onClick={() => setMode('EMAIL_LOGIN')}
              className="w-full h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <Mail className="w-4 h-4" />
              <span>Connexion par E-mail</span>
            </button>

            {/* Phone OTP button */}
            <button
              onClick={() => setMode('PHONE')}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.99]"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Connexion Téléphone / SMS (OTP)</span>
            </button>
          </div>
        )}

        {/* EMAIL LOGIN / REGISTER FORM */}
        {(mode === 'EMAIL_LOGIN' || mode === 'EMAIL_REGISTER') && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {mode === 'EMAIL_LOGIN' ? 'Se connecter par E-mail' : 'Créer un compte E-mail'}
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
                Validation en temps réel
              </span>
            </div>

            {/* Direct Google Alternative */}
            {featureFlags.FEATURE_GOOGLE_AUTH && (
              <div className="space-y-3 pb-2">
                {renderGoogleButton(
                  mode === 'EMAIL_LOGIN' ? 'Se connecter avec Google' : 'S’inscrire avec Google',
                  'Connexion rapide en 1 clic sans mot de passe'
                )}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  <span className="shrink-0 mx-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    ou par mot de passe
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                </div>
              </div>
            )}

            {mode === 'EMAIL_REGISTER' && (
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Koffi Amadou"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                {mode === 'EMAIL_LOGIN' ? 'Adresse E-mail ou User ID Admin *' : 'Adresse E-mail *'}
              </label>
              <input
                type="text"
                required
                placeholder="boursefacileapp ou exemple@domaine.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Mot de passe {mode === 'EMAIL_REGISTER' ? '(min. 6 caractères)' : '*'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-amber-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              {mode === 'EMAIL_LOGIN' ? 'Se connecter' : 'Valider mon inscription'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode(mode === 'EMAIL_LOGIN' ? 'EMAIL_REGISTER' : 'EMAIL_LOGIN');
                }}
                className="font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {mode === 'EMAIL_LOGIN' ? 'Pas encore de compte ? S’inscrire' : 'Déjà inscrit ? Se connecter'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('SELECT');
                }}
                className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Autres méthodes
              </button>
            </div>
          </form>
        )}

        {/* PHONE FORM */}
        {mode === 'PHONE' && (
          <form onSubmit={handleSendPhoneOtp} className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Connexion par Téléphone (SMS)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Un code de validation à 6 chiffres vous sera attribué pour sécuriser votre accès.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Numéro de téléphone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+22507000000"
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-mono focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <Button type="submit" className="w-full">
              Recevoir le code OTP (SMS)
            </Button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode('SELECT');
              }}
              className="text-xs text-slate-500 block w-full text-center hover:underline cursor-pointer"
            >
              Retour
            </button>
          </form>
        )}

        {/* OTP VERIFY FORM */}
        {mode === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Saisir le Code de Validation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Saisissez le code de validation SMS à 6 chiffres reçu sur votre téléphone.</p>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Code à 6 chiffres *</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full p-3 text-center text-xl font-mono font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none tracking-widest focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              Vérifier le code et accéder
            </Button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode('PHONE');
              }}
              className="text-xs text-slate-500 block w-full text-center hover:underline cursor-pointer"
            >
              Modifier le numéro
            </button>
          </form>
        )}
      </div>

      {/* Google Account Selector Modal */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Connexion Compte Google"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div className="text-xs">
              <p className="font-bold text-blue-950 dark:text-blue-100">
                Connexion avec votre compte Google
              </p>
              <p className="text-blue-700/80 dark:text-blue-300/80 text-[11px]">
                Indiquez votre adresse e-mail Google pour accéder à votre Espace Client et synchroniser vos investissements.
              </p>
            </div>
          </div>

          {/* Custom Google account form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customGoogleEmail.trim()) {
                handleGoogleLogin(
                  customGoogleEmail.trim(),
                  customGoogleName.trim() || customGoogleEmail.split('@')[0]
                );
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Adresse Google (@gmail.com ou Google Workspace) *
              </label>
              <input
                type="email"
                required
                placeholder="votre.compte@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nom complet (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Koffi Amadou"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !customGoogleEmail.trim()}
              className="w-full"
            >
              Se connecter avec ce compte Google
            </Button>
          </form>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authentification chiffrée SSL • Profil synchronisé sur Firebase</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

