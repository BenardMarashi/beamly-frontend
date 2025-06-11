import React from "react";
import { Button, RadioGroup, Radio } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
import { Switch } from "@heroui/react";

// Define proper props interface
interface ThemeToggleProps {
  isDarkMode?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = React.memo(({
  isDarkMode: propIsDarkMode,
  onThemeChange
}) => {
  const { isDarkMode: contextIsDarkMode, setTheme } = useTheme();
  const { t } = useTranslation();
  
  // Use prop if provided, otherwise use context value
  const isDark = propIsDarkMode !== undefined ? propIsDarkMode : contextIsDarkMode;
  
  // Add enhanced theme toggle with system option
  const [showOptions, setShowOptions] = React.useState(false);
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
    setShowOptions(false);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Icon 
          icon="lucide:sun" 
          className={`text-lg ${!isDark ? 'text-beamly-secondary' : 'text-gray-400'}`}
        />
        <Switch
          size="sm"
          color="secondary"
          isSelected={isDark}
          onValueChange={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={t('settings.appearance.toggleTheme')}
          onClick={() => setShowOptions(prev => !prev)}
        />
        <Icon 
          icon="lucide:moon" 
          className={`text-lg ${isDark ? 'text-beamly-secondary' : 'text-gray-400'}`}
        />
      </div>
      
      {showOptions && (
        <div className={`absolute top-8 right-0 z-10 mt-2 p-2 rounded-md shadow-md ${isDark ? 'bg-[#010b29] border border-white/10' : 'bg-white border border-gray-100'}`}>
          <div className="flex flex-col gap-1">
            <Button 
              size="sm" 
              variant="light"
              className={isDark ? 'text-white justify-start' : 'text-gray-800 justify-start'}
              startContent={<Icon icon="lucide:sun" />}
              onPress={() => handleThemeChange('light')}
            >
              Light
            </Button>
            <Button 
              size="sm" 
              variant="light"
              className={isDark ? 'text-white justify-start' : 'text-gray-800 justify-start'}
              startContent={<Icon icon="lucide:moon" />}
              onPress={() => handleThemeChange('dark')}
            >
              Dark
            </Button>
            <Button 
              size="sm" 
              variant="light"
              className={isDark ? 'text-white justify-start' : 'text-gray-800 justify-start'}
              startContent={<Icon icon="lucide:monitor" />}
              onPress={() => handleThemeChange('system')}
            >
              System
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
ThemeToggle.displayName = 'ThemeToggle';