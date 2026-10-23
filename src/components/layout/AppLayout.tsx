import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Dataset, NotificationItem } from '../../types';
import { api } from '../../lib/api';

interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  selectedDataset: Dataset | null;
  setSelectedDataset: (d: Dataset | null) => void;
  datasets: Dataset[];
  refreshDatasets: () => Promise<void>;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onNavigate,
  selectedDataset,
  setSelectedDataset,
  datasets,
  refreshDatasets,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications || []);
      } catch (err) {
        // Silently skip if user unauthenticated
      }
    };
    fetchNotifications();
  }, [currentRoute]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    analytics: 'Sales Analytics',
    forecasting: 'Sales Forecasting',
    simulation: 'What-If Sales Simulation',
    anomalies: 'Anomaly Scanner',
    products: 'Product Performance',
    import: 'Data Ingestion & ETL',
    datasets: 'Dataset Management',
    history: 'Forecast History',
    reports: 'Executive Reports',
    notifications: 'Notifications',
    profile: 'User Profile',
    settings: 'Settings',
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Navbar
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setMobileSidebarOpen(!mobileSidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          activeRouteName={routeNames[currentRoute] || 'SmartSales'}
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={setSelectedDataset}
          onNavigate={onNavigate}
          unreadCount={unreadCount}
        />

        {/* Scrollable Viewport Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950/80 p-4 sm:p-6 lg:p-8 transition-colors">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
