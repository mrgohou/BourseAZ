import { db, collection, addDoc, getDocs, query, orderBy, limit, setDoc, doc } from '../lib/firebase';
import { UserProfile } from '../types';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  path: string;
  pageTitle: string;
  eventType: 'PAGE_VIEW' | 'SIGN_UP' | 'LOGIN' | 'SIMULATION_CREATED' | 'ALERT_SET' | 'SGI_CLICKED' | 'SEARCH' | 'EXPORT_REPORT';
  eventDetails?: string;
  deviceType: string;
  timestamp: string;
}

export interface UserAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  authProvider: 'EMAIL' | 'GOOGLE' | 'PHONE';
  lastLoginAt: string;
  createdAt: string;
  totalVisits?: number;
}

const LOCAL_STORAGE_ANALYTICS_KEY = 'bourseclair_user_analytics_logs';
const LOCAL_STORAGE_USERS_KEY = 'bourseclair_registered_accounts';

// Get device type helper
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/ipad|tablet/i.test(ua)) return 'Tablette';
  return 'Desktop';
};

/**
 * Track page views and user navigation
 */
export const trackPageView = async (path: string, pageTitle: string, user?: UserProfile | null) => {
  const event: AnalyticsEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId: user?.id || 'ANONYMOUS',
    userEmail: user?.email || 'Visiteur Anonyme',
    userName: user?.name,
    path,
    pageTitle,
    eventType: 'PAGE_VIEW',
    eventDetails: `Consultation de la page ${pageTitle} (${path})`,
    deviceType: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  // Save locally
  saveEventLocally(event);

  // Save to Firestore
  try {
    const colRef = collection(db, 'user_analytics');
    await addDoc(colRef, event);
  } catch (err) {
    console.warn("Firestore analytics track error (local fallback active):", err);
  }
};

/**
 * Track specific user interactions (e.g. Sign up, SGI clicked, Simulation run)
 */
export const trackUserAction = async (
  eventType: AnalyticsEvent['eventType'],
  eventDetails: string,
  user?: UserProfile | null,
  path: string = '/'
) => {
  const event: AnalyticsEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId: user?.id || 'ANONYMOUS',
    userEmail: user?.email || 'Visiteur Anonyme',
    userName: user?.name,
    path,
    pageTitle: path,
    eventType,
    eventDetails,
    deviceType: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  // Save locally
  saveEventLocally(event);

  // Save to Firestore
  try {
    const colRef = collection(db, 'user_analytics');
    await addDoc(colRef, event);
  } catch (err) {
    console.warn("Firestore user action track error:", err);
  }
};

/**
 * Helper to store event in localStorage buffer for instant dashboard updates
 */
