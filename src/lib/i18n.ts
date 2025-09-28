import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from '../locales/en.json';
import sq from '../locales/sq.json';

const resources = {
  en: {
    translation: en
  },
  sq: {
    translation: sq
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'sq', // ← CHANGE: Set Albanian as default language
    fallbackLng: 'sq', // ← CHANGE: Set Albanian as fallback
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    detection: {
      // Order of detection methods - localStorage first!
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // Key name in localStorage
      lookupLocalStorage: 'i18nextLng',
    }
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  document.documentElement.lang = lng;
});

export default i18n;