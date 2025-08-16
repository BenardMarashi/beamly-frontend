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
    { text: t('hero.categories.webDesign'), category: 'design', page: 'browse-freelancers' },
    { text: t('hero.categories.logoDesign'), category: 'design', page: 'browse-freelancers' },
    { text: t('hero.categories.contentWriting'), category: 'writing', page: 'browse-freelancers' },
    { text: t('hero.categories.videoEditing'), category: 'video', page: 'browse-freelancers' }
  ];
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to browse freelancers with search query
      setCurrentPage(`browse-freelancers?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePopularSearchClick = (search: { text: string, category: string, page: string }) => {
    // Navigate to the appropriate page with category and search
    setCurrentPage(`${search.page}?category=${search.category}&search=${encodeURIComponent(search.text)}`);
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
                    input: isDarkMode ? "text-white placeholder:text-gray-400" : "text-gray-900 placeholder:text-gray-500",
                    inputWrapper: "shadow-none"
                  }}
                />
                <Button 
                  color="secondary" 
                  size="lg" 
                  className="px-8 font-medium text-beamly-third"
                  onPress={handleSearch}
                >
                  {t('hero.searchButton')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Popular Searches - Now Clickable */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('hero.popular')}:
            </span>
            {popularSearches.map((search, index) => (
              <Button
                key={index}
                variant="light"
                size="sm"
                className={`text-sm hover:underline ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                onPress={() => handlePopularSearchClick(search)}
              >
                {search.text}
              </Button>
            ))}
          </div>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Button
              size="lg"
              color="primary"
              className="font-medium text-white px-8"
              onPress={() => setCurrentPage('signup')}
              startContent={<Icon icon="lucide:user-plus" />}
            >
              {t('hero.joinAsFreelancer')}
            </Button>
            <Button
              size="lg"
              variant="bordered"
              className={`font-medium px-8 ${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300 text-gray-900'}`}
              onPress={() => setCurrentPage('signup?type=company')}
              startContent={<Icon icon="lucide:building" />}
            >
              {t('hero.hireFreelancers')}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};