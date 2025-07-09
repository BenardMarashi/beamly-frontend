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
      image: "https://img.heroui.chat/image/avatar?w=100&h=100&u=sarah1",
      content: t('testimonials.sarah')
    },
    {
      name: "Michael Chen",
      role: t('testimonials.roles.startupFounder'),
      company: "InnovateLabs",
      image: "https://img.heroui.chat/image/avatar?w=100&h=100&u=michael1",
      content: t('testimonials.michael')
    },
    {
      name: "Jessica Williams",
      role: t('testimonials.roles.freelancer'),
      company: t('testimonials.selfEmployed'),
      image: "https://img.heroui.chat/image/avatar?w=100&h=100&u=jessica1",
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
          {t('testimonials.title')} <span className="text-beamly-secondary">{t('testimonials.users')}</span> {t('testimonials.say')}
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
            <div className={`h-full ${isDarkMode ? 'glass-card' : 'yellow-glass'} card-hover`}>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-300">{testimonial.role}</p>
                    <p className="text-xs text-gray-400">{testimonial.company}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} icon="lucide:star" className="text-beamly-secondary" width={16} />
                  ))}
                </div>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-100'} italic`}>
                  "{testimonial.content}"
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};