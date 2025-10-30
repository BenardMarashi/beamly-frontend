import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

export const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: t('testimonials.roles.marketingDirector'),
      company: "TechCorp",
      content: t('testimonials.sarah')
    },
    {
      name: "Michael Chen",
      role: t('testimonials.roles.startupFounder'),
      company: "InnovateLabs",
      content: t('testimonials.michael')
    },
    {
      name: "Jessica Williams",
      role: t('testimonials.roles.freelancer'),
      company: t('testimonials.selfEmployed'),
      content: t('testimonials.jessica')
    }
  ];
  
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
        </motion.h2>
        <motion.p 
          className={`max-w-2xl mx-auto section-subtitle ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {t('testimonials.subtitle')}
        </motion.p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className={`h-full ${isDarkMode ? 'glass-card' : 'yellow-glass'} card-hover relative`}>
              <div className="p-6">
                {/* Quote Icon at the top */}
                <div className="mb-4">
                  <Icon 
                    icon="lucide:quote" 
                    className="text-beamly-secondary opacity-30" 
                    width={32} 
                  />
                </div>
                
                {/* Testimonial Content */}
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-100'} italic mb-6 text-base leading-relaxed`}>
                  "{testimonial.content}"
                </p>
                
                {/* Star Rating */}
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} icon="lucide:star" className="text-beamly-secondary" width={18} />
                  ))}
                </div>
                
                {/* Author Info - Now at the bottom without image */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-semibold text-white text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-gray-300">{testimonial.role}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};