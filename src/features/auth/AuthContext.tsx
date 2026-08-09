import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SavedAnalysis, SimulationResult, PriceAlert } from '../../types';
import { SEEDED_SIMULATIONS } from '../../data/seeded-simulations';
import { getFeatureFlags, FeatureFlags } from '../../lib/feature-flags';

export interface StoredAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  phone?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  alertId: string;
  type: 'EMAIL' | 'PUSH';
  recipient: string;
  symbol: string;
  companyName: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'ABOVE' | 'BELOW';
  sentAt: string;
  subject: string;
  message: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  featureFlags: FeatureFlags;
  savedAnalyses: SavedAnalysis[];
  savedSimulations: SimulationResult[];
  priceAlerts: PriceAlert[];
  notificationLogs: NotificationLog[];
  learningProgress: string[]; // array of completed module IDs
  loginEmail: (email: string, password?: string) => Promise<void>;
  registerEmail: (email: string, password: string, name: string) => Promise<void>;
  verifyOtpPhone: (phone: string, otp: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => void;
  toggleAdminMode: () => void;
  saveAnalysis: (analysis: Omit<SavedAnalysis, 'id' | 'createdAt'>) => void;
  deleteAnalysis: (id: string) => void;
  saveSimulation: (simulation: SimulationResult) => void;
  deleteSimulation: (id: string) => void;
  addPriceAlert: (alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'active'>) => PriceAlert;
  deletePriceAlert: (id: string) => void;
  togglePriceAlertActive: (id: string) => void;
  triggerSimulatedAlert: (alertId: string, customPrice?: number) => NotificationLog[];
  completeLearningModule: (moduleId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'bourseclair_user_session';
const STORAGE_KEY_ACCOUNTS = 'bourseclair_registered_accounts';
const STORAGE_KEY_ANALYSES = 'bourseclair_saved_analyses';
const STORAGE_KEY_SIMULATIONS = 'bourseclair_saved_simulations';
const STORAGE_KEY_LEARNING = 'bourseclair_learning_progress';
const STORAGE_KEY_PRICE_ALERTS = 'bourseclair_price_alerts';
const STORAGE_KEY_NOTIFICATION_LOGS = 'bourseclair_notification_logs';

const SEEDED_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'alt-snts-1',
    companySymbol: 'SNTS',
    companyName: 'Sonatel Sénégal',
    targetPrice: 17500,
    condition: 'ABOVE',
    notificationType: 'BOTH',
    emailRecipient: 'investisseur@bourseclair.ci',
    phoneRecipient: '+22507000000',
    active: true,
    triggered: false,
    notes: 'Alerte issue de la simulation DCA Sonatel (Objectif franchissement 17 500 FCFA)',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'alt-sgbc-1',
    companySymbol: 'SGBC',
    companyName: 'Société Générale Côte d\'Ivoire',
    targetPrice: 18000,
    condition: 'BELOW',
    notificationType: 'EMAIL',
    emailRecipient: 'investisseur@bourseclair.ci',
    active: true,
    triggered: false,
    notes: 'Seuil d\'opportunité d\'achat à bon compte SGBCI',
    createdAt: '2026-02-05T14:30:00.000Z',
  },
];

