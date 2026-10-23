import React from 'react';
import {
  TrendingUp,
  LineChart,
  Layers,
  ShieldCheck,
  ArrowRight,
  Database,
  BarChart3,
  Cpu,
} from 'lucide-react';

import { Logo } from '../components/common/Logo';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
  onDemoLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onRegister,
  onDemoLogin,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Top Bar adhering to 3-zone contract */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-30">
        <Logo size="md" />

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0">
            Capabilities
          </a>
          <a href="#models" className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0">
            Forecasting Models
          </a>
          <a href="#etl" className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0">
            ETL Pipeline
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onLogin}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors whitespace-nowrap"
          >
            Sign In
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Enterprise Sales Forecasting & Machine Learning Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 max-w-4xl mx-auto leading-tight">
            Predict Future Revenue with Mathematical Precision
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            End-to-end sales forecasting platform. Ingest custom CSV sales data, validate schemas through an automated ETL pipeline, and generate Holt-Winters time-series forecasts with real holdout test metrics.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onDemoLogin}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore Demo Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRegister}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Create Free Account
            </button>
          </div>

          <div className="mt-12 text-xs text-slate-500 flex items-center justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Real Holdout Validation (MAE, RMSE, MAPE)
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Automated CSV Profiling & ETL
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-violet-600" />
              No Fabricated Predictions
            </span>
          </div>
        </section>

        {/* Core Pillars */}
        <section id="features" className="py-16 px-6 lg:px-12 bg-slate-50/70 border-y border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-slate-900">Engineered for Data Scientists & Analysts</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Every calculation uses genuine statistical time-series formulas and real ingested data rows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Automated ETL Pipeline</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sniffs CSV delimiters, detects data types, maps date and revenue columns, detects duplicates and missing dates, and logs processing time in milliseconds.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 mb-4">
                  <LineChart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Statistical Forecasting</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fit Double Exponential Smoothing (Holt's Linear) with grid search parameter optimization ($\alpha, \beta$), or Linear Trend with Day-of-Week cyclical seasonality.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Real Model Evaluation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Strict chronological train/test split. Computes genuine MAE, RMSE, and MAPE against holdout points without lookahead bias or fabricated accuracy numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ready to start */}
        <section className="py-20 px-6 lg:px-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Forecast Your Sales?</h2>
          <p className="text-sm text-slate-600 mb-8 max-w-lg mx-auto">
            Test immediately with our pre-loaded 12-month Global Retail dataset or upload your own company CSV file.
          </p>
          <button
            onClick={onDemoLogin}
            className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
          >
            <span>Launch Live Environment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 lg:px-12 border-t border-slate-100 text-center text-xs text-slate-500">
        <div>SmartSales Platform · Built with React, TypeScript, Express, and Statistical Time-Series Modeling</div>
      </footer>
    </div>
  );
};
