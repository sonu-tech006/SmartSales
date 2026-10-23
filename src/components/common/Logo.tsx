import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  badgeText?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  badgeText,
  className = '',
}) => {
  const iconSizes = {
    sm: { w: 26, h: 26, textSize: 'text-base', badgeSize: 'text-[9px] px-1 py-0.2' },
    md: { w: 34, h: 34, textSize: 'text-lg', badgeSize: 'text-[10px] px-1.5 py-0.5' },
    lg: { w: 44, h: 44, textSize: 'text-2xl', badgeSize: 'text-xs px-2 py-0.5' },
  };

  const currentSize = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Bespoke Geometric Trend + Monogram SVG Logo */}
      <svg
        width={currentSize.w}
        height={currentSize.h}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
      >
        <defs>
          <linearGradient id="ssLogoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="ssLogoGradAccent" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <filter id="ssGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4F46E5" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Squircle Background Base */}
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="11"
          fill="url(#ssLogoGradPrimary)"
          filter="url(#ssGlow)"
        />

        {/* Upward Ascending Trend Grid Pillars */}
        <rect x="9" y="27" width="4" height="8" rx="2" fill="white" fillOpacity="0.45" />
        <rect x="16" y="20" width="4" height="15" rx="2" fill="white" fillOpacity="0.65" />
        <rect x="23" y="14" width="4" height="21" rx="2" fill="white" fillOpacity="0.85" />
        <rect x="30" y="9" width="4" height="26" rx="2" fill="white" />

        {/* Dynamic Curved 'S' Trend Swoosh */}
        <path
          d="M10 25 C14 18, 20 31, 31 12"
          stroke="url(#ssLogoGradAccent)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Target Prediction Apex Node */}
        <circle cx="31" cy="12" r="3" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.5" />
      </svg>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${currentSize.textSize}`}>
            Smart<span className="text-indigo-600 dark:text-indigo-400">Sales</span>
          </span>
          {badgeText && (
            <span
              className={`font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/80 rounded-md ml-1 ${currentSize.badgeSize}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
