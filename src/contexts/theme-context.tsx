import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  systemThemeIsDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
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
  // Get initial theme - default to dark without localStorage
  const [theme, setThemeState] = useState<Theme>('dark');
  
  // Derived state
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark');
  
  // Add system theme detection
  const [systemThemeIsDark, setSystemThemeIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemThemeIsDark(e.matches);
        if (theme === 'system') {
          setIsDarkMode(e.matches);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  
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
  };
  
  // Apply theme class to body
  useEffect(() => {
    if (theme === 'system') {
      if (systemThemeIsDark) {
        document.body.className = 'dark-mode';
      } else {
        document.body.className = 'light-mode';
      }
    } else {
      document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
    }
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

export const useTheme = () => useContext(ThemeContext);

ThemeProvider.displayName = 'ThemeProvider';