import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { ProductPerformancePage } from './pages/ProductPerformancePage';
import { DataImportPage } from './pages/DataImportPage';
import { DatasetManagementPage } from './pages/DatasetManagementPage';
import { ForecastHistoryPage } from './pages/ForecastHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SimulationPage } from './pages/SimulationPage';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { Dataset } from './types';
import { api } from './lib/api';

function MainApp() {
  const { user, loading, loginAsDemo } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  // Navigation route
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot'>('landing');

  // Datasets
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  // Sync hash routing with browser history
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash) {
        if (['landing', 'login', 'register', 'forgot'].includes(hash)) {
          setAuthView(hash as any);
        } else {
          setCurrentRoute(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
  };

  const navigateAuth = (view: 'landing' | 'login' | 'register' | 'forgot') => {
    setAuthView(view);
    window.location.hash = `#/${view}`;
  };

  // Fetch datasets when user is logged in
  const refreshDatasets = async () => {
    try {
      const res = await api.getDatasets();
      setDatasets(res.datasets);
      if (res.datasets.length > 0 && !selectedDataset) {
        setSelectedDataset(res.datasets[0]);
      } else if (selectedDataset) {
        const stillExists = res.datasets.find((d) => d.id === selectedDataset.id);
        if (stillExists) {
          setSelectedDataset(stillExists);
        } else if (res.datasets.length > 0) {
          setSelectedDataset(res.datasets[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshDatasets();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg animate-pulse mb-3">
          S
        </div>
        <p className="text-xs font-semibold text-slate-500">Loading SmartSales Environment...</p>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authView === 'login') {
      return (
        <LoginPage
          onNavigateRegister={() => navigateAuth('register')}
          onNavigateForgotPassword={() => navigateAuth('forgot')}
          onSuccess={() => navigate('dashboard')}
        />
      );
    }

    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => navigateAuth('login')}
          onSuccess={() => navigate('dashboard')}
        />
      );
    }

    if (authView === 'forgot') {
      return <ForgotPasswordPage onNavigateLogin={() => navigateAuth('login')} />;
    }

    return (
      <LandingPage
        onLogin={() => navigateAuth('login')}
        onRegister={() => navigateAuth('register')}
        onDemoLogin={async () => {
          try {
            await loginAsDemo();
            toastSuccess('Welcome to SmartSales! Demo Analyst loaded.');
            navigate('dashboard');
          } catch (err: any) {
            toastError(err.message || 'Demo login failed');
          }
        }}
      />
    );
  }

  // Authenticated Application Flow
  return (
    <AppLayout
      currentRoute={currentRoute}
      onNavigate={navigate}
      selectedDataset={selectedDataset}
      setSelectedDataset={setSelectedDataset}
      datasets={datasets}
      refreshDatasets={refreshDatasets}
    >
      {currentRoute === 'dashboard' && (
        <DashboardOverview selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'analytics' && (
        <SalesAnalyticsPage selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'forecasting' && (
        <ForecastingPage selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'simulation' && (
        <SimulationPage selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'anomalies' && (
        <AnomalyDetectionPage selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'products' && (
        <ProductPerformancePage selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'import' && (
        <DataImportPage
          onImportSuccess={async (newDataset) => {
            await refreshDatasets();
            setSelectedDataset(newDataset);
            navigate('dashboard');
          }}
          onNavigate={navigate}
        />
      )}
      {currentRoute === 'datasets' && (
        <DatasetManagementPage
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={setSelectedDataset}
          refreshDatasets={refreshDatasets}
          onNavigate={navigate}
        />
      )}
      {currentRoute === 'history' && <ForecastHistoryPage onNavigate={navigate} />}
      {currentRoute === 'reports' && (
        <ReportsPage selectedDataset={selectedDataset} onNavigate={navigate} />
      )}
      {currentRoute === 'notifications' && <NotificationsPage />}
      {currentRoute === 'profile' && <UserProfilePage />}
      {currentRoute === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
