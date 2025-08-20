import React from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/theme-context';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const features = [
    { icon: 'lucide:shield-check', key: 'secure' },
    { icon: 'lucide:users', key: 'community' },
    { icon: 'lucide:trending-up', key: 'growth' },
    { icon: 'lucide:globe', key: 'global' }
  ];

  const values = [
    { title: t('about.values.transparency.title'), desc: t('about.values.transparency.desc') },
    { title: t('about.values.quality.title'), desc: t('about.values.quality.desc') },
    { title: t('about.values.trust.title'), desc: t('about.values.trust.desc') },
    { title: t('about.values.innovation.title'), desc: t('about.values.innovation.desc') }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('about.hero.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('about.hero.subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} mb-8`}>
          <CardBody className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {t('about.mission.title')}
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('about.mission.content')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              {t('about.mission.vision')}
            </p>
          </CardBody>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature) => (
            <Card key={feature.key} className={isDarkMode ? 'glass-card' : 'bg-white shadow-md'}>
              <CardBody className="p-6 text-center">
                <Icon icon={feature.icon} className="text-4xl text-beamly-secondary mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">
                  {t(`about.features.${feature.key}.title`)}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t(`about.features.${feature.key}.desc`)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Values Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} mb-8`}>
          <CardBody className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              {t('about.values.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center">
                    <Icon icon="lucide:check-circle" className="text-beamly-secondary mr-2" />
                    {value.title}
                  </h3>
                  <p className="text-gray-400 ml-6">
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Team Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} mb-8`}>
          <CardBody className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {t('about.team.title')}
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {t('about.team.content')}
            </p>
            <p className="text-gray-300 leading-relaxed">
              {t('about.team.location')}
            </p>
          </CardBody>
        </Card>

        {/* CTA Section */}
        <Card className={`${isDarkMode ? 'glass-effect' : 'bg-white'} text-center`}>
          <CardBody className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {t('about.cta.title')}
            </h2>
            <p className="text-gray-300 mb-6">
              {t('about.cta.subtitle')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                color="secondary"
                size="lg"
                onPress={() => navigate('/signup')}
              >
                {t('about.cta.joinButton')}
              </Button>
              <Button 
                variant="bordered"
                size="lg"
                className="border-white/30 text-white"
                onPress={() => navigate('/contact-us')}
              >
                {t('about.cta.contactButton')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default AboutPage;