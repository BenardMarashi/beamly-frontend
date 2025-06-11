import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "../contexts/theme-context";

// Define proper props interface
interface LanguageToggleProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  isDarkMode?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  currentLanguage,
  onLanguageChange,
  isDarkMode = true
}) => {
  const { i18n, t } = useTranslation();
  const { isDarkMode: themeIsDarkMode } = useTheme();
  
  const languages = [
    { code: "en", name: t('settings.language.english'), flag: "logos:uk" },
    { code: "sq", name: t('settings.language.albanian'), flag: "logos:albania" }
  ];
  
  // Use currentLanguage prop if provided, otherwise use i18n.language
  const langCode = currentLanguage || i18n.language;
  const currentLang = languages.find(lang => lang.code === langCode) || languages[0];
  
  const handleLanguageChange = (langCode: string) => {
    if (onLanguageChange) {
      onLanguageChange(langCode);
    } else {
      i18n.changeLanguage(langCode);
      localStorage.setItem('lang', langCode);
    }
  };

  return (
    <Dropdown placement="top">
      <DropdownTrigger>
        <Button 
          variant="light"
          className={themeIsDarkMode ? "text-white" : "text-gray-800"}
          startContent={<Icon icon={currentLang.flag} width={20} />}
          endContent={<Icon icon="lucide:chevron-down" className="text-gray-400" width={16} />}
        >
          {currentLang.name}
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Language Selection"
        variant="flat"
        className={themeIsDarkMode ? 
          "bg-[#010b29]/90 backdrop-blur-md border border-white/10" : 
          "bg-white/90 backdrop-blur-md border border-gray-200"
        }
        onAction={(key) => handleLanguageChange(key as string)}
      >
        {languages.map((lang) => (
          <DropdownItem
            key={lang.code}
            startContent={<Icon icon={lang.flag} width={20} />}
            className={`${themeIsDarkMode ? 'text-white' : 'text-gray-800'} ${i18n.language === lang.code ? (themeIsDarkMode ? 'bg-white/10' : 'bg-gray-100') : ''}`}
          >
            {lang.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};