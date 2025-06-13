import React from "react";
import { useTranslation } from "react-i18next";
// Replace next-themes with our custom theme context
import { useTheme } from "../contexts/theme-context";
// Replace NextUI components with HeroUI components
import { Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
    
export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {t('dashboard.welcomeBack', 'Welcome back')}, Alexander!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={`${isDarkMode ? 'glass-effect' : ''} border-none`}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('dashboard.activeJobs', 'Active Jobs')}
              </h3>
              <div className="p-2 rounded-full bg-blue-500/10">
                <Icon icon="lucide:briefcase" className="text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-blue-500">3</p>
            <div className="mt-4">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                endContent={<Icon icon="lucide:arrow-right" />}
                onPress={() => console.log("View all jobs clicked")}
              >
                {t('dashboard.viewAll', 'View All')}
              </Button>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`${isDarkMode ? 'glass-effect' : ''} border-none`}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('dashboard.balance', 'Balance')}
              </h3>
              <div className="p-2 rounded-full bg-green-500/10">
                <Icon icon="lucide:dollar-sign" className="text-green-500" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-green-500">$1,240.00</p>
            <div className="mt-4">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                endContent={<Icon icon="lucide:arrow-right" />}
                onPress={() => console.log("Withdraw clicked")}
              >
                {t('dashboard.withdraw', 'Withdraw')}
              </Button>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`${isDarkMode ? 'glass-effect' : ''} border-none`}>
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('dashboard.notifications', 'Notifications')}
              </h3>
              <div className="p-2 rounded-full bg-beamly-secondary/10">
                <Icon icon="lucide:bell" className="text-beamly-secondary" />
              </div>
            </div>
            <p className="text-3xl font-semibold text-beamly-secondary">7</p>
            <div className="mt-4">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                endContent={<Icon icon="lucide:arrow-right" />}
                onPress={() => console.log("View all notifications clicked")}
              >
                {t('dashboard.viewAll', 'View All')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    
      {/* This is a stub implementation. Further implementation would include:
      - Recent activities
      - Recommended jobs
      - Messages preview
      - Earnings chart
      */}
    </div>
  );
};

export default DashboardPage;