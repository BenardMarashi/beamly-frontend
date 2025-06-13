import React from "react";
import { Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface ThemeToggleProps {
  isDarkMode?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = React.memo(({
  isDarkMode: propIsDarkMode,
  onThemeChange
}) => {
  const { isDarkMode: contextIsDarkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  // Use prop if provided, otherwise use context value
  const isDark = propIsDarkMode !== undefined ? propIsDarkMode : contextIsDarkMode;
  
  const handleToggle = () => {
    toggleTheme();
    if (onThemeChange) {
      onThemeChange(!isDark);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Icon 
        icon="lucide:sun" 
        className={`text-lg ${!isDark ? 'text-beamly-secondary' : 'text-gray-400'}`}
      />
      <Switch
        size="sm"
        color="secondary"
        isSelected={isDark}
        onValueChange={handleToggle}
        aria-label={t('settings.appearance.toggleTheme')}
      />
      <Icon 
        icon="lucide:moon" 
        className={`text-lg ${isDark ? 'text-beamly-secondary' : 'text-gray-400'}`}
      />
    </div>
  );
});

ThemeToggle.displayName = 'ThemeToggle';