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
    fallbackLng: 'sq', // Albanian as fallback only
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    }
  });

i18n.on('languageChanged', (lng: string) => {
  console.log('Language changed to:', lng);
  document.documentElement.lang = lng;
});

export default i18n;