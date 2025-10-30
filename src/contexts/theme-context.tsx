import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark'; // Removed 'system' option

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDarkMode: true,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = React.memo(({ children }) => {
  // Get initial theme from localStorage or default to dark
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      // Only accept 'light' or 'dark', default to 'dark' for any other value
      if (savedTheme === 'light') {
        return 'light';
      }
    }
    return 'dark'; // Always default to dark
  });
  
  // Derived state for isDarkMode
  const isDarkMode = theme === 'dark';
  
  // Define setTheme function
  const setTheme = (newTheme: Theme) => {
    // Ensure only 'light' or 'dark' can be set
    const validTheme = newTheme === 'light' ? 'light' : 'dark';
    setThemeState(validTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', validTheme);
    }
  };
  
  // Define toggleTheme function
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Apply theme class to body and documentElement
  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'light', 'dark-mode', 'light-mode');
    document.body.classList.remove('dark', 'light', 'dark-mode', 'light-mode');
    
    if (theme === 'dark') {
      // Add dark mode classes
      document.documentElement.classList.add('dark', 'dark-mode');
      document.body.classList.add('dark', 'dark-mode');
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Add light mode classes
      document.documentElement.classList.add('light', 'light-mode');
      document.body.classList.add('light', 'light-mode');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Dispatch custom event for components that need to know about theme changes
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }, [theme]);
  
  // Context value
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

ThemeProvider.displayName = 'ThemeProvider';