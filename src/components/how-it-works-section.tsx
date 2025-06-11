import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

const steps = [
  {
    title: "Create an Account",
    description: "Sign up for free and complete your profile to get started.",
    icon: "lucide:user-plus",
    color: "#0F43EE"
  },
  {
    title: "Discover Services",
    description: "Browse through thousands of services or post a request.",
    icon: "lucide:search",
    color: "#FCE90D"
  },
  {
    title: "Hire Freelancers",
    description: "Choose the perfect freelancer for your project and collaborate.",
    icon: "lucide:handshake",
    color: "#0F43EE"
  },
  {
    title: "Complete Project",
    description: "Approve the work and release payment when satisfied.",
    icon: "lucide:check-circle",
    color: "#FCE90D"
  }
];

export const HowItWorksSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();
  
  // Get translated step content based on current language
  const getStepContent = (index: number) => {
    const currentLang = i18n.language;
    
    if (currentLang === 'sq') {
      // Use Albanian translations from the translation files
      return {
        title: t(`howItWorks.step${index + 1}.title`),
        description: t(`howItWorks.step${index + 1}.description`)
      };
    }
    
    // Default to English content from the steps array
    return {
      title: steps[index].title,
      description: steps[index].description
    };
  };
  
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-12">
        <motion.h2 
          className={`text-3xl md:text-4xl font-bold mb-4 section-title ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('howItWorks.title')} <span className={isDarkMode ? "text-white" : "text-gray-900"}>Beamly</span> {t('howItWorks.titleEnd')}
        </motion.h2>
        <motion.p 
          className={`max-w-2xl mx-auto section-subtitle ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('howItWorks.subtitle')}
        </motion.p>
      </div>
      
      <div className="glass-effect p-8 md:p-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 z-0">
                  <div className="w-full h-full bg-beamly-secondary bg-opacity-30 relative">
                    <div className="absolute -right-3 -top-1.5">
                      <Icon icon="lucide:chevron-right" className="text-beamly-secondary" />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: index % 2 === 0 ? 'rgba(15, 67, 238, 0.2)' : 'rgba(252, 233, 13, 0.2)' }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: index % 2 === 0 ? '#0F43EE' : '#FCE90D' }}>
                    <Icon icon={step.icon} className="text-2xl" style={{ color: index % 2 === 0 ? 'white' : '#011241' }} />
                  </div>
                </div>
                <h3 className={`text-xl font-semibold mb-3 font-outfit ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getStepContent(index).title}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-outfit font-light`}>
                  {getStepContent(index).description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};