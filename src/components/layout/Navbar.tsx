import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Upload,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Database,
  Palette,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, AppTheme } from '../../context/ThemeContext';
import { Dataset } from '../../types';
import { Logo } from '../common/Logo';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeRouteName: string;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (d: Dataset) => void;
  onNavigate: (route: string) => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeRouteName,
  datasets,
  selectedDataset,
  onSelectDataset,
  onNavigate,
  unreadCount,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDatasetMenu, setShowDatasetMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Sidebar Toggle & Brand Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Logo size="sm" showWordmark={true} />

        <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700 font-light">/</span>
        <span className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {activeRouteName}
        </span>
      </div>

      {/* Zone 2: Active Dataset Switcher */}
      <div className="hidden md:flex items-center gap-3">
        {selectedDataset && (
          <div className="relative">
            <button
              onClick={() => setShowDatasetMenu(!showDatasetMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="max-w-[200px] truncate">{selectedDataset.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDatasetMenu && (
              <div
                className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1"
                onMouseLeave={() => setShowDatasetMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Active Dataset
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                  {datasets.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onSelectDataset(d);
                        setShowDatasetMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        selectedDataset.id === d.id
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/50 font-semibold text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {d.validRowCount.toLocaleString()} rows · {d.summaryStats.categoriesCount} categories
                      </span>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowDatasetMenu(false);
                      onNavigate('import');
                    }}
                    className="w-full py-1.5 text-xs font-medium text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-md hover:bg-indigo-100 transition-colors"
                  >
                    + Import New Sales CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Actions, Background/Theme Switcher & Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => onNavigate('import')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
          )}
        </button>

        {/* Background / Theme Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            title="Change background and appearance"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-violet-400" />
            )}
            <span className="hidden md:inline capitalize text-[11px] font-semibold">{theme}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showThemeMenu && (
            <div
              className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5"
              onMouseLeave={() => setShowThemeMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Background
              </div>
              <button
                onClick={() => {
                  setTheme('light');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left ${
                  theme === 'light'
                    ? 'bg-indigo-50 font-semibold text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Pure Crisp White</span>
              </button>

              <button
                onClick={() => {
                  setTheme('dark');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left ${
                  theme === 'dark'
                    ? 'bg-slate-800 font-semibold text-indigo-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Slate Charcoal</span>
              </button>

              <button
                onClick={() => {
                  setTheme('midnight');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left ${
                  theme === 'midnight'
                    ? 'bg-slate-800 font-semibold text-violet-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Midnight Indigo</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <span className="hidden lg:inline-block text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
              {user?.name || 'Account'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1 text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded inline-block">
                  {user?.role || 'Analyst'}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('profile');
                }}
                className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>User Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('settings');
                }}
                className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
