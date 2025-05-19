
"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import type { Theme } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'pennyPincherTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>(THEME_STORAGE_KEY, 'system');
  const [currentTheme, setCurrentTheme] = useState<Theme>('light'); // Actual applied theme

  useEffect(() => {
    const applyTheme = (themeToApply: Theme) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (themeToApply === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
        setCurrentTheme(systemTheme);
      } else {
        root.classList.add(themeToApply);
        setCurrentTheme(themeToApply);
      }
    };

    applyTheme(storedTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (storedTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setStoredTheme(newTheme);
  }, [setStoredTheme]);

  const toggleTheme = useCallback(() => {
    setStoredTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, [setStoredTheme]);


  return (
    <ThemeContext.Provider value={{ theme: storedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
