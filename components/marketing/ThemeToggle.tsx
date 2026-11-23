'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useMarketingTheme } from './ThemeContext';

export function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const { theme, toggleTheme } = useMarketingTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (mobile) {
      return (
        <div className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 opacity-0" />
      );
    }
    return (
      <div className="size-9 rounded-md border border-slate-200 bg-white opacity-0" />
    );
  }

  if (mobile) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-3.5 py-2 text-sm font-medium rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Toggle dark and light theme"
      >
        <span className="flex items-center gap-2">
          {theme === 'dark' ? (
            <>
              <Sun className="size-4 text-amber-400" />
              <span className="text-slate-200">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="size-4 text-slate-600" />
              <span className="text-slate-700">Dark Mode</span>
            </>
          )}
        </span>
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            theme === 'dark'
              ? 'bg-amber-400/20 text-amber-300'
              : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          {theme === 'dark' ? 'DARK' : 'WHITE'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`size-9 flex items-center justify-center rounded-md border transition-all cursor-pointer ${
        theme === 'dark'
          ? 'border-slate-700 bg-slate-800/90 text-amber-400 hover:bg-slate-800 hover:border-slate-600 shadow-xs'
          : 'border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
      }`}
      title={theme === 'dark' ? 'Switch to White mode' : 'Switch to Dark mode'}
      aria-label={theme === 'dark' ? 'Switch to White mode' : 'Switch to Dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="size-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-slate-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
