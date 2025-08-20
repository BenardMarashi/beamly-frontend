import React from "react";
import { Link } from "react-router-dom"; // Changed from @heroui/react
import { useTranslation } from "react-i18next";

interface FooterProps {
  isDarkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode = true }) => {
  const { t } = useTranslation();

  return (
    <footer className="glass-effect mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Beamly</span>
            </div>
            <p className="text-sm">
              © 2025 {t('footer.allRightsReserved', 'All rights reserved.')}
            </p>
          </div>
          
          <nav className="flex flex-wrap gap-6 items-center">
            <Link
              to="/privacy"
              className="text-sm hover:underline transition-all duration-300"
            >
              {t('footer.legal.privacy', 'Privacy Policy')}
            </Link>
            <Link
              to="/terms"
              className="text-sm hover:underline transition-all duration-300"
            >
              {t('footer.legal.terms', 'Terms of Service')}
            </Link>
            <Link
              to="/contact"
              className="text-sm hover:underline transition-all duration-300"
            >
              {t('footer.legal.support', 'Contact')}
            </Link>
            <Link
              to="/about"
              className="text-sm hover:underline transition-all duration-300"
            >
              {t('footer.about', 'About')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;