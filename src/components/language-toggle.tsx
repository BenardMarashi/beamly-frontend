import React, { useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

interface LanguageToggleProps {
  // FIXED: Removed unused isDarkMode
}

export const LanguageToggle: React.FC<LanguageToggleProps> = () => {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'sq');

  const languages = [
    { key: 'en', label: 'English', flag: '🇺🇸' },
    { key: 'sq', label: 'Shqip', flag: '🇦🇱' },
    { key: 'es', label: 'Español', flag: '🇪🇸' },
    { key: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const handleLanguageChange = (key: string) => {
    setSelectedLanguage(key);
    i18n.changeLanguage(key);
  };

  const currentLanguage = languages.find(lang => lang.key === selectedLanguage) || languages[0];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="light"
          startContent={<span className="text-lg">{currentLanguage.flag}</span>}
          endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
          className="min-w-[120px]"
        >
          {currentLanguage.label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectedKeys={[selectedLanguage]}
        onSelectionChange={(keys) => handleLanguageChange(Array.from(keys)[0] as string)}
      >
        {languages.map((language) => (
          <DropdownItem
            key={language.key}
            startContent={<span className="text-lg">{language.flag}</span>}
          >
            {language.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};