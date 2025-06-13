// Update your src/contexts/theme-context.tsx with this fix

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  systemThemeIsDark: boolean;
};

const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDarkMode: true,
  toggleTheme: () => {},
  systemThemeIsDark: false
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = React.memo(({ children }) => {
  // Get initial theme from localStorage, default to dark
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      return storedTheme as Theme;
    }
    
    // Default to dark
    return 'dark';
  });

  // Derived state
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    if (theme === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  // Add system theme detection
  const [systemThemeIsDark, setSystemThemeIsDark] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // Listen for system theme changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemThemeIsDark(e.matches);
        if (localStorage.getItem('theme') === 'system') {
          setIsDarkMode(e.matches);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  // Define toggleTheme function
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Add support for system theme preference
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (newTheme === 'system') {
      setIsDarkMode(systemThemeIsDark);
    } else {
      setIsDarkMode(newTheme === 'dark');
    }
    localStorage.setItem('theme', newTheme);
  };
  
  // Apply theme class to body immediately on mount and when theme changes
  React.useEffect(() => {
    // Remove all theme classes first
    document.body.classList.remove('dark-mode', 'light-mode');
    // Remove any background color inline styles that might have been set
    document.body.style.backgroundColor = '';
    
    if (theme === 'system') {
      if (systemThemeIsDark) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.add('light-mode');
      }
    } else {
      document.body.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode');
    }
    
    // Force a repaint to ensure styles are applied
    document.body.offsetHeight;
  }, [theme, systemThemeIsDark]);
  
  // Expose system theme option
  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    setTheme,
    theme,
    systemThemeIsDark
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});

export const useTheme = () => React.useContext(ThemeContext);

ThemeProvider.displayName = 'ThemeProvider';
export const ThemeProviderProps = {};