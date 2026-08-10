import React, { useState, useEffect } from 'react';
import { AuthProvider } from './features/auth/AuthContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import { Navbar } from './components/navigation/Navbar';
import { BottomNav } from './components/navigation/BottomNav';
import { Footer } from './components/navigation/Footer';

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
import { PriceAlertsManager } from './components/alerts/PriceAlertsManager';

export default function App() {
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

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (pathOnly === '/simulation') {
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

    if (pathOnly.startsWith('/account')) {
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

    // Default Fallback Page
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
          <Navbar currentPath={currentPath} onNavigate={navigate} />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {renderPage()}
          </main>

          <Footer onNavigate={navigate} />
          <BottomNav currentPath={currentPath} onNavigate={navigate} />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
