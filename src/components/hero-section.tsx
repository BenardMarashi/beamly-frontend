import React from "react";
import { motion } from "framer-motion";
import { Input, Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface HeroSectionProps {
  setCurrentPage: (page: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ setCurrentPage }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const popularSearches = [
    t('hero.categories.webDesign'),
    t('hero.categories.logoDesign'),
    t('hero.categories.contentWriting'),
    t('hero.categories.videoEditing')
  ];
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage(`search-results?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center py-12 md:py-20 px-4 mt-16">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-outfit ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('hero.title')}{" "}
            <span className="text-gradient bg-gradient-to-r from-beamly-primary to-beamly-secondary bg-clip-text text-transparent">
              {t('hero.freelance')}
            </span>{" "}
            {t('hero.titleEnd')}
          </h1>
          <p className={`text-base md:text-lg lg:text-xl mb-8 md:mb-10 max-w-2xl mx-auto font-outfit font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('hero.subtitle')}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="glass-effect p-2 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  size="lg"
                  placeholder={t('hero.searchPlaceholder')}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<Icon icon="lucide:search" className="text-gray-400" />}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className={`flex-1 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-200'}`}
                  classNames={{
                    input: "text-base md:text-lg",
                    inputWrapper: "h-12 md:h-14"
                  }}
                />
                <Button
                  size="lg"
                  color="secondary"
                  className="font-medium font-outfit text-beamly-third h-12 md:h-14 px-6 md:px-8"
                  onPress={handleSearch}
                >
                  {t('hero.search')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Popular Searches */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12 md:mb-16">
            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
              {t('hero.popular')}:
            </span>
            {popularSearches.map((search, index) => (
              <Button
                key={index}
                size="sm"
                variant="flat"
                className={`${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} text-xs md:text-sm`}
                onPress={() => {
                  setSearchQuery(search);
                  handleSearch();
                }}
              >
                {search}
              </Button>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              color="primary"
              className="font-medium font-outfit px-6 md:px-8"
              onPress={() => setCurrentPage("browse-freelancers")}
            >
              {t('cta.hireFreelancer')}
            </Button>
            <Button
              size="lg"
              variant="bordered"
              className={`font-medium font-outfit ${isDarkMode ? 'border-white/30 text-white' : 'border-gray-300 text-gray-700'} px-6 md:px-8`}
              onPress={() => setCurrentPage("signup?type=freelancer")}
            >
              {t('cta.becomeFreelancer')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};