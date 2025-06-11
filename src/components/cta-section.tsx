import React from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

export const CTASection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <section className="container mx-auto px-4 py-8 md:py-12"> {/* Reduced from py-16 md:py-24 to py-8 md:py-12 */}
      <motion.div 
        className="yellow-glass p-8 md:p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 font-outfit ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {t('cta.ready')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>{t('cta.start')}</span> {t('cta.project')}
        </h2>
        <p className={`max-w-2xl mx-auto mb-8 font-outfit font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {t('cta.description', 'Join Beamly today and connect with top freelancers from around the world. Whether you need a quick task or a complex project, we\'ve got you covered.')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            color="secondary" 
            size="lg"
            className="font-medium font-outfit text-beamly-third"
            onPress={() => {
              console.log("Hire freelancer button clicked");
              // No navigation, just a log
            }}
          >
            {t('cta.hireFreelancer', 'Hire a Freelancer')}
          </Button>
          <Button 
            color="primary" 
            variant="bordered"
            size="lg"
            className="font-medium font-outfit text-white border-white"
            onPress={() => {
              console.log("Become freelancer button clicked");
              // No navigation, just a log
            }}
          >
            {t('cta.becomeFreelancer', 'Become a Freelancer')}
          </Button>
        </div>
        
        <div className="mt-12 flex flex-col md:flex-row gap-8 justify-center items-center">
          <div className="flex items-center gap-2">
            <div className="bg-beamly-secondary bg-opacity-20 p-2 rounded-full">
              <Icon icon="lucide:users" className="text-xl text-beamly-secondary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold font-outfit text-white">10M+</p>
              <p className="text-sm text-gray-300 font-outfit font-light">Active Users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-beamly-secondary bg-opacity-20 p-2 rounded-full">
              <Icon icon="lucide:briefcase" className="text-xl text-beamly-secondary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold font-outfit text-white">5M+</p>
              <p className="text-sm text-gray-300 font-outfit font-light">Completed Projects</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-beamly-secondary bg-opacity-20 p-2 rounded-full">
              <Icon icon="lucide:globe" className="text-xl text-beamly-secondary" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold font-outfit text-white">190+</p>
              <p className="text-sm text-gray-300 font-outfit font-light">Countries</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};