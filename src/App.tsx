import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import { MarketProvider } from './features/market/MarketContext';
import { Navbar } from './components/navigation/Navbar';
import { BottomNav } from './components/navigation/BottomNav';
import { Footer } from './components/navigation/Footer';
import { trackPageView } from './services/analytics';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { SearchPage } from './pages/Search/SearchPage';
import { CompanyDetailPage } from './pages/Company/CompanyDetailPage';
import { SimulationPage } from './pages/Simulation/SimulationPage';
import { ComparisonPage } from './pages/Comparison/ComparisonPage';
import { LearningPage } from './pages/Learning/LearningPage';
import { AuthPage } from './pages/Auth/AuthPage';
import { AccountPage } from './pages/Account/AccountPage';
import { AdminPage } from './pages/Admin/AdminPage';
import { PrivacyPolicyPage } from './pages/Privacy/PrivacyPolicyPage';
import { SgiDirectoryPage } from './pages/SGI/SgiDirectoryPage';
import { DividendCalendarPage } from './pages/Dividends/DividendCalendarPage';
import { PriceAlertsManager } from './components/alerts/PriceAlertsManager';
import { OnboardingTour } from './components/common/OnboardingTour';
import { SEOHead } from './components/common/SEOHead';

function AppContent() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const [pathOnly] = currentPath.split('?');
    const pageTitleMap: Record<string, string> = {
      '/': 'Accueil',
      '/search': 'Recherche',
      '/simulation': 'Simulateur DCA',
      '/alerts': 'Gestion des Alertes',
      '/comparison': 'Comparateur de Valeurs',
      '/learning': 'Guide & Modules BRVM',
      '/auth': 'Connexion & Inscription',
      '/account': 'Mon Espace Client BRVM',
      '/espace-client': 'Mon Espace Client BRVM',
      '/client': 'Mon Espace Client BRVM',
      '/admin': 'Dashboard Admin & Analytics',
      '/privacy': 'Politique de Confidentialité',
      '/sgi': 'Annuaire Officiel des SGI',
      '/calendrier-dividendes': 'Calendrier des Dividendes BRVM',
      '/dividendes': 'Calendrier des Dividendes BRVM',
    };
    const title = pageTitleMap[pathOnly] || (pathOnly.startsWith('/company/') ? 'Fiche Entreprise' : 'Page');
    trackPageView(currentPath, title, user);
  }, [currentPath, user]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Helper route parser
  const renderPage = () => {
    const [pathOnly, searchOnly] = currentPath.split('?');
    const queryParams = new URLSearchParams(searchOnly || '');

    if (pathOnly === '/' || pathOnly === '') {
      return <HomePage onNavigate={navigate} />;
    }

    if (pathOnly === '/search') {
      const q = queryParams.get('q') || '';
      return <SearchPage initialQuery={q} onNavigate={navigate} />;
    }

    if (pathOnly.startsWith('/company/')) {
      const symbol = pathOnly.split('/company/')[1] || 'SNTS';
      return <CompanyDetailPage symbol={symbol} onNavigate={navigate} />;
    }

    if (pathOnly === '/simulation' || pathOnly === '/profil-investisseur' || pathOnly === '/calculateur-frais' || pathOnly === '/guide-pas-a-pas') {
      const symbol = queryParams.get('symbol') || undefined;
      return <SimulationPage initialSymbol={symbol} onNavigate={navigate} />;
    }

    if (pathOnly === '/alerts') {
      const symbol = queryParams.get('symbol') || 'SNTS';
      return <PriceAlertsManager defaultSymbol={symbol} onNavigate={navigate} />;
    }

    if (pathOnly === '/comparison') {
      const symbol = queryParams.get('symbol') || undefined;
      return <ComparisonPage initialSymbol={symbol} onNavigate={navigate} />;
    }

    if (pathOnly === '/learning' || pathOnly.startsWith('/learning/')) {
      return <LearningPage onNavigate={navigate} />;
    }

    if (pathOnly.startsWith('/auth')) {
      return <AuthPage onNavigate={navigate} />;
    }

    if (pathOnly.startsWith('/account') || pathOnly.startsWith('/espace-client') || pathOnly.startsWith('/client')) {
      return <AccountPage onNavigate={navigate} />;
    }

    if (pathOnly === '/admin') {
      return <AdminPage onNavigate={navigate} />;
    }

    if (pathOnly === '/privacy') {
      return <PrivacyPolicyPage onNavigate={navigate} />;
    }

    if (pathOnly === '/sgi') {
      return <SgiDirectoryPage onNavigate={navigate} />;
    }

    if (pathOnly === '/calendrier-dividendes' || pathOnly === '/dividendes') {
      return <DividendCalendarPage onNavigate={navigate} />;
    }

    // Default Fallback Page
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
      <SEOHead currentPath={currentPath} />
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderPage()}
      </main>

      <Footer onNavigate={navigate} />
      <BottomNav currentPath={currentPath} onNavigate={navigate} />
      <OnboardingTour onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <AppContent />
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
