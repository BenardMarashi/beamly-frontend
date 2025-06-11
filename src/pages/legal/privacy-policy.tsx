import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody } from "@heroui/react";
import { useTheme } from "../../contexts/theme-context";

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <div className="container mx-auto py-8">
      <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none max-w-4xl mx-auto`}>
        <CardBody className="p-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('legal.privacyTitle')}
          </h1>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('legal.privacyEffectiveDate')}
          </p>
          
          <p className={`mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('legal.privacyIntro')}
          </p>
          
          {/* Using Object.entries to iterate through the sections */}
          {Object.entries(t('legal.privacyContent', { returnObjects: true })).map(([key, section]: [string, any]) => (
            <div key={key} className="mb-6">
              <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {section.title}
              </h2>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {section.content}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
export { PrivacyPolicyPage };