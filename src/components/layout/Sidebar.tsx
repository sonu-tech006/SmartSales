import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  TrendingUp,
  Package,
  UploadCloud,
  Layers,
  History,
  FileSpreadsheet,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { Logo } from '../common/Logo';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Sales Analytics', icon: LineChart },
    { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
    { id: 'simulation', label: 'What-If Simulator', icon: Sliders, badge: 'NEW' },
    { id: 'anomalies', label: 'Anomaly Scanner', icon: AlertTriangle, badge: 'NEW' },
    { id: 'products', label: 'Product Performance', icon: Package },
  ];

  const dataNavItems = [
    { id: 'import', label: 'Data Import (ETL)', icon: UploadCloud },
    { id: 'datasets', label: 'Datasets', icon: Layers },
    { id: 'history', label: 'Forecast History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const adminNavItems = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavGroup = (title: string, items: typeof mainNavItems) => (
    <div className="mb-4">
      {!collapsed && (
        <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </div>
      )}
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-sm bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto p-3">
          {/* Brand Header inside Sidebar */}
          <div className="flex items-center justify-between mb-4 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Logo size={collapsed ? 'sm' : 'md'} showWordmark={!collapsed} />
          </div>

          {/* Nav Items */}
          <div className="flex-1">
            {renderNavGroup('Core Analytics', mainNavItems)}
            {renderNavGroup('Data Management', dataNavItems)}
            {renderNavGroup('Configuration', adminNavItems)}
          </div>

          {/* Bottom Card / Quick Stat */}
          {!collapsed && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Forecasting Engine</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Holt-Winters double exponential smoothing with 95% confidence intervals.
              </p>
            </div>
          )}

          {/* Collapse Button (Desktop) */}
          <div className="hidden lg:block pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
