import React from "react";
import { motion } from "framer-motion";
import { Card, CardBody, Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface CategoriesSectionProps {
  setCurrentPage: (page: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ setCurrentPage }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const categories = [
    {
      id: "graphic-design",
      name: t('categories.items.graphicDesign'),
      icon: "lucide:palette",
      description: t('categories.findTalented'),
      color: "#FF6B6B",
      page: "browse-freelancers?category=design"
    },
    {
      id: "web-development",
      name: t('categories.items.webDevelopment'),
      icon: "lucide:code",
      description: t('categories.findTalented'),
      color: "#4ECDC4",
      page: "browse-freelancers?category=development"
    },
    {
      id: "digital-marketing",
      name: t('categories.items.digitalMarketing'),
      icon: "lucide:megaphone",
      description: t('categories.findTalented'),
      color: "#FFD93D",
      page: "browse-freelancers?category=marketing"
    },
    {
      id: "writing-translation",
      name: t('categories.items.writingTranslation'),
      icon: "lucide:pen-tool",
      description: t('categories.findTalented'),
      color: "#6A0572",
      page: "browse-freelancers?category=writing"
    },
    {
      id: "video-animation",
      name: t('categories.items.videoAnimation'),
      icon: "lucide:video",
      description: t('categories.findTalented'),
      color: "#1A936F",
      page: "browse-freelancers?category=video"
    },
    {
      id: "music-audio",
      name: t('categories.items.musicAudio'),
      icon: "lucide:music",
      description: t('categories.findTalented'),
      color: "#3D348B",
      page: "browse-freelancers?category=music"
    },
    {
      id: "programming",
      name: t('categories.items.programming'),
      icon: "lucide:terminal",
      description: t('categories.findTalented'),
      color: "#F18701",
      page: "browse-freelancers?category=programming"
    },
    {
      id: "business",
      name: t('categories.items.business'),
      icon: "lucide:briefcase",
      description: t('categories.findTalented'),
      color: "#7678ED",
      page: "browse-freelancers?category=business"
    }
  ];
  
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('categories.explore')} <span className="text-beamly-secondary">{t('categories.title')}</span>
          </h2>
          <p className={`text-base md:text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('categories.subtitle')}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card
                className={`glass-card border-none card-hover cursor-pointer h-full ${!isDarkMode && 'border border-gray-200'}`}
                isPressable
                onPress={() => setCurrentPage(category.page)}
              >
                <CardBody className="p-4 md:p-6 text-center">
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 relative"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon
                      icon={category.icon}
                      className="text-2xl md:text-3xl absolute"
                      style={{ color: category.color }}
                    />
                  </div>
                  <h3 className={`font-semibold text-sm md:text-base mb-1 md:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {category.name}
                  </h3>
                  <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {category.description}
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-8 md:mt-12"
        >
          <Button
            size="lg"
            variant="bordered"
            className={`${isDarkMode ? 'border-white/30 text-white' : 'border-gray-300 text-gray-700'} font-medium`}
            onPress={() => setCurrentPage("browse-freelancers")}
          >
            {t('categories.browseAll')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};