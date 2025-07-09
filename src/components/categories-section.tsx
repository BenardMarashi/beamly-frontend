import React from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react"; // FIXED: Removed unused Card, CardBody
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

export const CategoriesSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const categories = [
    { name: t('categories.items.graphicDesign'), icon: "lucide:palette", color: "#FF6B6B" },
    { name: t('categories.items.webDevelopment'), icon: "lucide:code", color: "#4ECDC4" },
    { name: t('categories.items.digitalMarketing'), icon: "lucide:megaphone", color: "#FFD166" },
    { name: t('categories.items.writingTranslation'), icon: "lucide:pen-tool", color: "#6A0572" },
    { name: t('categories.items.videoAnimation'), icon: "lucide:video", color: "#1A936F" },
    { name: t('categories.items.musicAudio'), icon: "lucide:music", color: "#3D348B" },
    { name: t('categories.items.programming'), icon: "lucide:terminal", color: "#F18701" },
    { name: t('categories.items.business'), icon: "lucide:briefcase", color: "#7678ED" },
  ];
  
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <motion.h2 
          className={`text-3xl md:text-4xl font-bold mb-4 section-title ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('categories.explore')} <span className="text-beamly-secondary">{t('categories.title')}</span>
        </motion.h2>
        <motion.p 
          className={`max-w-2xl mx-auto section-subtitle ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('categories.subtitle', 'Find services in top categories to help you achieve your goals')}
        </motion.p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <div className="glass-card h-full cursor-pointer card-hover">
              <div className="p-6 flex flex-col items-center text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon icon={category.icon} className="text-2xl" style={{ color: category.color }} />
                </div>
                <h3 className="font-semibold mb-2 font-outfit text-white">{category.name}</h3>
                <p className="text-sm text-gray-400 font-outfit font-light">{t('categories.findTalented')}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center mt-10">
        <Button 
          color="secondary" 
          variant="ghost"
          endContent={<Icon icon="lucide:arrow-right" />}
          className="font-medium font-outfit text-beamly-secondary"
          onPress={() => {
            console.log("Browse all categories clicked");
            // No navigation, just a log
          }}
        >
          {t('categories.browseAll', 'Browse All Categories')}
        </Button>
      </div>
    </section>
  );
};