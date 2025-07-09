import React, { useState } from "react";
import { Button, Input } from "@heroui/react"; // FIXED: Removed unused Spacer
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";
import { useNavigate } from "react-router-dom";

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/looking-for-work?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative overflow-hidden py-12 md:py-20 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-beamly-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-beamly-secondary/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight font-outfit ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('hero.findPerfect')} <span className="text-beamly-secondary">{t('hero.freelancer')}</span> {t('hero.forYourProject')}
            </h1>
            
            <p className={`text-lg md:text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-outfit font-light`}>
              {t('hero.subtitle')}
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Input
                size="lg"
                placeholder={t('hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                startContent={<Icon icon="lucide:search" className="text-gray-400" />}
                className="flex-1"
              />
              <Button 
                color="secondary" 
                size="lg"
                onPress={handleSearch}
                endContent={<Icon icon="lucide:arrow-right" />}
                className="font-medium font-outfit w-full sm:w-auto"
              >
                {t('hero.searchButton')}
              </Button>
            </div>
            
            {/* Popular Categories */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('hero.popular')}:</span>
              {['Web Design', 'WordPress', 'Logo Design', 'AI Services'].map((category, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="flat"
                  className="text-xs"
                  onPress={() => navigate(`/looking-for-work?category=${encodeURIComponent(category)}`)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>
          
          {/* Right Column - Illustration/Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <img 
                src="/hero-illustration.svg" 
                alt="Freelance Collaboration" 
                className="w-full h-auto"
              />
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-10 right-10 bg-beamly-secondary p-3 rounded-lg shadow-xl"
              >
                <Icon icon="lucide:briefcase" className="text-2xl text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute bottom-10 left-10 bg-beamly-primary p-3 rounded-lg shadow-xl"
              >
                <Icon icon="lucide:users" className="text-2xl text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 md:mt-20"
        >
          {[
            { number: "50K+", label: t('hero.stats.freelancers') },
            { number: "100K+", label: t('hero.stats.projects') },
            { number: "95%", label: t('hero.stats.satisfaction') },
            { number: "24/7", label: t('hero.stats.support') }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-beamly-secondary mb-2">{stat.number}</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};