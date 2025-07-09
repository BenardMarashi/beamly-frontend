import React from "react";
import { Link, Button, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

interface FooterSectionProps {
  isDarkMode?: boolean;
  onPageChange?: (page: string) => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ 
  // FIXED: Removed unused setCurrentPage
  onPageChange 
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const companyLinks = [
    { label: t('footer.company.about'), page: 'about' },
    { label: t('footer.company.howItWorks'), page: 'how-it-works' },
    { label: t('footer.company.testimonials'), page: 'testimonials' },
    { label: t('footer.company.careers'), page: 'careers' },
  ];

  const supportLinks = [
    { label: t('footer.support.helpCenter'), page: 'help' },
    { label: t('footer.support.safety'), page: 'safety' },
    { label: t('footer.support.community'), page: 'community' },
    { label: t('footer.support.contact'), page: 'contact-us' },
  ];

  // FIXED: Removed unused legalLinks variable

  const socialLinks = [
    { icon: "lucide:facebook", url: "https://facebook.com/beamly" },
    { icon: "lucide:twitter", url: "https://twitter.com/beamly" },
    { icon: "lucide:instagram", url: "https://instagram.com/beamly" },
    { icon: "lucide:linkedin", url: "https://linkedin.com/company/beamly" },
  ];

  // FIXED: Changed PressEvent to any type and added proper event handling
  const handleLinkClick = (e: any, page: string) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <footer className={`py-12 px-4 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100'} backdrop-blur-md`}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="lucide:message-circle" className="text-3xl text-beamly-primary" />
              <span className="text-2xl font-bold font-outfit text-white">Beamly</span>
            </div>
            <p className="text-gray-400 mb-6 font-outfit font-light">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.url}
                  isExternal
                  className="text-gray-400 hover:text-beamly-secondary transition-colors"
                >
                  <Icon icon={social.icon} className="text-xl" />
                </Link>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">{t('footer.company.title')}</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.page}>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-beamly-secondary transition-colors text-sm"
                    onPress={(e) => handleLinkClick(e, link.page)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">{t('footer.support.title')}</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.page}>
                  <Link
                    href="#"
                    className="text-gray-400 hover:text-beamly-secondary transition-colors text-sm"
                    onPress={(e) => handleLinkClick(e, link.page)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4 text-white">{t('footer.newsletter.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer.newsletter.subtitle')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-beamly-secondary"
              />
              <Button 
                color="secondary" 
                size="sm"
                isIconOnly
              >
                <Icon icon="lucide:send" />
              </Button>
            </div>
          </div>
        </div>

        <Divider className="my-8 bg-white/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Beamly. {t('footer.allRightsReserved')}
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-gray-400 hover:text-beamly-secondary transition-colors text-sm"
              onPress={(e) => handleLinkClick(e, 'privacy-policy')}
            >
              {t('footer.legal.privacy')}
            </Link>
            <Link
              href="#"
              className="text-gray-400 hover:text-beamly-secondary transition-colors text-sm"
              onPress={(e) => handleLinkClick(e, 'terms-of-service')}
            >
              {t('footer.legal.terms')}
            </Link>
            <Link
              href="#"
              className="text-gray-400 hover:text-beamly-secondary transition-colors text-sm"
              onPress={(e) => handleLinkClick(e, 'cookie-policy')}
            >
              {t('footer.legal.cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};