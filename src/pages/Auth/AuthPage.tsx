import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Mail, Phone, Shield, ArrowRight, CheckCircle2, Lock, UserCheck, KeyRound } from 'lucide-react';

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
  } = useAuth();

  const [mode, setMode] = useState<'SELECT' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER' | 'PHONE' | 'OTP'>('SELECT');
  const [email, setEmail] = useState('investisseur@bourseclair.ci');
  const [password, setPassword] = useState('Pass1234!');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+22507000000');
  const [otp, setOtp] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Vous êtes connecté !</h2>
        <p className="text-xs text-slate-500">Bienvenue, {user.name} ({user.email}).</p>
        <Button className="w-full" onClick={() => onNavigate('/account')}>
          Accéder à mon espace personnel
        </Button>
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
      onNavigate('/account');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur d’authentification.');
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
      onNavigate('/account');
    } catch (err: any) {
      setErrorMsg(err.message || 'Code OTP invalide.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginGoogle();
      onNavigate('/account');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const prefillDemoUser = () => {
    setEmail('investisseur@bourseclair.ci');
    setPassword('Pass1234!');
    setErrorMsg(null);
  };

  const prefillDemoAdmin = () => {
    setEmail('admin@bourseclair.ci');
    setPassword('AdminBRVM2026!');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 pb-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Espace Connexion Bourse Facile</h1>
        <p className="text-xs text-slate-500">
          Accédez à vos simulations sauvegardées, vos analyses et votre progression d'apprentissage.
        </p>
      </div>

      {errorMsg && <Alert type="error">{errorMsg}</Alert>}

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl space-y-6">
        {mode === 'SELECT' && (
          <div className="space-y-4">
            {/* Google OAuth button */}
            {featureFlags.FEATURE_GOOGLE_AUTH && (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-2xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continuer avec Google
              </button>
            )}

            {/* Email button */}
            <button
              onClick={() => setMode('EMAIL_LOGIN')}
              className="w-full p-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-md"
            >
              <Mail className="w-5 h-5" />
              Connexion par E-mail
            </button>

            {/* Phone OTP button */}
            <button
              onClick={() => setMode('PHONE')}
              className="w-full p-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-md"
            >
              <Phone className="w-5 h-5" />
              Connexion Téléphone / SMS (OTP)
            </button>
          </div>
        )}

        {/* EMAIL LOGIN / REGISTER FORM */}
        {(mode === 'EMAIL_LOGIN' || mode === 'EMAIL_REGISTER') && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {mode === 'EMAIL_LOGIN' ? 'Se connecter par E-mail' : 'Créer un compte E-mail'}
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Validation en temps réel
              </span>
            </div>

            {mode === 'EMAIL_REGISTER' && (
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Koffi Amadou"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Adresse E-mail *</label>
              <input
                type="email"
                required
                placeholder="investisseur@bourseclair.ci"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Mot de passe {mode === 'EMAIL_REGISTER' ? '(min. 6 caractères)' : '*'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {mode === 'EMAIL_LOGIN' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <span className="font-extrabold text-slate-700 block flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Comptes démo pré-validés :
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={prefillDemoUser}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
                  >
                    Investisseur: investisseur@bourseclair.ci (Pass1234!)
                  </button>
                  <button
                    type="button"
                    onClick={prefillDemoAdmin}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer text-[11px]"
                  >
                    Admin: admin@bourseclair.ci (AdminBRVM2026!)
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {mode === 'EMAIL_LOGIN' ? 'Se connecter' : 'Valider mon inscription'}
            </Button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode(mode === 'EMAIL_LOGIN' ? 'EMAIL_REGISTER' : 'EMAIL_LOGIN');
                }}
                className="font-bold text-blue-700 hover:underline cursor-pointer"
              >
                {mode === 'EMAIL_LOGIN' ? 'Pas encore de compte ? S’inscrire' : 'Déjà inscrit ? Se connecter'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('SELECT');
                }}
                className="text-slate-500 hover:underline cursor-pointer"
              >
                Autres méthodes
              </button>
            </div>
          </form>
        )}

        {/* PHONE FORM */}
        {mode === 'PHONE' && (
          <form onSubmit={handleSendPhoneOtp} className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Connexion par Téléphone (SMS)</h3>
            <p className="text-xs text-slate-500">
              Un code de validation à 6 chiffres vous sera attribué pour sécuriser votre accès.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Numéro de téléphone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+22507000000"
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono focus:border-blue-500"
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
            <h3 className="font-bold text-slate-900 text-base">Saisir le Code de Validation</h3>
            <p className="text-xs text-slate-500">Saisissez le code SMS à 6 chiffres (Exemple de démonstration : <strong>123456</strong>)</p>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Code à 6 chiffres *</label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full p-3 text-center text-xl font-mono font-black bg-slate-50 border border-slate-200 rounded-xl outline-none tracking-widest focus:border-blue-500"
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
    </div>
  );
};
