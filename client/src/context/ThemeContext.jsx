import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    // Read from localStorage on mount, fallback to system
    const storedTheme = localStorage.getItem('themePreference');
    if (storedTheme) {
      setThemeMode(storedTheme);
    } else {
      setThemeMode('system');
      localStorage.setItem('themePreference', 'system');
    }
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      if (themeMode === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isSystemDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const selectTheme = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themePreference', mode);
  };

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themePreference', next);
      return next;
    });
  };

  // Expose active theme ('light' | 'dark') for normal image assets or logo logic
  const activeTheme = themeMode === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : themeMode;

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, themeMode, selectTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
