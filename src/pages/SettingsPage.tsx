import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Database,
  Server,
  Key,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [emailNotifs, setEmailNotifs] = useState(user?.preferences?.emailNotifications ?? true);
  const [defaultHorizon, setDefaultHorizon] = useState(user?.preferences?.defaultHorizon || 30);
  const [saving, setSaving] = useState(false);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const res = await api.updateProfile({
        preferences: {
          theme,
          emailNotifications: emailNotifs,
          defaultHorizon,
        },
      });
      updateUser(res.user);
      toastSuccess('Preferences updated');
    } catch (err: any) {
      toastError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Platform & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure appearance, model execution defaults, and database connectivity parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance & Preferences */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-indigo-600" />
            <span>User Interface & Forecasting Preferences</span>
          </h2>

          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Theme & Background</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Clean White</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Slate</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('midnight')}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                  theme === 'midnight'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-violet-600 inline-block shrink-0" />
                <span>Midnight Indigo</span>
              </button>
            </div>
          </div>

          {/* Default Horizon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Default Forecast Horizon
            </label>
            <select
              value={defaultHorizon}
              onChange={(e) => setDefaultHorizon(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value={7}>7 Days (Short-term Weekly Cycle)</option>
              <option value={30}>30 Days (Standard Monthly Horizon)</option>
              <option value={90}>90 Days (Quarterly Forecast)</option>
            </select>
          </div>

          {/* Notifications Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700">
                Receive email alerts upon ETL validation errors or high model MAPE warnings
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Database & Infrastructure Architecture */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Database & Ingestion Engine Configuration</span>
          </h2>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active Storage:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>File-Backed Persistent JSON Store (.data/db.json)</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">MongoDB Atlas Driver:</span>
              <span className="font-mono text-slate-800">Ready via MONGODB_URI</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Authentication Driver:</span>
              <span className="font-mono text-slate-800">PBKDF2 SHA-512 + Signed Tokens</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Time-Series Processor:</span>
              <span className="font-mono text-slate-800">Holt-Winters (Double Exp)</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-700 block">External Database Integration Parameters</span>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] space-y-1">
              <div># Set in .env for production deployment</div>
              <div>MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartsales</div>
              <div>MONGODB_DATABASE=smartsales</div>
              <div>SECRET_KEY=production-cryptographic-signing-key</div>
              <div>CORS_ORIGINS=*</div>
              <div>PORT=3000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
