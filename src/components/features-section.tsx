import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

// Move features array inside the component to use translation
export const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const features = [
    {
      icon: "lucide:shield-check",
      title: t('features.items.securePayments.title'),
      description: t('features.items.securePayments.description'),
      color: "#4ECDC4"
    },
    {
      icon: "lucide:users",
      title: t('features.items.qualityTalent.title'),
      description: t('features.items.qualityTalent.description'),
      color: "#FFD166"
    },
    {
      icon: "lucide:headphones",
      title: t('features.items.support.title'),
      description: t('features.items.support.description'),
      color: "#FF6B6B"
    },
    {
      icon: "lucide:zap",
      title: t('features.items.fastDelivery.title'),
      description: t('features.items.fastDelivery.description'),
      color: "#6A0572"
    }
  ];
  
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10 md:mb-12">
        <motion.h2 
          className={`text-3xl md:text-4xl font-bold mb-4 section-title ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('features.whyChoose')} <span className="text-beamly-secondary">Beamly</span>
        </motion.h2>
        <motion.p 
          className={`max-w-2xl mx-auto section-subtitle ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('features.subtitle')}
        </motion.p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <div className="glass-card p-6 text-center card-hover h-full">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <Icon icon={feature.icon} className="text-3xl" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold mb-3 font-outfit text-white">{feature.title}</h3>
              <p className="text-sm text-gray-400 font-outfit font-light">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};