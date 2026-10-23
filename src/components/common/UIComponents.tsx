import React from 'react';
import { LucideIcon, AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

// Stat Card
export interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  change,
  icon: Icon,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              change.positive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {change.positive ? '↑' : '↓'} {change.value}
          </span>
        )}
      </div>
      {subValue && (
        <div className="mt-1 text-xs text-slate-500 font-medium">
          {subValue}
        </div>
      )}
    </div>
  );
};

// Empty State
export interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

// Skeleton Loader
export const SkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-1/4"></div>
      <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-10 bg-slate-100 rounded-lg w-full"></div>
        ))}
      </div>
    </div>
  );
};

// Alert Banner
export const AlertBanner: React.FC<{
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
}> = ({ type = 'info', title, message, onClose }) => {
  const styles = {
    info: 'bg-blue-50/80 border-blue-200 text-blue-900',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
    error: 'bg-rose-50/80 border-rose-200 text-rose-900',
  };

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 text-xs">
        {title && <span className="font-semibold block mb-0.5">{title}</span>}
        <span className="leading-relaxed">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
