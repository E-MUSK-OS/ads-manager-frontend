'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function MarketingThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('marketing_theme') as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch {
      // Ignore if localStorage unavailable
    }
    setMounted(true);

    return () => {
      // Clean up when leaving marketing routes so dashboard & auth pages are never affected
      document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    try {
      localStorage.setItem('marketing_theme', next);
      document.documentElement.setAttribute('data-theme', next);
    } catch {
      // Ignore
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('marketing_theme', t);
      document.documentElement.setAttribute('data-theme', t);
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div data-theme={theme} className={theme === 'dark' ? 'dark marketing-theme-root min-h-screen' : 'marketing-theme-root min-h-screen'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useMarketingTheme() {
  return useContext(ThemeContext);
}
