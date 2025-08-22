import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Button } from "@heroui/react";
import { useTheme } from "../contexts/theme-context";

const HowItWorksPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'freelancers' | 'clients'>('freelancers');

  // Simple step configuration - no hardcoded text!
  const steps = {
    freelancers: [
      { icon: '👤', color: 'from-blue-500 to-indigo-600' },
      { icon: '🔍', color: 'from-purple-500 to-pink-600' },
      { icon: '📝', color: 'from-green-500 to-teal-600' },
      { icon: '✨', color: 'from-orange-500 to-red-600' },
      { icon: '💰', color: 'from-cyan-500 to-blue-600' }
    ],
    clients: [
      { icon: '📋', color: 'from-violet-500 to-purple-600' },
      { icon: '📬', color: 'from-blue-500 to-cyan-600' },
      { icon: '🎯', color: 'from-emerald-500 to-green-600' },
      { icon: '🤝', color: 'from-amber-500 to-orange-600' },
      { icon: '✅', color: 'from-rose-500 to-pink-600' }
    ]
  };

  const currentSteps = steps[activeTab];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('howItWorks.title')}
          </h1>
          <p className={`text-lg md:text-xl mb-4 max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('howItWorks.subtitle')}
          </p>
          <p className={`text-base max-w-2xl mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('howItWorks.description')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className={`inline-flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Button
              className={`px-6 py-3 rounded-md transition-all ${
                activeTab === 'freelancers'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('freelancers')}
            >
              {t('howItWorks.forFreelancers')}
            </Button>
            <Button
              className={`px-6 py-3 rounded-md transition-all ${
                activeTab === 'clients'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('clients')}
            >
              {t('howItWorks.forClients')}
            </Button>
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
          
          <div className="space-y-8 md:space-y-12">
            {currentSteps.map((step, index) => (
              <div
                key={index}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-col md:gap-8`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none shadow-xl hover:shadow-2xl transition-shadow`}>
                    <CardBody className="p-6 md:p-8">
                      <h3 className={`text-xl md:text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {t(`howItWorks.${activeTab}.step${index + 1}.title`)}
                      </h3>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                        {t(`howItWorks.${activeTab}.step${index + 1}.description`)}
                      </p>
                    </CardBody>
                  </Card>
                </div>

                <div className="relative z-10 my-4 md:my-0">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform`}>
                    <span className="text-2xl md:text-3xl">{step.icon}</span>
                  </div>
                </div>

                <div className="hidden md:block flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;