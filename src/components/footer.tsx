import React from "react";
import { Link } from "@heroui/react";
// FIXED: Removed unused Icon import
import { useTranslation } from "react-i18next";

interface FooterProps {
  isDarkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDarkMode = true }) => {
  const { t } = useTranslation();

  return (
    <footer className={`py-6 px-4 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100'} backdrop-blur-md`}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Beamly. {t('footer.allRightsReserved', 'All rights reserved.')}
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-primary transition-colors text-sm"
            >
              {t('footer.legal.privacy', 'Privacy Policy')}
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-primary transition-colors text-sm"
            >
              {t('footer.legal.terms', 'Terms of Service')}
            </Link>
            <Link
              href="/contact"
              className="text-gray-400 hover:text-primary transition-colors text-sm"
            >
              {t('footer.support.contact', 'Contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;