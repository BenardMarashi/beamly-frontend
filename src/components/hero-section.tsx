import React from "react";
import { motion } from "framer-motion";
import { Button, Input, Spacer } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <section className="container mx-auto px-4 py-10 md:py-16">
      <motion.div 
        className="text-center max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('hero.title')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>Beamly</span>
        </motion.h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 font-outfit font-light">
          {t('hero.subtitle')}
        </p>
        
        <div className="glass-effect p-2 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={t('hero.searchPlaceholder')}
              size="lg"
              radius="lg"
              startContent={
                <Icon icon="lucide:search" className="text-gray-400" />
              }
              className={`flex-1 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-200'}`}
            />
            <Button 
              color="secondary" 
              size="lg"
              className="font-medium font-outfit text-beamly-third"
              onPress={() => {
                console.log("Search button clicked");
                // No navigation, just a log
              }}
            >
              {t('hero.search')}
            </Button>
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-gray-300">
          <p className="font-outfit">{t('hero.popular')}:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              t('hero.categories.webDesign'),
              t('hero.categories.logoDesign'),
              t('hero.categories.contentWriting'),
              t('hero.categories.videoEditing')
            ].map((tag) => (
              <span 
                key={tag} 
                className="glass-effect px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-beamly-secondary hover:bg-opacity-20 transition-all font-outfit"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
      
      <div className="mt-10 md:mt-16 text-center">
        <p className="text-gray-400 mb-6">{t('hero.trustedBy')}</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {["logos:google", "logos:microsoft", "logos:amazon", "logos:slack", "logos:spotify"].map((logo, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="grayscale hover:grayscale-0 hover:opacity-100 transition-all"
            >
              <Icon icon={logo} width={100} height={40} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};