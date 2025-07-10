import React from "react";
import { motion } from "framer-motion";
import { Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface CTASectionProps {
  setCurrentPage: (page: string) => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ setCurrentPage }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const stats = [
    { number: "10M+", label: t('cta.activeUsers') || "Active Users", icon: "lucide:users" },
    { number: "5M+", label: t('cta.completedProjects') || "Completed Projects", icon: "lucide:briefcase" },
    { number: "190+", label: t('cta.countries') || "Countries", icon: "lucide:globe" }
  ];
  
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="glass-effect p-8 md:p-12 rounded-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {t('cta.ready')} <span className="text-beamly-secondary">{t('cta.start')}</span> {t('cta.project')}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {t('cta.description')}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              size="lg"
              color="secondary"
              className="font-medium font-outfit text-beamly-third"
              onPress={() => setCurrentPage("signup?type=company")}
            >
              {t('cta.hireFreelancer')}
            </Button>
            <Button
              size="lg"
              variant="bordered"
              className={`font-medium font-outfit ${isDarkMode ? 'border-white/30 text-white' : 'border-gray-300 text-gray-700'}`}
              onPress={() => setCurrentPage("signup?type=freelancer")}
            >
              {t('cta.becomeFreelancer')}
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div 
                    className="w-12 h-12 rounded-full bg-beamly-secondary flex items-center justify-center"
                  >
                    <Icon 
                      icon={stat.icon} 
                      className="text-beamly-third text-xl"
                    />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-beamly-secondary mb-1">
                  {stat.number}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};