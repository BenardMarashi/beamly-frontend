import React from "react";
import { Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BeamlyLogo } from "./beamly-logo";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";
import { useTranslation } from "react-i18next";

interface FooterSectionProps {
  setCurrentPage: (page: string) => void;
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
  isDarkMode?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ 
  setCurrentPage,
  currentLanguage = "en",
  onLanguageChange = () => {},
  isDarkMode = true,
  onThemeChange = () => {}
}) => {
  const { t } = useTranslation();
  
  const clientLinks = [
    { name: t('footer.clients.howToHire'), page: "how-it-works" },
    { name: t('footer.clients.talentMarketplace'), page: "explore" },
    { name: t('footer.clients.projectCatalog'), page: "services" },
    { name: t('footer.clients.enterprise'), page: "about" },
    { name: t('footer.clients.paymentProtection'), page: "how-it-works" }
  ];
  
  const freelancerLinks = [
    { name: t('footer.freelancers.howToFindWork'), page: "how-it-works" },
    { name: t('footer.freelancers.directContracts'), page: "services" },
    { name: t('footer.freelancers.marketplaceInsights'), page: "blog" },
    { name: t('footer.freelancers.community'), page: "community" },
    { name: t('footer.freelancers.zeroCommission'), page: "about" }
  ];
  
  const resourceLinks = [
    { name: t('footer.resources.helpSupport'), page: "help-support" },
    { name: t('footer.resources.successStories'), page: "blog" },
    { name: t('footer.resources.blog'), page: "blog" },
    { name: t('footer.resources.community'), page: "community" },
    { name: t('footer.resources.affiliateProgram'), page: "affiliate-program" },
    { name: t('footer.resources.contactUs'), page: "contact-us" }
  ];
  
  const legalLinks = [
    { name: t('footer.legal.privacyPolicy'), page: "privacy-policy" },
    { name: t('footer.legal.termsOfService'), page: "terms-of-service" },
    { name: t('footer.legal.sitemap'), page: "sitemap" }
  ];
  
  return (
    <footer className={`container mx-auto px-4 py-8 md:py-10 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="glass-effect p-8 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <BeamlyLogo />
            <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs font-outfit font-light`}>
              {t('footer.description')}
            </p>
            <div className="mt-6 flex gap-4">
              {["lucide:facebook", "lucide:twitter", "lucide:instagram", "lucide:linkedin"].map((social, index) => (
                <a 
                  key={index} 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-beamly-secondary bg-opacity-10 flex items-center justify-center hover:bg-beamly-secondary hover:text-beamly-third transition-all"
                >
                  <Icon icon={social} className="text-beamly-secondary" />
                </a>
              ))}
            </div>
            
            {/* Add language and theme toggles for desktop */}
            <div className="hidden md:flex items-center gap-6 mt-6">
              <LanguageToggle 
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                isDarkMode={isDarkMode}
              />
              <ThemeToggle 
                isDarkMode={isDarkMode}
                onThemeChange={onThemeChange}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 font-outfit text-white">{t('footer.forClients')}</h3>
            <ul className="space-y-3">
              {clientLinks.map((item, index) => (
                <li key={index}>
                  <Link 
                    href="#" 
                    className="text-gray-300 hover:text-beamly-secondary transition-colors font-outfit font-light"
                    onPress={(e) => {
                      e.preventDefault();
                      console.log(`Link clicked: ${item.page}`);
                      // Optional: setCurrentPage(item.page) if needed
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 font-outfit text-white">{t('footer.forFreelancers')}</h3>
            <ul className="space-y-3">
              {freelancerLinks.map((item, index) => (
                <li key={index}>
                  <Link 
                    href="#" 
                    className="text-gray-300 hover:text-beamly-secondary transition-colors font-outfit font-light"
                    onPress={(e) => {
                      e.preventDefault();
                      console.log(`Link clicked: ${item.page}`);
                      // Optional: setCurrentPage(item.page) if needed
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 font-outfit text-white">{t('footer.resources')}</h3>
            <ul className="space-y-3">
              {resourceLinks.map((item, index) => (
                <li key={index}>
                  <Link 
                    href="#" 
                    className="text-gray-300 hover:text-beamly-secondary transition-colors font-outfit font-light"
                    onPress={(e) => {
                      e.preventDefault();
                      console.log(`Link clicked: ${item.page}`);
                      // Optional: setCurrentPage(item.page) if needed
                    }}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link 
              href="#" 
              className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onPress={(e) => {
                e.preventDefault();
                console.log(`Link clicked: terms-of-service`);
                // Optional: setCurrentPage("terms-of-service") if needed
              }}
            >
              {t('footer.legal.termsOfService')}
            </Link>
            <Link 
              href="#" 
              className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onPress={(e) => {
                e.preventDefault();
                console.log(`Link clicked: privacy-policy`);
                // Optional: setCurrentPage("privacy-policy") if needed
              }}
            >
              {t('footer.legal.privacyPolicy')}
            </Link>
            <Link 
              href="#" 
              className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onPress={(e) => {
                e.preventDefault();
                console.log(`Link clicked: help-support`);
                // Optional: setCurrentPage("help-support") if needed
              }}
            >
              {t('footer.resources.helpSupport')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};