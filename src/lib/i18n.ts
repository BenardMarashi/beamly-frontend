import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from '../locales/en.json';
import sq from '../locales/sq.json'; // Albanian translations (renamed from al.json)

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
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: true, // Enable debug to see what's happening
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false,
    },
    
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // Keys or params to lookup language from
      lookupLocalStorage: 'i18nextLng',
    }
  });

// Log current language on initialization
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  // Update HTML lang attribute
  document.documentElement.lang = lng;
});

export default i18n;