const saveEventLocally = (event: AnalyticsEvent) => {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_ANALYTICS_KEY);
    const existing: AnalyticsEvent[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [event, ...existing].slice(0, 500); // Keep last 500 events
    localStorage.setItem(LOCAL_STORAGE_ANALYTICS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Save or update user profile account record in Firestore & Local storage
 */
export const recordUserAccount = async (account: UserAccountRecord) => {
  // Update local storage
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const existingAccounts: any[] = existingStr ? JSON.parse(existingStr) : [];
    const index = existingAccounts.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase() || a.id === account.uid);
    if (index >= 0) {
      existingAccounts[index] = { ...existingAccounts[index], ...account, lastLoginAt: new Date().toISOString() };
    } else {
      existingAccounts.push({ ...account, id: account.uid });
    }
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(existingAccounts));
  } catch (e) {
    console.warn("Local storage accounts update error:", e);
  }

  // Save in Firestore `users` collection
  try {
    const userDocRef = doc(db, 'users', account.uid);
    await setDoc(userDocRef, {
      ...account,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore record user account error:", err);
  }
};

/**
 * Fetch all registered user accounts from Firestore & Local Storage
 */
export const fetchRegisteredAccounts = async (): Promise<UserAccountRecord[]> => {
  const accountsMap = new Map<string, UserAccountRecord>();

  // 1. Seed default accounts
  const SEEDED_DEFAULT: UserAccountRecord[] = [
    {
      uid: 'usr-investor-demo',
      email: 'investisseur@bourseclair.ci',
      displayName: 'Koffi Amadou',
      phone: '+22507000000',
      role: 'USER',
      authProvider: 'EMAIL',
      lastLoginAt: '2026-08-13T10:00:00.000Z',
      createdAt: '2025-01-15T08:30:00.000Z',
      totalVisits: 28,
    },
    {
      uid: 'usr-admin-demo',
      email: 'admin@bourseclair.ci',
      displayName: 'Administrateur BRVM',
      phone: '+22501020304',
      role: 'ADMIN',
      authProvider: 'EMAIL',
      lastLoginAt: '2026-08-13T11:15:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z',
      totalVisits: 142,
    },
    {
      uid: 'usr-demo-yamoussoukro',
      email: 'yamoussoukro.epargne@gmail.com',
      displayName: 'Fatou Traoré',
      phone: '+22505554433',
      role: 'USER',
      authProvider: 'GOOGLE',
      lastLoginAt: '2026-08-12T16:20:00.000Z',
      createdAt: '2026-02-01T14:10:00.000Z',
      totalVisits: 12,
    },
    {
      uid: 'usr-demo-dakar',
      email: 'ousmane.diallo@richbourse.sn',
      displayName: 'Ousmane Diallo',
      phone: '+221776543210',
      role: 'USER',
      authProvider: 'PHONE',
      lastLoginAt: '2026-08-11T09:45:00.000Z',
      createdAt: '2026-02-10T11:00:00.000Z',
      totalVisits: 9,
    }
  ];

  SEEDED_DEFAULT.forEach(acc => accountsMap.set(acc.email.toLowerCase(), acc));

  // 2. Read local storage
  try {
    const localStr = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (localStr) {
      const localAccs: any[] = JSON.parse(localStr);
      localAccs.forEach(acc => {
        if (acc.email) {
          accountsMap.set(acc.email.toLowerCase(), {
            uid: acc.uid || acc.id || `usr-${Math.random()}`,
            email: acc.email,
            displayName: acc.displayName || acc.name || acc.email.split('@')[0],
            phone: acc.phone,
            role: acc.role || 'USER',
            authProvider: acc.authProvider || 'EMAIL',
            lastLoginAt: acc.lastLoginAt || acc.createdAt || new Date().toISOString(),
            createdAt: acc.createdAt || new Date().toISOString(),
            totalVisits: acc.totalVisits || 1,
          });
        }
      });
    }
  } catch (err) {
    console.warn("Local storage read accounts error:", err);
  }

  // 3. Fetch from Firestore `users` collection
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email) {
          accountsMap.set(data.email.toLowerCase(), {
            uid: docSnap.id || data.uid,
            email: data.email,
            displayName: data.displayName || data.name || data.email.split('@')[0],
            phone: data.phone,
            role: data.role || 'USER',
            authProvider: data.authProvider || 'EMAIL',
            lastLoginAt: data.lastLoginAt || data.createdAt || new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
            totalVisits: data.totalVisits || 5,
          });
        }
      });
    }
  } catch (err) {
    console.warn("Firestore fetch users warning:", err);
  }

  return Array.from(accountsMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Fetch all navigation and activity analytics events
 */
export const fetchAnalyticsLogs = async (): Promise<AnalyticsEvent[]> => {
  const eventsList: AnalyticsEvent[] = [];

  // Local storage events
  try {
    const localStr = localStorage.getItem(LOCAL_STORAGE_ANALYTICS_KEY);
    if (localStr) {
      const parsed: AnalyticsEvent[] = JSON.parse(localStr);
      eventsList.push(...parsed);
    }
  } catch {
    // ignore
  }

  // Firestore events
  try {
    const colRef = collection(db, 'user_analytics');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.docs.forEach(docSnap => {
        eventsList.push({ id: docSnap.id, ...docSnap.data() } as AnalyticsEvent);
      });
    }
  } catch (err) {
    console.warn("Firestore fetch analytics warning:", err);
  }

  // If empty, supply representative default logs for demo
  if (eventsList.length === 0) {
    const now = Date.now();
    return [
      {
        id: 'evt-seeded-1',
        userId: 'usr-investor-demo',
        userEmail: 'investisseur@bourseclair.ci',
        userName: 'Koffi Amadou',
        path: '/sgi',
        pageTitle: 'SGI Directory',
        eventType: 'SGI_CLICKED',
        eventDetails: 'Consultation fiche SGI - Société Générale Capital Bourse',
        deviceType: 'Mobile',
        timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 'evt-seeded-2',
        userId: 'usr-investor-demo',
        userEmail: 'investisseur@bourseclair.ci',
        userName: 'Koffi Amadou',
        path: '/simulation',
        pageTitle: 'Simulateur d\'Investissement',
        eventType: 'SIMULATION_CREATED',
        eventDetails: 'Simulation DCA Sonatel - 50 000 FCFA / mois',
        deviceType: 'Desktop',
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'evt-seeded-3',
        userId: 'usr-demo-yamoussoukro',
        userEmail: 'yamoussoukro.epargne@gmail.com',
        userName: 'Fatou Traoré',
        path: '/auth',
        pageTitle: 'Connexion / Inscription',
        eventType: 'SIGN_UP',
        eventDetails: 'Création de compte via Google OAuth',
        deviceType: 'Mobile',
        timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
      },
      {
        id: 'evt-seeded-4',
        userId: 'usr-demo-dakar',
        userEmail: 'ousmane.diallo@richbourse.sn',
        userName: 'Ousmane Diallo',
        path: '/learning',
        pageTitle: 'Guide d\'Apprentissage BRVM',
        eventType: 'PAGE_VIEW',
        eventDetails: 'Lecture du module 2 : Comprendre le Dividende et le PER',
        deviceType: 'Tablette',
        timestamp: new Date(now - 1000 * 60 * 320).toISOString(),
      },
    ];
  }

  // Deduplicate by ID and sort descending
  const uniqueMap = new Map<string, AnalyticsEvent>();
  eventsList.forEach(e => uniqueMap.set(e.id, e));
  return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Send email report simulation function
 */
export const triggerEmailReport = async (
  recipientEmail: string,
  accountsCount: number,
  eventsCount: number
): Promise<{ success: boolean; message: string }> => {
  // Simulate API delay
  await new Promise(res => setTimeout(res, 800));

  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'UTC' });
  const message = `Rapport d'activité Bourse Facile envoyé avec succès à ${recipientEmail} (${timestamp}).
Contenu : ${accountsCount} comptes utilisateurs enregistrés, ${eventsCount} événements de navigation analysés.`;

  // Log action
  trackUserAction('EXPORT_REPORT', `Envoi rapport d'analyse par email à ${recipientEmail}`);

  return {
    success: true,
    message,
  };
};
