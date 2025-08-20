import React from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/theme-context';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const sections = [
    { id: 'collect', title: t('privacy.sections.collect.title'), type: 'list' },
    { id: 'use', title: t('privacy.sections.use.title'), type: 'list' },
    { id: 'legal', title: t('privacy.sections.legal.title'), type: 'list' },
    { id: 'sharing', title: t('privacy.sections.sharing.title'), type: 'list' },
    { id: 'transfers', title: t('privacy.sections.transfers.title'), type: 'text' },
    { id: 'retention', title: t('privacy.sections.retention.title'), type: 'text' },
    { id: 'rights', title: t('privacy.sections.rights.title'), type: 'list' },
    { id: 'cookies', title: t('privacy.sections.cookies.title'), type: 'list' },
    { id: 'security', title: t('privacy.sections.security.title'), type: 'text' },
    { id: 'changes', title: t('privacy.sections.changes.title'), type: 'text' },
    { id: 'contact', title: t('privacy.sections.contact.title'), type: 'contact' }
  ];

  const renderSection = (section: any, index: number) => {
    switch (section.type) {
      case 'list':
        const items = t(`privacy.sections.${section.id}.items`, { returnObjects: true }) as string[];
        return (
          <div key={section.id} className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {index + 1}. {section.title}
            </h2>
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className="text-gray-300 flex items-start">
                  <span className="text-beamly-secondary mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'contact':
        return (
          <div key={section.id} className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {index + 1}. {section.title}
            </h2>
            <p className="text-gray-300">{t('privacy.sections.contact.intro')}</p>
            <div className="ml-4">
              <p className="text-gray-300">
                {t('privacy.sections.contact.email')}: 
                <a href="mailto:beamlyapp@gmail.com" className="text-beamly-secondary ml-2 hover:underline">
                  beamlyapp@gmail.com
                </a>
              </p>
            </div>
          </div>
        );
      
      default:
        return (
          <div key={section.id} className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              {index + 1}. {section.title}
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {t(`privacy.sections.${section.id}.content`)}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          {t('privacy.title')}
        </h1>
        
        <Card className={isDarkMode ? 'glass-effect' : 'bg-white'}>
          <CardBody className="p-6 md:p-8">
            <div className="space-y-8">
              {sections.map((section, index) => renderSection(section, index))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicyPage;