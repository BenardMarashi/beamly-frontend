import React from "react";
import { ProfileManagementPage } from "../components/profile-management-page";
import { useTheme } from "../contexts/theme-context";
import { useTranslation } from "react-i18next";
import { Card, CardBody, RadioGroup, Radio, Select, SelectItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, isDarkMode } = useTheme();

  const languages = [
    { value: "en", label: t('settings.language.english') },
    { value: "sq", label: t('settings.language.albanian') }
  ];

  const handleLanguageChange = (value: React.Key) => {
    i18n.changeLanguage(value as string);
    localStorage.setItem('lang', value as string);
  };

  return (
    <div className="container mx-auto">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {t('settings.title')}
      </h1>
      
      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        {/* Appearance Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('settings.appearance.title')}
            </h2>
            <RadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark')}
              aria-label={t('settings.appearance.theme')}
            >
              <Radio value="light" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center">
                  <Icon icon="lucide:sun" className="mr-2" />
                  {t('settings.appearance.light')}
                </div>
              </Radio>
              <Radio value="dark" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <div className="flex items-center">
                  <Icon icon="lucide:moon" className="mr-2" />
                  {t('settings.appearance.dark')}
                </div>
              </Radio>
            </RadioGroup>
          </CardBody>
        </Card>
        
        {/* Language Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('settings.language.title')}
            </h2>
            <div className="max-w-xs">
              <Select
                items={languages}
                selectedKeys={[i18n.language]}
                onSelectionChange={(keys) => handleLanguageChange(Array.from(keys)[0])}
                aria-label={t('settings.language.select')}
                className={isDarkMode ? "glass-effect" : ""}
              >
                {(language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                )}
              </Select>
            </div>
          </CardBody>
        </Card>
        
        {/* Account Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`}>
          <CardBody className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('settings.account.title')}
            </h2>
            
            <div className="mt-4 p-4 border border-red-400/20 rounded-lg bg-red-400/5">
              <h3 className="text-red-400 font-medium">{t('settings.account.dangerZone')}</h3>
              <p className={`mt-2 mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('settings.account.dangerZoneDescription')}
              </p>
              <Button 
                color="danger" 
                variant="flat"
                onPress={() => console.log("Delete account button clicked")}
              >
                {t('settings.account.deleteAccount')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;