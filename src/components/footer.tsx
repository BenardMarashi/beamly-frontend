import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Link } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { BeamlyLogo } from "./beamly-logo";
import { useTheme } from "../contexts/theme-context";
import { Icon } from "@iconify/react";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  return (
    <footer className={`container mx-auto px-4 py-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="glass-effect p-4 md:p-6 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <BeamlyLogo small />
            <p className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-outfit font-light text-sm`}>
              © {new Date().getFullYear()} Beamly. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Add language and theme toggles in footer for desktop */}
            <div className="hidden md:flex items-center gap-6">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            
            <div className="flex gap-4">
              <Link 
                as={RouterLink}
                to="/privacy-policy" 
                className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-beamly-secondary transition-colors font-outfit font-light`}
              >
                {t('footer.legal.privacyPolicy')}
              </Link>
              <Link 
                as={RouterLink}
                to="/terms-of-service" 
                className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} hover:text-beamly-secondary transition-colors font-outfit font-light`}
              >
                {t('footer.legal.termsOfService')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};