import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/theme-context";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechCorp",
    image: "https://img.heroui.chat/image/avatar?w=100&h=100&u=sarah1",
    content: "Beamly has transformed how we find creative talent. The quality of work and speed of delivery has been exceptional."
  },
  {
    name: "Michael Chen",
    role: "Startup Founder",
    company: "InnovateLabs",
    image: "https://img.heroui.chat/image/avatar?w=100&h=100&u=michael1",
    content: "As a startup founder, Beamly has been invaluable. I've found amazing developers and designers who've helped bring my vision to life."
  },
  {
    name: "Jessica Williams",
    role: "Freelance Designer",
    company: "Self-employed",
    image: "https://img.heroui.chat/image/avatar?w=100&h=100&u=jessica1",
    content: "The zero commission policy is a game-changer! I've been able to grow my freelance business significantly since joining Beamly."
  }
];

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
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('testimonials.subtitle', 'Join thousands of satisfied clients and freelancers')}
        </motion.p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <div className={`${index === 1 ? 'yellow-glass' : 'glass-card'} p-6 h-full card-hover`}>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-beamly-secondary"
                />
                <div>
                  <h4 className={`font-semibold font-outfit ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-outfit font-light`}>{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
              <div className="mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon key={star} icon="lucide:star" className="inline-block text-beamly-secondary" />
                ))}
              </div>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-outfit font-light`}>"{testimonial.content}"</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};