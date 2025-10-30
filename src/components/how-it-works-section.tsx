import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

const steps = [
  {
    icon: "lucide:user-plus",
    color: "#0F43EE"
  },
  {
    icon: "lucide:search",
    color: "#FCE90D"  
  },
  {
    icon: "lucide:handshake",
    color: "#0F43EE"
  },
  {
    icon: "lucide:check-circle",
    color: "#FCE90D"
  }
];

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const getStepContent = (index: number) => {
    const stepNumber = index + 1;
    // Use client steps for landing page (they only have 4 steps which matches our icons)
    // Map step 4 icon to step 5 content (Complete & Review)
    if (stepNumber === 4) {
      return {
        title: t('howItWorks.clients.step5.title'),
        description: t('howItWorks.clients.step5.description')
      };
    }
    return {
      title: t(`howItWorks.clients.step${stepNumber}.title`),
      description: t(`howItWorks.clients.step${stepNumber}.description`)
    };
  };
  
  return (
    <section className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-8 md:mb-12">
        <motion.h2 
          className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 section-title ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('howItWorks.title')}
        </motion.h2>
        <motion.p 
          className={`max-w-2xl mx-auto section-subtitle text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('howItWorks.subtitle')}
        </motion.p>
      </div>
      
      <div className="glass-effect p-6 md:p-8 lg:p-12 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="relative"
            >
              {/* Arrow connector for desktop - hidden on mobile */}
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
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-3 md:mb-4"
                  style={{ backgroundColor: index % 2 === 0 ? 'rgba(15, 67, 238, 0.2)' : 'rgba(252, 233, 13, 0.2)' }}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: index % 2 === 0 ? '#0F43EE' : '#FCE90D' }}
                  >
                    <Icon icon={step.icon} className="text-xl md:text-2xl" 
                      style={{ color: index % 2 === 0 ? 'white' : '#011241' }} 
                    />
                  </div>
                </div>
                <h3 className={`text-lg md:text-xl font-semibold mb-2 md:mb-3 font-outfit ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getStepContent(index).title}
                </h3>
                <p className={`text-sm md:text-base font-outfit font-light ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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