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
      name: t('categories.items.graphicDesign'), 
      icon: "lucide:palette", 
      color: "from-purple-500 to-pink-500",
      page: "browse-freelancers?category=design"
    },
    { 
      name: t('categories.items.webDevelopment'), 
      icon: "lucide:code", 
      color: "from-blue-500 to-cyan-500",
      page: "browse-freelancers?category=development"
    },
    { 
      name: t('categories.items.writingTranslation'), 
      icon: "lucide:pen-tool", 
      color: "from-green-500 to-emerald-500",
      page: "browse-freelancers?category=writing"
    },
    { 
      name: t('categories.items.digitalMarketing'), 
      icon: "lucide:megaphone", 
      color: "from-orange-500 to-red-500",
      page: "browse-freelancers?category=marketing"
    },
    { 
      name: t('categories.items.videoAnimation'), 
      icon: "lucide:video", 
      color: "from-pink-500 to-rose-500",
      page: "browse-freelancers?category=video"
    },
    { 
      name: t('categories.items.musicAudio'), 
      icon: "lucide:music", 
      color: "from-indigo-500 to-purple-500",
      page: "browse-freelancers?category=music"
    },
    { 
      name: t('categories.items.business'), 
      icon: "lucide:briefcase", 
      color: "from-yellow-500 to-amber-500",
      page: "browse-freelancers?category=business"
    },
    { 
      name: t('categories.items.ai'), 
      icon: "lucide:brain", 
      color: "from-teal-500 to-cyan-500",
      page: "browse-freelancers?category=ai"
    }
  ];
  
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('categories.title')}
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
            {t('categories.subtitle')}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className="glass-effect border-none cursor-pointer hover:shadow-xl transition-all"
                isPressable
                onPress={() => setCurrentPage(category.page)}
              >
                <CardBody className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <Icon icon={category.icon} className="text-white text-2xl" />
                  </div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {category.name}
                  </h3>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            variant="bordered"
            className={`${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300 text-gray-900'}`}
            onPress={() => setCurrentPage('all-categories')}
            endContent={<Icon icon="lucide:arrow-right" />}
          >
            {t('categories.viewAll')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};