// Pre-seeded demo accounts with real credentials validation
const SEEDED_ACCOUNTS: StoredAccount[] = [
  {
    id: 'usr-investor-demo',
    email: 'investisseur@bourseclair.ci',
    name: 'Koffi Amadou',
    passwordHash: 'Pass1234!',
    role: 'USER',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr-admin-demo',
    email: 'admin@bourseclair.ci',
    name: 'Administrateur BRVM',
    passwordHash: 'AdminBRVM2026!',
    role: 'ADMIN',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEEDED_ACCOUNTS;
      }
      return SEEDED_ACCOUNTS;
    } catch {
      return SEEDED_ACCOUNTS;
    }
  });

  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ANALYSES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SIMULATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SEEDED_SIMULATIONS;
    } catch {
      return SEEDED_SIMULATIONS;
    }
  });

  const [learningProgress, setLearningProgress] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEARNING);
      return stored ? JSON.parse(stored) : ['m1'];
    } catch {
      return ['m1'];
    }
  });

  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRICE_ALERTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SEEDED_PRICE_ALERTS;
    } catch {
      return SEEDED_PRICE_ALERTS;
    }
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATION_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const featureFlags = getFeatureFlags();

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(savedAnalyses));
  }, [savedAnalyses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(savedSimulations));
  }, [savedSimulations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEARNING, JSON.stringify(learningProgress));
  }, [learningProgress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRICE_ALERTS, JSON.stringify(priceAlerts));
  }, [priceAlerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFICATION_LOGS, JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  // Real Email validation pattern
  const validateEmailFormat = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const loginEmail = async (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!validateEmailFormat(cleanEmail)) {
      throw new Error('Format d’adresse e-mail invalide (ex: exemple@domaine.com).');
    }

    if (!password) {
      throw new Error('Veuillez saisir votre mot de passe.');
    }

    // Look up account in registered accounts
    const existingAccount = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!existingAccount) {
      throw new Error(
        `Aucun compte trouvé pour "${cleanEmail}". Veuillez vérifier votre e-mail ou créer un compte. (Comptes démo disponibles : investisseur@bourseclair.ci / Pass1234!)`
      );
    }

    if (existingAccount.passwordHash !== password) {
      throw new Error('Mot de passe incorrect pour cet e-mail. Veuillez réessayer.');
    }

    const newUser: UserProfile = {
      id: existingAccount.id,
      email: existingAccount.email,
      name: existingAccount.name,
      role: existingAccount.role,
      authProvider: 'EMAIL',
      createdAt: existingAccount.createdAt,
    };
    setUser(newUser);
  };

  const registerEmail = async (email: string, password: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!validateEmailFormat(cleanEmail)) {
      throw new Error('Veuillez fournir une adresse e-mail valide (ex: vous@domaine.com).');
    }

    if (cleanName.length < 2) {
      throw new Error('Veuillez indiquer un nom complet valide (au moins 2 caractères).');
    }

    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
    }

    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`Un compte est déjà enregistré avec l’adresse "${cleanEmail}". Connectez-vous directement.`);
    }

    const newAccount: StoredAccount = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      passwordHash: password,
      role: cleanEmail.includes('admin') ? 'ADMIN' : 'USER',
      createdAt: new Date().toISOString(),
    };

    setAccounts(prev => [...prev, newAccount]);

    const newUser: UserProfile = {
      id: newAccount.id,
      email: newAccount.email,
      name: newAccount.name,
      role: newAccount.role,
      authProvider: 'EMAIL',
      createdAt: newAccount.createdAt,
    };
    setUser(newUser);
  };

  const verifyOtpPhone = async (phone: string, otp: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 8) {
      throw new Error('Numéro de téléphone invalide (au moins 8 chiffres requis).');
    }
    if (!otp || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      throw new Error('Le code OTP doit être un code numérique à 6 chiffres.');
    }

    const newUser: UserProfile = {
      id: `usr-phone-${Date.now()}`,
      email: `${cleanPhone.replace(/[^0-9]/g, '')}@bourseclair.mobile`,
      name: `Investisseur ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      role: 'USER',
      authProvider: 'PHONE',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
  };

  const loginGoogle = async () => {
    const newUser: UserProfile = {
      id: `usr-google-${Date.now()}`,
      email: 'investisseur.democlaire@gmail.com',
      name: 'Investisseur Démo Google',
      role: 'USER',
      authProvider: 'GOOGLE',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const toggleAdminMode = () => {
    if (!user) {
      loginEmail('admin@bourseclair.ci', 'AdminBRVM2026!');
      return;
    }
    setUser({
      ...user,
      role: user.role === 'ADMIN' ? 'USER' : 'ADMIN',
    });
  };

  const saveAnalysis = (analysisData: Omit<SavedAnalysis, 'id' | 'createdAt'>) => {
    const newAnalysis: SavedAnalysis = {
      ...analysisData,
      id: `analysis-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavedAnalyses(prev => [newAnalysis, ...prev]);
  };

  const deleteAnalysis = (id: string) => {
    setSavedAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const saveSimulation = (sim: SimulationResult) => {
    setSavedSimulations(prev => [sim, ...prev.filter(s => s.id !== sim.id)]);
  };

  const deleteSimulation = (id: string) => {
    setSavedSimulations(prev => prev.filter(s => s.id !== id));
  };

  const completeLearningModule = (moduleId: string) => {
    setLearningProgress(prev => (prev.includes(moduleId) ? prev : [...prev, moduleId]));
  };

  const addPriceAlert = (alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'active'>): PriceAlert => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alt-${Date.now()}`,
      active: true,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    setPriceAlerts(prev => [newAlert, ...prev]);
    return newAlert;
  };

  const deletePriceAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  };

  const togglePriceAlertActive = (id: string) => {
    setPriceAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const triggerSimulatedAlert = (alertId: string, customPrice?: number): NotificationLog[] => {
    const alert = priceAlerts.find(a => a.id === alertId);
    if (!alert) return [];

    const simulatedPrice = customPrice ?? alert.targetPrice;
    const nowIso = new Date().toISOString();

    const createdLogs: NotificationLog[] = [];

    // Create Email Log if EMAIL or BOTH
    if (alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH') {
      const emailRecipient = alert.emailRecipient || user?.email || 'investisseur@bourseclair.ci';
      const emailLog: NotificationLog = {
        id: `log-email-${Date.now()}`,
        alertId: alert.id,
        type: 'EMAIL',
        recipient: emailRecipient,
        symbol: alert.companySymbol,
        companyName: alert.companyName,
        targetPrice: alert.targetPrice,
        currentPrice: simulatedPrice,
        condition: alert.condition,
        sentAt: nowIso,
        subject: `[BourseClair Alerte] Le cours de ${alert.companyName} (${alert.companySymbol}) a atteint votre seuil de ${alert.targetPrice} FCFA !`,
        message: `Bonjour ${user?.name || 'Investisseur'},\n\nLe cours de l'action ${alert.companyName} (${alert.companySymbol}) vient de franchir votre seuil cible de ${alert.targetPrice.toLocaleString()} FCFA (Prix constaté : ${simulatedPrice.toLocaleString()} FCFA).\n\nConsultez votre espace BourseClair pour ajuster votre simulation ou passer un ordre auprès de votre SGI.`,
      };
      createdLogs.push(emailLog);
    }

    // Create Push Log if PUSH or BOTH
    if (alert.notificationType === 'PUSH' || alert.notificationType === 'BOTH') {
      const pushLog: NotificationLog = {
        id: `log-push-${Date.now()}`,
        alertId: alert.id,
        type: 'PUSH',
        recipient: user?.name || 'App Mobile / Web BourseClair',
        symbol: alert.companySymbol,
        companyName: alert.companyName,
        targetPrice: alert.targetPrice,
        currentPrice: simulatedPrice,
        condition: alert.condition,
        sentAt: nowIso,
        subject: `🔔 Alerte Seuil BRVM - ${alert.companySymbol}`,
        message: `L'action ${alert.companySymbol} a atteint ${simulatedPrice.toLocaleString()} FCFA (seuil fixé : ${alert.targetPrice.toLocaleString()} FCFA).`,
      };
      createdLogs.push(pushLog);

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`🔔 Alerte Cours BourseClair : ${alert.companySymbol}`, {
            body: `L'action ${alert.companyName} a atteint ${simulatedPrice.toLocaleString()} FCFA (seuil : ${alert.targetPrice.toLocaleString()} FCFA)`,
          });
        } catch {
          // ignore
        }
      }
    }

    // Update alert status
    setPriceAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? {
              ...a,
              triggered: true,
              triggeredAt: nowIso,
              triggeredPrice: simulatedPrice,
            }
          : a
      )
    );

    setNotificationLogs(prev => [...createdLogs, ...prev]);
    return createdLogs;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        featureFlags,
        savedAnalyses,
        savedSimulations,
        priceAlerts,
        notificationLogs,
        learningProgress,
        loginEmail,
        registerEmail,
        verifyOtpPhone,
        loginGoogle,
        logout,
        toggleAdminMode,
        saveAnalysis,
        deleteAnalysis,
        saveSimulation,
        deleteSimulation,
        addPriceAlert,
        deletePriceAlert,
        togglePriceAlertActive,
        triggerSimulatedAlert,
        completeLearningModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
