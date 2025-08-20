import React from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/theme-context';

const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const sections = [
    { id: 'role', title: t('terms.sections.role.title'), items: ['1.1', '1.2', '1.3', '1.4'] },
    { id: 'use', title: t('terms.sections.use.title'), items: ['2.1', '2.2', '2.3'] },
    { id: 'taxes', title: t('terms.sections.taxes.title'), items: ['3.1', '3.2', '3.3'] },
    { id: 'payments', title: t('terms.sections.payments.title'), items: ['4.1', '4.2', '4.3', '4.4'] },
    { id: 'security', title: t('terms.sections.security.title'), items: ['5.1', '5.2', '5.3'] },
    { id: 'disclaimer', title: t('terms.sections.disclaimer.title'), items: ['6.1', '6.2'] },
    { id: 'law', title: t('terms.sections.law.title'), items: ['7.1', '7.2'] },
    { id: 'amendments', title: t('terms.sections.amendments.title'), items: ['8.1', '8.2'] },
    { id: 'conclusion', title: t('terms.sections.conclusion.title'), items: [] }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          {t('terms.title')}
        </h1>
        
        <Card className={isDarkMode ? 'glass-effect' : 'bg-white'}>
          <CardBody className="p-6 md:p-8">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={section.id} className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">
                    {index + 1}. {section.title}
                  </h2>
                  
                  {section.items.length > 0 ? (
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <p key={item} className="text-gray-300 leading-relaxed">
                          <span className="font-medium text-white">{item}</span>{' '}
                          {t(`terms.sections.${section.id}.${item}`)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 leading-relaxed">
                      {t(`terms.sections.${section.id}.content`)}
                    </p>
                  )}
                  
                  {/* Special handling for disclaimer sub-items */}
                  {section.id === 'disclaimer' && (
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      {['item1', 'item2', 'item3'].map((item) => (
                        <li key={item} className="text-gray-300">
                          {t(`terms.sections.disclaimer.${item}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm text-center">
                {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default TermsOfServicePage;