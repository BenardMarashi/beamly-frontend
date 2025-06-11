import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

const features = [
  {
    title: "Quality Work",
    description: "Find the highest quality services and talents with our strict verification process.",
    icon: "lucide:badge-check"
  },
  {
    title: "Zero Commission",
    description: "Keep more of what you earn with our zero commission policy for freelancers.",
    icon: "lucide:percent"
  },
  {
    title: "Secure Payments",
    description: "Your payments are protected with our secure payment system and escrow service.",
    icon: "lucide:shield"
  },
  {
    title: "24/7 Support",
    description: "Get help anytime with our dedicated customer support team available round the clock.",
    icon: "lucide:headphones"
  }
];

export const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const features = [
    {
      title: t('features.qualityWork.title', 'Quality Work'),
      description: t('features.qualityWork.description', 'Find the highest quality services and talents with our strict verification process.'),
      icon: "lucide:badge-check"
    },
    {
      title: t('features.zeroCommission.title', 'Zero Commission'),
      description: t('features.zeroCommission.description', 'Keep more of what you earn with our zero commission policy for freelancers.'),
      icon: "lucide:percent"
    },
    {
      title: t('features.securePayments.title', 'Secure Payments'),
      description: t('features.securePayments.description', 'Your payments are protected with our secure payment system and escrow service.'),
      icon: "lucide:shield"
    },
    {
      title: t('features.support.title', '24/7 Support'),
      description: t('features.support.description', 'Get help anytime with our dedicated customer support team available round the clock.'),
      icon: "lucide:headphones"
    }
  ];
  
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="glass-effect p-8 md:p-12">
        <div className="text-center mb-12">
          <motion.h2 
            className={`text-3xl md:text-4xl font-bold mb-4 section-title ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {t('features.why')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>Beamly</span>
          </motion.h2>
          <motion.p 
            className={`max-w-2xl mx-auto section-subtitle ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('features.subtitle')}
          </motion.p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className={`glass-card p-6 card-hover ${index % 2 === 0 ? '' : 'yellow-glass'}`}
            >
              <div className={`${index % 2 === 0 ? 'bg-beamly-primary' : 'bg-beamly-secondary'} bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                <Icon icon={feature.icon} className={`text-2xl ${index % 2 === 0 ? 'text-beamly-primary' : 'text-beamly-secondary'}`} />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-outfit text-white">{feature.title}</h3>
              <p className="text-gray-300 font-outfit font-light">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};