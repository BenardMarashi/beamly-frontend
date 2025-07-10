import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

export const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const features = [
    {
      title: t('features.qualityWork.title'),
      description: t('features.qualityWork.description'),
      icon: "lucide:badge-check"
    },
    {
      title: t('features.zeroCommission.title'),
      description: t('features.zeroCommission.description'),
      icon: "lucide:percent"
    },
    {
      title: t('features.securePayments.title'),
      description: t('features.securePayments.description'),
      icon: "lucide:shield"
    },
    {
      title: t('features.support.title'),
      description: t('features.support.description'),
      icon: "lucide:headphones"
    }
  ];
  
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="glass-effect p-6 md:p-8 lg:p-12 rounded-2xl">
        <div className="text-center mb-8 md:mb-12">
          <motion.h2 
            className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 section-title ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {t('features.why')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>Beamly</span>
          </motion.h2>
          <motion.p 
            className={`max-w-2xl mx-auto section-subtitle text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('features.subtitle')}
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`glass-card p-5 md:p-6 card-hover ${index % 2 === 0 ? '' : 'yellow-glass'}`}
            >
              <div className={`${index % 2 === 0 ? 'bg-beamly-primary' : 'bg-beamly-secondary'} bg-opacity-20 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 md:mb-4`}>
                <Icon icon={feature.icon} className={`text-xl md:text-2xl ${index % 2 === 0 ? 'text-beamly-primary' : 'text-beamly-secondary'}`} />
              </div>
              <h3 className={`text-lg md:text-xl font-semibold mb-2 md:mb-3 font-outfit ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {feature.title}
              </h3>
              <p className={`text-sm md:text-base font-outfit font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};