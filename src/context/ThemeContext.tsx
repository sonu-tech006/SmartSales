import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark' | 'midnight';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('smartsales_theme') as AppTheme;
    if (saved === 'dark' || saved === 'midnight' || saved === 'light') {
      return saved;
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('smartsales_theme', theme);
    const root = document.documentElement;

    // Reset theme classes
    root.classList.remove('dark', 'theme-midnight', 'theme-indigo');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'midnight';
      return 'light';
    });
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const isDark = theme === 'dark' || theme === 'midnight';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
