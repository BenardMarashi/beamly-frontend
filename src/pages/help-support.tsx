import React from "react";
import { Card, CardBody, Input, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

const HelpSupportPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const faqCategories = [
    { name: "Getting Started", icon: "lucide:flag" },
    { name: "Account & Profile", icon: "lucide:user" },
    { name: "Billing & Payments", icon: "lucide:credit-card" },
    { name: "Jobs & Proposals", icon: "lucide:briefcase" },
    { name: "Communication", icon: "lucide:message-square" },
    { name: "Security & Privacy", icon: "lucide:shield" }
  ];
  
  return (
    <div className="container mx-auto py-8">
      <h1 className={`text-3xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        {t('footer.help')}
      </h1>
      
      <p className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        How can we help you today?
      </p>
      
      <div className="max-w-2xl mx-auto mb-12">
        <Input
          size="lg"
          radius="lg"
          placeholder="Search for help articles..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<Icon icon="lucide:search" />}
          className={isDarkMode ? "bg-white/10" : ""}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {faqCategories.map((category, index) => (
          <Card key={index} className={`${isDarkMode ? 'glass-effect' : 'bg-white'} border-none`} isPressable>
            <CardBody className="p-6 flex items-center">
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} mr-4`}>
                <Icon icon={category.icon} className="text-beamly-secondary text-xl" />
              </div>
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {category.name}
              </h3>
            </CardBody>
          </Card>
        ))}
      </div>
      
      <div className="mt-16 max-w-2xl mx-auto text-center">
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Still need help?
        </h2>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Our support team is available to assist you with any questions or issues you may have.
        </p>
        <Button 
          color="secondary" 
          size="lg"
          className="font-medium"
          endContent={<Icon icon="lucide:mail" />}
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
};

export default HelpSupportPage;
export { HelpSupportPage };